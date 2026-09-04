import { Quote } from "../types";

export const mapQuoteToCreateBudgetDto = (quote: Quote, companyId: string) => ({
    companyId,
    clientName: quote.customerName,
    clientPhone: quote.customerPhone,
    clientEmail: quote.customerEmail,
    address: quote.customerAddress,
    city: quote.customerCity,
    state: quote.customerState,
    notes: quote.notes,
    items: (quote.items || []).map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
    })),
});