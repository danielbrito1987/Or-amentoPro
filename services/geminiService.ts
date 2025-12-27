
import { GoogleGenAI } from "@google/genai";
import { QuoteItem } from "../types";

export const generateQuoteNotes = async (items: QuoteItem[], customerName: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const itemsList = items.map(i => `${i.quantity}x ${i.description}`).join(', ');
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Escreva uma breve e profissional mensagem de agradecimento e observações técnicas para um orçamento destinado a ${customerName}. 
      Os itens são: ${itemsList}. 
      Seja cordial, profissional e sucinto em português. 
      Foque no valor entregue pelo serviço/produto.`,
    });

    return response.text || "Obrigado pela oportunidade de apresentar esta proposta.";
  } catch (error) {
    console.error("Error generating notes:", error);
    return "Obrigado pela oportunidade de apresentar esta proposta. Ficamos à disposição para dúvidas.";
  }
};
