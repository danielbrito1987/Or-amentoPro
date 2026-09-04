
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { FileText, Mail, Lock, User as UserIcon, Loader2, AlertCircle, Sparkles, CheckCircle2, ArrowRight, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../services/supabase';

export const LoginPage: React.FC = () => {
  const { login, register, loginAsDemo } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('demo@orcafacil.com.br');
  const [password, setPassword] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email || !email.includes('@')) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }
    if (!password || password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Por favor, informe seu nome ou nome da sua empresa.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        const res = await register(email, password, name);
        if (res.message) {
          setSuccessMessage(res.message);
        }
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err?.message || 'Ocorreu um erro. Verifique suas credenciais e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setIsDemoLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await loginAsDemo();
    } catch (err: any) {
      setError('Erro ao iniciar demonstração: ' + (err?.message || 'Tente novamente.'));
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-300 relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3.5 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/25 mb-3">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">OrçaFácil</h1>
          <p className="text-slate-400 mt-1 text-sm">Sistema de orçamentos rápidos para prestadores de serviços</p>

          {isSupabaseConfigured() && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/40 rounded-full text-emerald-400 text-xs font-semibold">
              <Database className="w-3.5 h-3.5" />
              <span>Autenticação Supabase Conectada</span>
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl space-y-5">
          {/* Tabs: Entrar vs Criar Conta */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-sm font-semibold">
            <button
              id="tab-login"
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccessMessage(null); }}
              className={`py-2 rounded-xl transition-all ${mode === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Entrar
            </button>
            <button
              id="tab-register"
              type="button"
              onClick={() => { setMode('register'); setError(null); setSuccessMessage(null); }}
              className={`py-2 rounded-xl transition-all ${mode === 'register' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Criar Conta
            </button>
          </div>

          {/* Quick 1-Click Demo Login Banner */}
          {mode === 'login' && (
            <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-blue-900/40 border border-blue-500/30 rounded-2xl p-3.5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-blue-400 font-semibold text-xs uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Acesso Imediato para Testes</span>
              </div>
              <p className="text-xs text-slate-300 mb-2.5">
                Entrar com dados de serviços e orçamento já preenchidos.
              </p>
              <Button
                id="btn-quick-demo"
                type="button"
                onClick={handleDemoAccess}
                disabled={isDemoLoading || isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-sm"
              >
                {isDemoLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Iniciando demonstração...
                  </>
                ) : (
                  <>
                    <span>Entrar com Conta de Demonstração</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {mode === 'login' && (
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-xs text-slate-500 uppercase tracking-wider font-semibold shrink-0">
                Ou acesse com suas credenciais
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/25 text-red-400 p-3 rounded-xl text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">Nome Completo ou Empresa</label>
                <div className="relative group">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    id="input-register-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Carlos Silva Eletricista"
                    className="w-full bg-slate-800/80 border border-slate-700 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  id="input-login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@seuemail.com"
                  className="w-full bg-slate-800/80 border border-slate-700 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                Senha {mode === 'register' && '(mínimo 6 caracteres)'}
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  id="input-login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/80 border border-slate-700 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <Button
              id="btn-login-submit"
              type="submit"
              disabled={isLoading || isDemoLoading}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-base font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'register' ? 'Criando conta no Supabase...' : 'Entrando...'}
                </>
              ) : (
                mode === 'register' ? 'Cadastrar e Começar' : 'Entrar'
              )}
            </Button>
          </form>

          {!isSupabaseConfigured() && (
            <div className="pt-1 text-center">
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Modo de testes ativo: use qualquer e-mail e senha</span>
              </div>
            </div>
          )}
        </div>

        <p className="text-center mt-5 text-slate-500 text-xs">
          &copy; {new Date().getFullYear()} OrçaFácil Pro &bull; Sistema para Prestadores de Serviços
        </p>
      </div>
    </div>
  );
};
