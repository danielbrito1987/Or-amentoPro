import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Executa chamada à IA com retry em caso de 503/429 e fallback em cascata
async function generateContentWithFallback(contents: any, config?: any) {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('Chave da API Gemini não configurada neste ambiente.');
  }
  const models = [
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash',
    'gemini-3.1-pro-preview',
  ];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const callPromise = ai.models.generateContent({
          model,
          contents,
          config,
        });

        // Timeout individual de 7 segundos
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout ao consultar ${model}`)), 7000)
        );

        const response: any = await Promise.race([callPromise, timeoutPromise]);
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const status = err?.status || (err?.error && err.error.code);
        // Se for alta demanda temporária (503) ou rate limit (429), tenta mais uma vez rapidamente
        if (attempt === 1 && (status === 503 || status === 429)) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        console.log(`[AI Advisor] Modelo ${model} alternado:`, status || err?.message || 'erro');
        break;
      }
    }
  }

  throw lastError || new Error('Modelos de IA temporariamente indisponíveis.');
}

import { calculateMarketBaseline, normalizeUnit } from './services/marketEstimator';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Rota de Estimativa de Preço com IA
  app.post('/api/ai/estimate-price', async (req, res) => {
    const { serviceDescription, cityOrRegion, additionalDetails } = req.body || {};
    if (!serviceDescription || typeof serviceDescription !== 'string' || !serviceDescription.trim()) {
      res.status(400).json({ error: 'O nome ou descrição do serviço é obrigatório.' });
      return;
    }

    const cleanService = serviceDescription.trim();
    const cleanCity = (cityOrRegion || '').trim();
    const cleanDetails = (additionalDetails || '').trim();

    // 1. Tentar primeiro via Gemini
    try {
      const prompt = `Você é um consultor especialista em precificação de serviços e mão de obra autônoma no Brasil (prestadores de serviços como eletricistas, encanadores, pintores, pedreiros, técnicos de TI, montadores de móveis, diaristas, marceneiros, serralheiros, etc.).
O prestador de serviços quer saber quanto cobrar de forma justa e lucrativa por um serviço.

Informações fornecidas pelo prestador:
- Serviço a executar: "${cleanService}"
${cleanCity ? `- Localidade / Cidade / Estado: "${cleanCity}"` : '- Localidade: Média de mercado no Brasil'}
${cleanDetails ? `- Detalhes do escopo / complexidade: "${cleanDetails}"` : ''}

Forneça uma estimativa realista e detalhada em Reais (R$).
Considere tempo médio de execução, desgaste de ferramentas, responsabilidade técnica, deslocamento e margem saudável de lucro.

Retorne ESTRITAMENTE um JSON no seguinte formato:
{
  "serviceName": "Nome profissional e padronizado do serviço",
  "suggestedPrice": 180.00,
  "minPrice": 140.00,
  "maxPrice": 230.00,
  "unit": "un",
  "estimatedHours": "1 a 2 horas",
  "justification": "Explicação concisa e clara em 1 a 2 frases do motivo deste valor no mercado atual.",
  "tips": [
    "Dica prática de cobrança ou verificação no local 1",
    "Dica prática de cobrança ou verificação no local 2"
  ]
}

Atenção:
- "suggestedPrice", "minPrice" e "maxPrice" devem ser números (ex: 180.00, sem símbolo de moeda).
- "unit" deve ser apenas a sigla ou nome da unidade de medida SEM números (ex: "un", "m²", "hora", "diária", "ponto", "serviço"). NUNCA use "BRL", "R$" ou números na unidade como "3 un".
- As explicações e dicas devem ser em português do Brasil, práticas e úteis para o profissional fechar o serviço com lucro.`;

      const response = await generateContentWithFallback(prompt, {
        responseMimeType: 'application/json',
      });

      const rawText = response.text || '{}';
      const cleanedJson = rawText.replace(/```json\s*|\s*```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      let suggestedPrice = Number(parsed.suggestedPrice);
      if (!suggestedPrice || isNaN(suggestedPrice)) {
        suggestedPrice = 160;
      }
      let minPrice = Number(parsed.minPrice) || Math.round(suggestedPrice * 0.75);
      let maxPrice = Number(parsed.maxPrice) || Math.round(suggestedPrice * 1.35);

      // Normaliza unidade para padrão limpo (sem números)
      const unit = normalizeUnit(parsed.unit);
      const parsedQuantity = Number(parsed.quantity) || 1;
      const unitPrice = parsedQuantity > 1 
        ? Math.round((suggestedPrice / parsedQuantity) * 100) / 100 
        : suggestedPrice;

      res.json({
        serviceName: parsed.serviceName || cleanService,
        suggestedPrice,
        minPrice,
        maxPrice,
        unit,
        quantity: parsedQuantity,
        unitPrice,
        estimatedHours: parsed.estimatedHours || '1 a 2 horas',
        justification: parsed.justification || 'Valor calculado com base nos custos operacionais e média do mercado.',
        tips: Array.isArray(parsed.tips) && parsed.tips.length > 0 ? parsed.tips : [
          'Confira se há custos de materiais adicionais para incluir na proposta.',
          'Em caso de deslocamento longo, considere cobrar taxa adicional de combustível/visita.',
        ],
      });
      return;
    } catch (err: any) {
      console.log('[AI Advisor] Ativando estimador de mercado de contingência.');
      // Contingência inteligente: nunca deixa o usuário sem resposta
      const fallbackEstimate = calculateMarketBaseline(cleanService, cleanCity, cleanDetails);
      res.json(fallbackEstimate);
    }
  });

  // Rota de Geração de Notas / Observações do Orçamento com IA
  app.post('/api/ai/generate-notes', async (req, res) => {
    try {
      const { items, customerName } = req.body || {};
      const itemsList = Array.isArray(items) 
        ? items.map((i: any) => `${i.quantity || 1}x ${i.name || ''}`).filter(Boolean).join(', ')
        : '';

      const prompt = `Escreva uma breve e profissional mensagem de agradecimento e observações técnicas para um orçamento destinado a ${customerName || 'Cliente'}. 
Os itens são: ${itemsList || 'Serviços especializados'}. 
Seja cordial, profissional e sucinto em português do Brasil. 
Foque no valor entregue pelo serviço/produto e transparência.`;

      const response = await generateContentWithFallback(prompt);

      const text = response.text || 'Obrigado pela oportunidade de apresentar esta proposta. Ficamos à inteira disposição para eventuais dúvidas.';
      res.json({ text });
    } catch (err: any) {
      console.log('[AI Advisor] Fallback em observações ativado.');
      res.json({
        text: 'Agradecemos a oportunidade de apresentar este orçamento. Nosso compromisso é com a qualidade técnica, pontualidade e transparência. Ficamos à inteira disposição para eventuais dúvidas e para agendar o início dos trabalhos.',
      });
    }
  });

  // Vite middleware no desenvolvimento ou arquivos estáticos na produção
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
