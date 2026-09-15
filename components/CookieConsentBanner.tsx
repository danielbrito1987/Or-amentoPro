import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, Check, X } from 'lucide-react';

interface CookieConsentBannerProps {
  onOpenPrivacyPolicy: () => void;
}

const COOKIE_CONSENT_KEY = 'orcafacil_cookie_consent_v1';

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onOpenPrivacyPolicy
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        // Pequeno delay para animação de entrada suave
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Se localStorage não estiver disponível, não quebra a aplicação
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
        choice: 'all',
        date: new Date().toISOString()
      }));
    } catch {}
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
        choice: 'essential',
        date: new Date().toISOString()
      }));
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside 
      aria-label="Aviso de Cookies e Privacidade"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-black/60 text-white space-y-3 ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Cookie className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>Privacidade & Cookies</span>
                <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                  LGPD
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Respeitamos a sua privacidade e os seus dados.
              </p>
            </div>
          </div>

          <button
            id="btn-close-cookie-banner-x"
            onClick={handleAcceptEssential}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors"
            title="Aceitar apenas essenciais e fechar"
            aria-label="Aceitar apenas essenciais e fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Utilizamos cookies estritamente necessários e armazenamento local seguro para manter você conectado, garantir o funcionamento offline na obra e auditar assinaturas contratuais. Não vendemos seus dados nem fazemos anúncios de terceiros.
        </p>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onOpenPrivacyPolicy}
            className="text-blue-400 hover:text-blue-300 underline font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ver Política de Privacidade completa</span>
          </button>
        </div>

        <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            id="btn-cookie-accept-all"
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 py-2 px-3.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Aceitar Todos</span>
          </button>

          <button
            id="btn-cookie-accept-essential"
            type="button"
            onClick={handleAcceptEssential}
            className="py-2 px-3 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all active:scale-95 cursor-pointer text-center"
          >
            Apenas Essenciais
          </button>
        </div>
      </div>
    </aside>
  );
};
