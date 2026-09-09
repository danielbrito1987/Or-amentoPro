import React, { useState } from 'react';
import { 
  ShieldAlert, 
  LogOut, 
  Copy, 
  Check, 
  Send, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  QrCode, 
  Lock,
  MessageCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from './Button';
import { saasService } from '../services/saasService';
import { formatCurrency } from '../utils/formatters';

interface SubscriptionPaywallModalProps {
  userEmail?: string;
  userName?: string;
  onLogout: () => void;
  onCheckStatus?: () => void;
}

export const SubscriptionPaywallModal: React.FC<SubscriptionPaywallModalProps> = ({
  userEmail,
  userName,
  onLogout,
  onCheckStatus
}) => {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const pixKey = saasService.getPixKey();
  const price = saasService.getMonthlyPrice();

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleNotifyWhatsApp = () => {
    const text = encodeURIComponent(
      `Olá! Realizei o pagamento via PIX da assinatura mensal do OrçaFácil Pro (R$ 59,90) para o e-mail cadastrado: ${userEmail || ''}. Poderia confirmar a liberação do meu acesso, por gentileza?`
    );
    window.open(`https://wa.me/55?text=${text}`, '_blank');
  };

  const handleCheck = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      if (onCheckStatus) onCheckStatus();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full my-auto shadow-2xl border border-slate-200 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Faixa superior de destaque */}
        <div className="h-2.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500" />

        <div className="p-6 sm:p-8">
          {/* Tag de Status */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 mb-4">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Período de Teste Grátis (7 Dias) Expirou</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
            Continue criando orçamentos profissionais
          </h2>
          
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Esperamos que tenha gostado da facilidade do <strong className="text-slate-800">OrçaFácil Pro</strong>! Para continuar emitindo propostas ilimitadas e enviando orçamentos em PDF com a sua marca, ative sua assinatura mensal.
          </p>

          {/* Card de Preço e Benefícios */}
          <div className="bg-gradient-to-b from-blue-50/70 to-indigo-50/40 border border-blue-200/80 rounded-2xl p-5 mb-6 text-left">
            <div className="flex items-center justify-between border-b border-blue-200/60 pb-3 mb-3">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
                  Plano Profissional Ilimitado
                </span>
                <span className="text-xs text-slate-500">Acesso completo mensal</span>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-blue-700">
                  {formatCurrency(price)}
                </span>
                <span className="text-xs font-semibold text-slate-500 block">/mês</span>
              </div>
            </div>

            <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Orçamentos e propostas em PDF ilimitados</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Envio rápido de orçamentos pelo WhatsApp</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Consultor de Preços com Inteligência Artificial</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Seus dados e histórico salvos com total segurança</span>
              </li>
            </ul>
          </div>

          {/* Bloco de Pagamento PIX */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-left mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-blue-600" />
                Pagamento via PIX:
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Liberação Manual Rápida
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
              <div className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-800 break-all select-all font-semibold">
                {pixKey}
              </div>
              <Button
                type="button"
                variant={copied ? 'primary' : 'secondary'}
                size="sm"
                onClick={handleCopyPix}
                className="shrink-0 font-bold"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-white" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1 text-slate-600" />
                    Copiar Chave PIX
                  </>
                )}
              </Button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              * Ao fazer o PIX de <strong>{formatCurrency(price)}</strong>, envie o comprovante no WhatsApp informando seu e-mail cadastrado (<strong>{userEmail}</strong>) para ativarmos seu acesso na hora.
            </p>
          </div>

          {/* Ações */}
          <div className="space-y-2.5">
            <Button
              id="btn-confirm-whatsapp"
              onClick={handleNotifyWhatsApp}
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20"
              icon={<MessageCircle className="w-5 h-5 text-white" />}
            >
              Já paguei, enviar comprovante no WhatsApp
            </Button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="secondary"
                size="md"
                onClick={handleCheck}
                disabled={checking}
                className="w-full font-semibold text-xs sm:text-sm"
                icon={<RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />}
              >
                {checking ? 'Verificando...' : 'Verificar Acesso'}
              </Button>

              <Button
                variant="ghost"
                size="md"
                onClick={onLogout}
                className="w-full font-semibold text-xs sm:text-sm text-slate-500 hover:text-slate-800"
                icon={<LogOut className="w-4 h-4" />}
              >
                Sair da Conta
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
