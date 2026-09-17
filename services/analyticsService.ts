// Serviço centralizado de Analytics para Google Analytics 4 (GA4 - gtag.js)
// Seguro contra ad-blockers: não lança erros se a tag estiver ausente ou bloqueada

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const analyticsService = {
  /**
   * Dispara um evento genérico para o Google Analytics
   */
  trackEvent: (eventName: string, params: Record<string, any> = {}): void => {
    try {
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', eventName, params);
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[GA4 Event] ${eventName}:`, params);
        }
      }
    } catch (err) {
      // Falha silenciosa para nunca interromper a experiência do usuário
      console.warn('[GA4 Track Warning]', err);
    }
  },

  /**
   * Disparado quando um novo usuário se cadastra no sistema (Início do Teste Grátis de 7 dias)
   */
  trackSignUp: (options: { 
    method?: string; 
    plan?: string; 
    billingCycle?: string; 
    hasPartnerCode?: boolean; 
  } = {}): void => {
    analyticsService.trackEvent('sign_up', {
      method: options.method || 'email',
      plan: options.plan || 'pro',
      billing_cycle: options.billingCycle || 'monthly',
      has_partner: Boolean(options.hasPartnerCode),
      value: 0,
      currency: 'BRL'
    });
  },

  /**
   * Disparado quando um usuário faz login no sistema
   */
  trackLogin: (method: string = 'email'): void => {
    analyticsService.trackEvent('login', {
      method
    });
  },

  /**
   * Disparado quando um orçamento é criado e salvo
   */
  trackCreateQuote: (quote: { total: number; number?: string; itemsLength?: number }): void => {
    analyticsService.trackEvent('generate_lead', {
      event_category: 'quote',
      event_label: quote.number || 'Orçamento',
      value: quote.total,
      currency: 'BRL',
      items_count: quote.itemsLength || 1
    });

    // Evento personalizado direto
    analyticsService.trackEvent('create_quote', {
      quote_number: quote.number,
      value: quote.total,
      currency: 'BRL',
      items_count: quote.itemsLength || 1
    });
  },

  /**
   * Disparado quando o usuário baixa o PDF do orçamento
   */
  trackPdfDownload: (quote: { total: number; number: string }): void => {
    analyticsService.trackEvent('file_download', {
      file_name: `Orcamento_${quote.number}.pdf`,
      file_extension: 'pdf',
      value: quote.total,
      currency: 'BRL'
    });

    analyticsService.trackEvent('download_quote_pdf', {
      quote_number: quote.number,
      value: quote.total,
      currency: 'BRL'
    });
  },

  /**
   * Disparado quando o usuário clica para compartilhar o orçamento no WhatsApp
   */
  trackWhatsAppShare: (quote: { total: number; number: string }): void => {
    analyticsService.trackEvent('share', {
      method: 'whatsapp',
      content_type: 'quote',
      item_id: quote.number,
      value: quote.total,
      currency: 'BRL'
    });

    analyticsService.trackEvent('whatsapp_quote_share', {
      quote_number: quote.number,
      value: quote.total,
      currency: 'BRL'
    });
  },

  /**
   * Disparado quando o usuário clica em assinar ou no paywall para contratar um plano
   */
  trackBeginCheckout: (plan: string, cycle: string, price: number): void => {
    analyticsService.trackEvent('begin_checkout', {
      value: price,
      currency: 'BRL',
      items: [
        {
          item_name: `Plano ${plan.toUpperCase()}`,
          item_category: 'subscription',
          price: price,
          quantity: 1
        }
      ],
      plan_name: plan,
      billing_cycle: cycle
    });
  },

  /**
   * Disparado quando o usuário copia a chave PIX no paywall
   */
  trackPixCopy: (plan: string, cycle: string, price: number): void => {
    analyticsService.trackEvent('copy_pix_key', {
      plan,
      billing_cycle: cycle,
      value: price,
      currency: 'BRL'
    });
  },

  /**
   * Disparado quando o usuário clica para avisar no WhatsApp que pagou a assinatura
   */
  trackNotifyPaymentWhatsApp: (plan: string, cycle: string, price: number): void => {
    analyticsService.trackEvent('notify_payment_whatsapp', {
      plan,
      billing_cycle: cycle,
      value: price,
      currency: 'BRL'
    });
  },

  /**
   * Disparado quando o usuário gera um contrato digital
   */
  trackContractGenerated: (contractNumber: string): void => {
    analyticsService.trackEvent('generate_contract', {
      contract_number: contractNumber
    });
  }
};
