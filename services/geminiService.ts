import { QuoteItem, PriceSuggestion } from '../types';
import { calculateMarketBaseline } from './marketEstimator';

export const generateQuoteNotes = async (items: QuoteItem[], customerName: string): Promise<string> => {
  try {
    const response = await fetch('/api/ai/generate-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items, customerName }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.text) {
        return data.text;
      }
    }
  } catch (error) {
    // Continua para o gerador de mensagem amigável abaixo
  }

  const itemsCount = items.length;
  const targetName = customerName ? `Prezado(a) ${customerName}` : 'Prezado(a) cliente';
  const mainService = items[0]?.name ? ` para ${items[0].name}${itemsCount > 1 ? ` e outros ${itemsCount - 1} itens` : ''}` : '';

  return `${targetName}, agradecemos a oportunidade de apresentar este orçamento${mainService}. Nosso compromisso é com a qualidade técnica, pontualidade e transparência. Ficamos à inteira disposição para eventuais dúvidas e para agendarmos a execução dos trabalhos.`;
};

export const estimateServicePrice = async (
  serviceDescription: string,
  cityOrRegion?: string,
  additionalDetails?: string
): Promise<PriceSuggestion> => {
  // 1. Tenta chamar o endpoint de IA caso o servidor backend esteja presente
  try {
    const response = await fetch('/api/ai/estimate-price', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceDescription,
        cityOrRegion,
        additionalDetails,
      }),
    });

    if (response.ok) {
      const data: PriceSuggestion = await response.json();
      if (data && typeof data.suggestedPrice === 'number' && data.suggestedPrice > 0) {
        return data;
      }
    }
  } catch (err) {
    // Em hospedagens estáticas (onde /api/ai/estimate-price retorna 404 ou conexão falha),
    // prossegue imediatamente para o motor de precificação integrado.
  }

  // 2. Motor de Precificação de Mercado Integrado (Client-Side & Produção)
  // Garante funcionamento instantâneo em qualquer hospedagem (Vercel, Netlify, Hostinger, Firebase, etc.)
  // calculando com base na média praticada por prestadores autônomos no Brasil.
  return calculateMarketBaseline(serviceDescription, cityOrRegion, additionalDetails);
};
