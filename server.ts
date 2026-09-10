import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('A variável GEMINI_API_KEY não está configurada no servidor.');
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

// Executa geração com fallback automático entre gemini-3.8-flash e gemini-3.1-flash-lite
async function generateContentWithFallback(contents: any, config?: any) {
  const ai = getGeminiClient();
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      console.warn(`Tentativa com modelo ${model} retornou erro, tentando próximo:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('Não foi possível obter resposta da IA no momento.');
}

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
    try {
      const { serviceDescription, cityOrRegion, additionalDetails } = req.body;
      if (!serviceDescription || typeof serviceDescription !== 'string' || !serviceDescription.trim()) {
        res.status(400).json({ error: 'O nome ou descrição do serviço é obrigatório.' });
        return;
      }

      const ai = getGeminiClient();

      const prompt = `Você é um consultor especialista em precificação de serviços e mão de obra autônoma no Brasil (prestadores de serviços como eletricistas, encanadores, pintores, pedreiros, técnicos de TI, montadores de móveis, diaristas, marceneiros, serralheiros, etc.).
O prestador de serviços quer saber quanto cobrar de forma justa e lucrativa por um serviço.

Informações fornecidas pelo prestador:
- Serviço a executar: "${serviceDescription.trim()}"
${cityOrRegion ? `- Localidade / Cidade / Estado: "${cityOrRegion.trim()}"` : '- Localidade: Média de mercado no Brasil'}
${additionalDetails ? `- Detalhes do escopo / complexidade: "${additionalDetails.trim()}"` : ''}

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
- "suggestedPrice", "minPrice" e "maxPrice" devem ser números decimais (ex: 180.00, sem símbolo R$).
- "unit" deve ser a unidade mais adequada (ex: "un", "m²", "hora", "diária", "ponto", "serviço").
- As explicações e dicas devem ser em português do Brasil, práticas e úteis para o profissional fechar o serviço com lucro.`;

      const response = await generateContentWithFallback(prompt, {
        responseMimeType: 'application/json',
      });

      const rawText = response.text || '{}';
      const cleanedJson = rawText.replace(/```json\s*|\s*```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      const suggestedPrice = Number(parsed.suggestedPrice) || 150;
      const minPrice = Number(parsed.minPrice) || Math.round(suggestedPrice * 0.8);
      const maxPrice = Number(parsed.maxPrice) || Math.round(suggestedPrice * 1.3);

      res.json({
        serviceName: parsed.serviceName || serviceDescription,
        suggestedPrice,
        minPrice,
        maxPrice,
        unit: parsed.unit || 'un',
        estimatedHours: parsed.estimatedHours || '1 a 2 horas',
        justification: parsed.justification || 'Valor sugerido com base na média de mercado para mão de obra autônoma.',
        tips: Array.isArray(parsed.tips) && parsed.tips.length > 0 ? parsed.tips : [
          'Confira se há custos de materiais ou peças adicionais para incluir na proposta.',
          'Em caso de deslocamento longo, considere cobrar taxa adicional.'
        ],
      });
    } catch (err: any) {
      console.error('Erro na estimativa de preço via Gemini:', err);
      res.status(500).json({
        error: err.message || 'Erro ao calcular a estimativa com a IA.',
      });
    }
  });

  // Rota de Geração de Notas / Observações do Orçamento com IA
  app.post('/api/ai/generate-notes', async (req, res) => {
    try {
      const { items, customerName } = req.body;
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
      console.error('Erro na geração de observações via Gemini:', err);
      res.json({
        text: 'Obrigado pela oportunidade de apresentar esta proposta. Ficamos à inteira disposição para eventuais dúvidas e esclarecimentos.',
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
