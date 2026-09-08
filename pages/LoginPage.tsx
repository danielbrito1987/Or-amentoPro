
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Mail, Lock, User as UserIcon, Loader2, AlertCircle, CheckCircle2, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../services/supabase';
import orcaLogo from '../src/assets/images/orcafacil_quote_logo_1788895951950.jpg';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-300 relative z-10">
        <div className="text-center mb-6">
          <div className="relative inline-block mb-3">
            <div className="absolute inset-0 bg-blue-500/20 rounded-3xl blur-xl" />
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/30 border border-white/10 mx-auto ring-1 ring-blue-400/20">
              <img
                src={orcaLogo}
                alt="Logo OrçaFácil Pro"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-black text-white tracking-tight">
              Orça<span className="text-blue-500">Fácil</span>
            </h1>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md shadow-blue-500/20">
              PRO
            </span>
          </div>
          <p className="text-slate-400 mt-1.5 text-sm">Sistema de orçamentos rápidos para prestadores de serviços</p>

          {isSupabaseConfigured() && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-500/40 rounded-full text-emerald-400 text-xs font-semibold">
              <Database className="w-3.5 h-3.5" />
              <span>Acesso Seguro na Nuvem Ativo</span>
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

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
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
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-base font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'register' ? 'Criando sua conta na nuvem...' : 'Entrando...'}
                </>
              ) : (
                mode === 'register' ? 'Cadastrar e Começar' : 'Entrar'
              )}
            </Button>
          </form>
        </div>

        <p className="text-center mt-5 text-slate-500 text-xs">
          &copy; {new Date().getFullYear()} OrçaFácil Pro &bull; Sistema para Prestadores de Serviços
        </p>
      </div>
    </div>
  );
};
