
import React from 'react';
import { ShieldAlert, LogOut, MessageCircle, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface AccountSuspendedModalProps {
  reason?: string;
  onLogout: () => void;
  userEmail?: string;
}

export const AccountSuspendedModal: React.FC<AccountSuspendedModalProps> = ({
  reason,
  onLogout,
  userEmail
}) => {
  const defaultReason = reason || 'Sua assinatura ou período de acesso expirou. Entre em contato com o administrador para regularizar seu plano e reativar sua conta.';
  
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-rose-100 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Decorative Top Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

        <div className="w-16 h-16 bg-rose-50 border-4 border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-rose-600 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100/70 text-rose-700 mb-3">
          <AlertTriangle className="w-3.5 h-3.5" />
          Acesso Temporariamente Suspenso
        </span>

        <h2 className="text-2xl font-black text-slate-900 mb-2">
          Conta Desabilitada
        </h2>

        {userEmail && (
          <p className="text-xs text-slate-400 font-mono mb-4">
            {userEmail}
          </p>
        )}

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Motivo do Bloqueio:
          </p>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {defaultReason}
          </p>
        </div>

        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Seus dados e orçamentos continuam salvos com segurança. Para restabelecer o acesso imediatamente, efetue o acerto da sua fatura com o administrador.
        </p>

        <div className="space-y-2.5">
          <Button
            id="btn-suspended-logout"
            onClick={onLogout}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair e Voltar ao Início</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
