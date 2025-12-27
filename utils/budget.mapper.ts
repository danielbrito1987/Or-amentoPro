import { Quote } from "../types";

export const mapQuoteToCreateBudgetDto = (quote: Quote, companyId: string) => ({
    companyId,
    clientName: quote.clientName,
    clientPhone: quote.clientPhone,
    clientEmail: quote.clientEmail,
    address: quote.address,
    city: quote.city,
    state: quote.state,
    notes: quote.notes,
    items: quote.items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.value,
    })),
});