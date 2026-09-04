import { GoogleGenAI } from "@google/genai";
import { QuoteItem, PriceSuggestion } from "../types";

const getGenAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Chave de API do Gemini não configurada.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateQuoteNotes = async (items: QuoteItem[], customerName: string) => {
  try {
    const ai = getGenAIClient();
    const itemsList = items.map(i => `${i.quantity}x ${i.name}`).join(', ');
    
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Escreva uma breve e profissional mensagem de agradecimento e observações técnicas para um orçamento destinado a ${customerName || 'Cliente'}. 
      Os itens são: ${itemsList || 'Serviços especializados'}. 
      Seja cordial, profissional e sucinto em português. 
      Foque no valor entregue pelo serviço/produto.`,
    });

    return response.text || "Obrigado pela oportunidade de apresentar esta proposta.";
  } catch (error) {
    console.error("Error generating notes:", error);
    return "Obrigado pela oportunidade de apresentar esta proposta. Ficamos à inteira disposição para eventuais dúvidas.";
  }
};

export const estimateServicePrice = async (
  serviceDescription: string,
  cityOrRegion?: string,
  additionalDetails?: string
): Promise<PriceSuggestion> => {
  try {
    const ai = getGenAIClient();
    
    const prompt = `Você é um consultor especialista em precificação de serviços e mão de obra autônoma no Brasil (prestadores de serviços como eletricistas, encanadores, pintores, pedreiros, técnicos de TI, montadores de móveis, diaristas, marceneiros, serralheiros, etc.).
O prestador de serviços quer saber quanto cobrar de forma justa e lucrativa por um serviço.

Informações fornecidas pelo prestador:
- Serviço a executar: "${serviceDescription}"
${cityOrRegion ? `- Localidade / Cidade / Estado: "${cityOrRegion}"` : '- Localidade: Média de mercado no Brasil'}
${additionalDetails ? `- Detalhes do escopo / complexidade: "${additionalDetails}"` : ''}

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

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const rawText = response.text || "{}";
    const cleanedJson = rawText.replace(/```json\s*|\s*```/g, '').trim();
    const parsed = JSON.parse(cleanedJson);

    return {
      serviceName: parsed.serviceName || serviceDescription,
      suggestedPrice: Number(parsed.suggestedPrice) || 150,
      minPrice: Number(parsed.minPrice) || (Number(parsed.suggestedPrice) * 0.8) || 120,
      maxPrice: Number(parsed.maxPrice) || (Number(parsed.suggestedPrice) * 1.3) || 200,
      unit: parsed.unit || 'un',
      estimatedHours: parsed.estimatedHours || '1 a 2 horas',
      justification: parsed.justification || 'Valor sugerido com base na média de mercado para mão de obra autônoma.',
      tips: Array.isArray(parsed.tips) ? parsed.tips : [
        'Confira se há custos de materiais ou peças adicionais para incluir na proposta.',
        'Em caso de deslocamento longo, considere cobrar taxa adicional.'
      ]
    };
  } catch (error: any) {
    console.error("Erro ao estimar preço com IA:", error);
    throw new Error(error.message || "Não foi possível obter a estimativa no momento.");
  }
};
