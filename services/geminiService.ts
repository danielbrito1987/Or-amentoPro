import { QuoteItem, PriceSuggestion } from '../types';

export const generateQuoteNotes = async (items: QuoteItem[], customerName: string): Promise<string> => {
  try {
    const response = await fetch('/api/ai/generate-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items, customerName }),
    });

    if (!response.ok) {
      throw new Error(`Servidor retornou status ${response.status}`);
    }

    const data = await response.json();
    return data.text || 'Obrigado pela oportunidade de apresentar esta proposta. Ficamos à inteira disposição para eventuais dúvidas.';
  } catch (error) {
    console.warn('Fallback nas observações de IA:', error);
    return 'Obrigado pela oportunidade de apresentar esta proposta. Ficamos à inteira disposição para eventuais dúvidas e esclarecimentos.';
  }
};

export const estimateServicePrice = async (
  serviceDescription: string,
  cityOrRegion?: string,
  additionalDetails?: string
): Promise<PriceSuggestion> => {
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

  if (!response.ok) {
    let errorMsg = 'Não foi possível calcular a estimativa.';
    try {
      const errData = await response.json();
      if (errData?.error) {
        errorMsg = errData.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const data: PriceSuggestion = await response.json();
  return data;
};
