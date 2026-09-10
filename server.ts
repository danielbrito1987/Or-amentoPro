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

// Executa chamada à IA com retry em caso de 503/429 e fallback em cascata
async function generateContentWithFallback(contents: any, config?: any) {
  const ai = getGeminiClient();
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

// Motor de referência de mercado brasileiro para prestadores de serviços
// Garante que o prestador NUNCA fique na mão, mesmo se houver instabilidade ou 503 nos servidores do Google
interface MarketEstimate {
  serviceName: string;
  suggestedPrice: number;
  minPrice: number;
  maxPrice: number;
  unit: string;
  estimatedHours: string;
  justification: string;
  tips: string[];
}

function calculateMarketBaseline(
  serviceDescription: string,
  cityOrRegion?: string,
  additionalDetails?: string
): MarketEstimate {
  const text = `${serviceDescription} ${additionalDetails || ''}`.toLowerCase();
  const city = (cityOrRegion || '').toLowerCase();

  // Multiplicador regional de custo de vida e mão de obra
  let regionalMultiplier = 1.0;
  if (
    city.includes('são paulo') ||
    city.includes('sp') ||
    city.includes('rio de janeiro') ||
    city.includes('rj') ||
    city.includes('brasília') ||
    city.includes('brasilia') ||
    city.includes('df')
  ) {
    regionalMultiplier = 1.25;
  } else if (
    city.includes('curitiba') ||
    city.includes('florianópolis') ||
    city.includes('porto alegre') ||
    city.includes('belo horizonte') ||
    city.includes('campinas') ||
    city.includes('santos')
  ) {
    regionalMultiplier = 1.15;
  } else if (
    city.includes('salvador') ||
    city.includes('recife') ||
    city.includes('fortaleza') ||
    city.includes('goiânia') ||
    city.includes('manaus')
  ) {
    regionalMultiplier = 1.05;
  }

  // Identificação da categoria do serviço e tabela de referência
  let basePrice = 160;
  let minBase = 120;
  let maxBase = 220;
  let unit = 'un';
  let estimatedHours = '1 a 2 horas';
  let justification = 'Estimativa baseada na média praticada por prestadores de serviços autônomos para mão de obra qualificada.';
  let tips = [
    'Verifique previamente se o cliente já possui os materiais ou se estes deverão ser faturados à parte.',
    'Em caso de deslocamento superior a 15 km, acrescente uma taxa de visita ou transporte.',
  ];

  // 1. ELÉTRICA
  if (text.includes('chuveiro') || text.includes('ducha')) {
    basePrice = 150;
    minBase = 110;
    maxBase = 200;
    unit = 'un';
    estimatedHours = '1 a 1.5 horas';
    justification = 'Instalação de chuveiro exige testes de vazamento e conferência da bitola da fiação e disjuntor para evitar superaquecimento.';
    tips = [
      'Sempre teste a pressão da água e use conectores de porcelana ou Wago para maior segurança elétrica.',
      'Ligue a água fria primeiro antes de ligar a energia para não queimar a resistência.',
    ];
  } else if (text.includes('ventilador')) {
    basePrice = 180;
    minBase = 130;
    maxBase = 260;
    unit = 'un';
    estimatedHours = '1.5 a 2.5 horas';
    justification = 'Montagem e fixação em teto com balanceamento de pás e passagem de cabeamento para comando de parede ou controle.';
    tips = [
      'Verifique se a caixa no teto possui suporte reforçado para sustentar o peso e vibração do motor.',
      'Faça o balanceamento das pás para evitar ruídos e oscilações no funcionamento.',
    ];
  } else if (text.includes('tomada') || text.includes('interruptor')) {
    basePrice = 55;
    minBase = 40;
    maxBase = 80;
    unit = 'ponto';
    estimatedHours = '30 a 45 min por ponto';
    justification = 'Substituição ou instalação de ponto elétrico com aperto adequado de bornes e teste de continuidade.';
    tips = [
      'Para múltiplos pontos no mesmo imóvel, ofereça um desconto progressivo por quantidade.',
      'Verifique se a fiação é de 2.5mm² para tomadas comuns e 4mm² para equipamentos pesados.',
    ];
  } else if (text.includes('disjuntor') || text.includes('quadro') || text.includes('qdc')) {
    basePrice = 350;
    minBase = 250;
    maxBase = 550;
    unit = 'un';
    estimatedHours = '2 a 4 horas';
    justification = 'Serviço de alta responsabilidade técnica envolvendo equilíbrio de fases, aperto de barramentos e identificação de circuitos.';
    tips = [
      'Etiquete todos os circuitos no painel para facilitar futuras manutenções do cliente.',
      'Aperte as conexões com torque adequado para eliminar pontos quentes.',
    ];
  } else if (text.includes('luminária') || text.includes('lustre') || text.includes('pendente') || text.includes('led')) {
    basePrice = 110;
    minBase = 80;
    maxBase = 180;
    unit = 'un';
    estimatedHours = '1 a 2 horas';
    justification = 'Fixação segura com alinhamento estético e conexão elétrica isolada.';
    tips = [
      'Verifique a sustentação em tetos de gesso ou drywall antes de fixar luminárias pesadas.',
    ];
  }

  // 2. HIDRÁULICA
  else if (text.includes('torneira') || text.includes('sifão') || text.includes('sifao')) {
    basePrice = 120;
    minBase = 85;
    maxBase = 170;
    unit = 'un';
    estimatedHours = '45 min a 1.5 horas';
    justification = 'Troca e vedação com fita veda-rosca, alinhamento de cuba e teste de estanqueidade contra vazamentos.';
    tips = [
      'Substitua o anel de vedação e sempre verifique o estado da rosca do encanamento na parede.',
    ];
  } else if (text.includes('vaso') || text.includes('sanitário') || text.includes('sanitario') || text.includes('caixa acoplada')) {
    basePrice = 190;
    minBase = 140;
    maxBase = 270;
    unit = 'un';
    estimatedHours = '1.5 a 2.5 horas';
    justification = 'Fixação com parafusos de latão, anel de cera anti-odor e regulagem do mecanismo de descarga para economia de água.';
    tips = [
      'Inclua o anel de vedação de cera novo para garantir ausência total de odores e vazamentos na base.',
    ];
  } else if (text.includes('desentupir') || text.includes('desentupimento')) {
    basePrice = 240;
    minBase = 160;
    maxBase = 380;
    unit = 'serviço';
    estimatedHours = '1 a 2 horas';
    justification = 'Desobstrução manual ou com sonda mecânica preservando a integridade das tubulações de esgoto ou escoamento.';
    tips = [
      'Informe ao cliente que o valor pode variar caso a obstrução esteja na tubulação principal ou caixa de gordura.',
    ];
  }

  // 3. PINTURA
  else if (text.includes('pintura') || text.includes('pintar')) {
    if (text.includes('porta') || text.includes('portão') || text.includes('portao') || text.includes('grade')) {
      basePrice = 180;
      minBase = 130;
      maxBase = 260;
      unit = 'un';
      estimatedHours = '2 a 4 horas';
      justification = 'Lixamento prévio, remoção de ferrugem ou verniz antigo e aplicação de fundo preparador e esmalte sintético.';
      tips = ['Isole batentes, fechaduras e o piso ao redor para evitar respingos indesejados.'];
    } else {
      basePrice = 24;
      minBase = 18;
      maxBase = 32;
      unit = 'm²';
      estimatedHours = 'Variável conforme metragem';
      justification = 'Valor por metro quadrado considerando proteção de rodapés, emassamento de pequenas trincas e 2 demãos de tinta látex acrílica.';
      tips = [
        'Calcule a metragem total descontando apenas vãos maiores que 2m² para compensar o recorte de cantos.',
        'Se a parede tiver mofo ou umidade, inclua a lavagem com água sanitária ou fungicida antes da pintura.',
      ];
    }
  }

  // 4. AR-CONDICIONADO E CLIMATIZAÇÃO
  else if (text.includes('ar condicionado') || text.includes('ar-condicionado') || text.includes('split')) {
    if (text.includes('limpeza') || text.includes('higienização') || text.includes('higienizacao')) {
      basePrice = 220;
      minBase = 160;
      maxBase = 300;
      unit = 'un';
      estimatedHours = '1 a 2 horas';
      justification = 'Higienização completa da evaporadora com bactericida, lavagem de filtros e verificação da turbina e dreno.';
      tips = ['Ofereça planos de manutenção preventiva semestral para condomínios e residências.'];
    } else {
      basePrice = 580;
      minBase = 440;
      maxBase = 780;
      unit = 'un';
      estimatedHours = '3 a 5 horas';
      justification = 'Instalação técnica com fixação de suportes, isolamento térmico das linhas de cobre, vácuo com bomba e teste de drenagem.';
      tips = [
        'Exija ou forneça tubulação de cobre com espessura adequada para manter a garantia do fabricante do aparelho.',
      ];
    }
  }

  // 5. MONTAGEM DE MÓVEIS
  else if (text.includes('montagem') || text.includes('montador') || text.includes('móvel') || text.includes('movel')) {
    if (text.includes('guarda-roupa') || text.includes('guarda roupa') || text.includes('roupeiro')) {
      basePrice = 280;
      minBase = 200;
      maxBase = 420;
      unit = 'un';
      estimatedHours = '3 a 5 horas';
      justification = 'Montagem de estrutura grande, fixação de gavetas com corrediças telescópicas e alinhamento de portas de correr ou bater.';
      tips = ['Verifique o desnível do piso do quarto antes de fixar as portas para garantir que fiquem alinhadas.'];
    } else if (text.includes('painel') || text.includes('suporte') || text.includes('tv')) {
      basePrice = 130;
      minBase = 90;
      maxBase = 190;
      unit = 'un';
      estimatedHours = '1 a 1.5 horas';
      justification = 'Furação em alvenaria com buchas específicas, conferência de nível e passagem de cabos organizados.';
      tips = ['Certifique-se de não atingir canos hidráulicos ou conduítes elétricos na parede de fixação.'];
    } else {
      basePrice = 150;
      minBase = 100;
      maxBase = 220;
      unit = 'un';
      estimatedHours = '1 a 3 horas';
      justification = 'Montagem de móvel com ferragens adequadas, conferência de esquadro e regulagem de portas e gavetas.';
      tips = ['Abra os volumes sobre papelão para não riscar as peças nem o piso do cliente.'];
    }
  }

  // 6. PEDREIRO E ALVENARIA
  else if (text.includes('piso') || text.includes('porcelanato') || text.includes('azulejo') || text.includes('revestimento')) {
    basePrice = 75;
    minBase = 55;
    maxBase = 105;
    unit = 'm²';
    estimatedHours = 'Conforme área e paginação';
    justification = 'Mão de obra para assentamento nivelado com espaçadores, aplicação de argamassa colante e rejunte impermeável.';
    tips = [
      'Pisos em grandes formatos (ex: 80x80cm ou maior) demandam dupla colagem e niveladores de piso profissionais.',
    ];
  } else if (text.includes('pedreiro') || text.includes('diária') || text.includes('diaria')) {
    basePrice = 280;
    minBase = 220;
    maxBase = 360;
    unit = 'diária';
    estimatedHours = '8 horas / dia';
    justification = 'Valor correspondente à jornada padrão de um profissional experiente em reformas e alvenaria civil.';
    tips = ['Estabeleça por escrito a meta de produção diária e as tarefas incluídas na jornada.'];
  }

  // 7. LIMPEZA E DIARISTA
  else if (text.includes('faxina') || text.includes('limpeza') || text.includes('diarista')) {
    if (text.includes('pós-obra') || text.includes('pos obra')) {
      basePrice = 380;
      minBase = 280;
      maxBase = 550;
      unit = 'serviço';
      estimatedHours = '6 a 8 horas';
      justification = 'Remoção de resíduos pesados de tinta, argamassa e rejunte com produtos removedores e maquinário adequado.';
      tips = ['Avalie se será necessário utilizar esponjas macias para não riscar vidros e peças cromadas.'];
    } else {
      basePrice = 200;
      minBase = 160;
      maxBase = 260;
      unit = 'diária';
      estimatedHours = '6 a 8 horas';
      justification = 'Diária padrão de faxina residencial com higienização de banheiros, cozinha, pisos e superfícies.';
      tips = ['Combine previamente se a lavagem ou passagem de roupas está inclusa no valor da diária.'];
    }
  }

  // 8. INFORMÁTICA / REDES / CFTV
  else if (text.includes('computador') || text.includes('notebook') || text.includes('formatação') || text.includes('câmera') || text.includes('camera') || text.includes('cftv')) {
    basePrice = 160;
    minBase = 120;
    maxBase = 240;
    unit = 'serviço';
    estimatedHours = '1 a 3 horas';
    justification = 'Atendimento técnico com diagnóstico, testes de bancada e configuração segura do sistema.';
    tips = ['Sempre faça backup prévio de dados antes de qualquer intervenção em sistemas de clientes.'];
  }

  // Aplica o multiplicador regional arredondando para valores limpos
  const finalSuggested = Math.round((basePrice * regionalMultiplier) / 5) * 5;
  const finalMin = Math.round((minBase * regionalMultiplier) / 5) * 5;
  const finalMax = Math.round((maxBase * regionalMultiplier) / 5) * 5;

  return {
    serviceName: serviceDescription.trim(),
    suggestedPrice: finalSuggested,
    minPrice: finalMin,
    maxPrice: finalMax,
    unit,
    estimatedHours,
    justification,
    tips,
  };
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
- "unit" deve ser a unidade de cobrança (ex: "un", "m²", "hora", "diária", "ponto", "serviço"). NUNCA use "BRL" ou "R$".
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

      // Normaliza unidade
      let unit = String(parsed.unit || 'un').toLowerCase().trim();
      if (unit === 'brl' || unit === 'r$' || unit === 'reais' || unit === 'real') {
        unit = 'un';
      }

      res.json({
        serviceName: parsed.serviceName || cleanService,
        suggestedPrice,
        minPrice,
        maxPrice,
        unit,
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
