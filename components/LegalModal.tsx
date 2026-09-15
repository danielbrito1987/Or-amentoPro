import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Lock, 
  Scale, 
  Cookie, 
  UserCheck, 
  Database, 
  Mail, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export type LegalTab = 'privacy' | 'terms' | 'cookies';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy'
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  // Sincroniza a aba inicial sempre que o modal for aberto com uma prop específica
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>Centro de Privacidade e Termos Legais</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full">
                  LGPD Conforme
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                OrçaFácil Pro &bull; Lei Federal nº 13.709/2018 e Marco Civil da Internet
              </p>
            </div>
          </div>

          <button 
            id="btn-close-legal-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVEGAÇÃO ENTRE ABAS */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 sm:px-6 gap-2 overflow-x-auto">
          <button
            id="tab-legal-privacy"
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'privacy'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Política de Privacidade (LGPD)</span>
          </button>

          <button
            id="tab-legal-terms"
            onClick={() => setActiveTab('terms')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'terms'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Termos de Uso</span>
          </button>

          <button
            id="tab-legal-cookies"
            onClick={() => setActiveTab('cookies')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'cookies'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cookie className="w-4 h-4" />
            <span>Política de Cookies & Dados</span>
          </button>
        </div>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1 space-y-6 text-xs sm:text-sm leading-relaxed text-slate-300">
          {/* ABA 1: POLÍTICA DE PRIVACIDADE */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-4 text-blue-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-white text-sm">Compromisso com sua Privacidade</h3>
                  <p className="text-xs text-blue-300/90 mt-0.5">
                    O <strong>OrçaFácil Pro</strong> respeita sua privacidade e atua em estrita conformidade com a 
                    Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD). Não vendemos, não compartilhamos e 
                    não monetizamos seus dados ou os dados dos clientes cadastrados nos seus orçamentos.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>1. Identificação do Controlador e Operador</span>
                </h3>
                <p>
                  A plataforma <strong>OrçaFácil Pro</strong> é um software de gestão de propostas, catálogos e contratos para prestadores de serviços autônomos e empresas.
                </p>
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <p>
                    <strong className="text-slate-100">Como Controlador:</strong> O OrçaFácil Pro é o controlador dos dados cadastrais dos prestadores que criam conta (nome, e-mail, telefone profissional, logotipo e dados de assinatura).
                  </p>
                  <p>
                    <strong className="text-slate-100">Como Operador:</strong> Quando você (prestador de serviço) cadastra orçamentos ou contratos contendo dados de seus clientes finais (nome do cliente, telefone, endereço da obra, CPF/CNPJ), <strong>você atua como Controlador</strong> desses dados e o OrçaFácil Pro atua estritamente como <strong>Operador técnico</strong>, processando as informações apenas para gerar o PDF, viabilizar a assinatura digital e armazenar o histórico solicitado por você.
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>2. Dados Pessoais que Coletamos</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>Dados de Acesso e Perfil:</strong> Nome completo, e-mail de login, senha (armazenada com hash criptográfico irreversível), telefone para contato e dados da empresa.</li>
                  <li><strong>Dados Operacionais da Empresa:</strong> Logotipo, dados bancários/chave Pix (apenas para exibição em seus orçamentos para recebimento).</li>
                  <li><strong>Dados dos Orçamentos e Contratos:</strong> Dados do cliente final inseridos por você para emissão de propostas comerciais (nome, endereço, telefone, itens e valores).</li>
                  <li><strong>Dados Técnicos e de Auditoria:</strong> Endereço IP, data e hora de acessos, navegador e registros criptográficos para assegurar a autenticidade jurídica das assinaturas digitais nos contratos (conforme Lei 14.063/2020 e MP 2.200-2/2001).</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>3. Bases Legais do Tratamento (Art. 7º da LGPD)</span>
                </h3>
                <p>O tratamento de dados pessoais no OrçaFácil Pro é fundamentado exclusivamente em:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                    <p className="font-semibold text-white text-xs">Execução de Contrato (Art. 7º, V)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Necessário para fornecer a plataforma, gerar os orçamentos solicitados e manter suas assinaturas ativas.</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                    <p className="font-semibold text-white text-xs">Cumprimento de Obrigação Legal (Art. 7º, II)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Guarda de registros de conexão e logs de acesso conforme exigido pelo Marco Civil da Internet (Lei 12.965/2014).</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                    <p className="font-semibold text-white text-xs">Legítimo Interesse e Segurança (Art. 7º, IX)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Prevenção a fraudes, integridade das assinaturas eletrônicas e melhoria de estabilidade do sistema.</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                    <p className="font-semibold text-white text-xs">Consentimento do Titular (Art. 7º, I)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Manifestação livre e informada ao criar a conta e selecionar seu plano de uso.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>4. Direitos do Titular de Dados (Art. 18 da LGPD)</span>
                </h3>
                <p>Você, como titular de seus dados pessoais, tem o direito de, a qualquer momento e mediante requisição formal:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Confirmar a existência de tratamento</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Acessar seus dados com facilidade</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Corrigir dados incompletos ou inexatos</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Solicitar a eliminação dos seus dados</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Portabilidade de orçamentos e cadastros</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Revogação do consentimento</span>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>5. Segurança e Retenção de Dados</span>
                </h3>
                <p>
                  Utilizamos tráfego criptografado com SSL/TLS de ponta a ponta, banco de dados Supabase na nuvem protegido por políticas de isolamento Row-Level Security (RLS) e cópia de segurança local sincronizada com resiliência offline.
                </p>
                <p>
                  Os dados são mantidos enquanto sua conta estiver ativa ou pelo período necessário para cumprimento de obrigações tributárias, civis e legais. Caso deseje excluir sua conta e dados, basta solicitar pelo canal de atendimento.
                </p>
              </section>

              <section className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span>6. Canal de Atendimento ao Titular / Encarregado (DPO)</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Para exercer qualquer direito previsto na LGPD, tirar dúvidas sobre o tratamento de seus dados ou solicitar a exclusão de sua conta, entre em contato diretamente com nosso Encarregado de Proteção de Dados:
                </p>
                <div className="text-xs font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-blue-400">
                  <strong>E-mail do Encarregado:</strong> damasceno1871@gmail.com
                </div>
              </section>
            </div>
          )}

          {/* ABA 2: TERMOS DE USO */}
          {activeTab === 'terms' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-slate-300">
                <h3 className="font-bold text-white text-sm">Termos Gerais de Uso da Plataforma</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ao se cadastrar e utilizar o OrçaFácil Pro, você concorda expressamente com os termos e condições descritos abaixo.
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white">1. Objeto e Funcionalidades</h3>
                <p>
                  O <strong>OrçaFácil Pro</strong> é uma ferramenta de produtividade digital desenvolvida para prestadores de serviços, possibilitando a criação de orçamentos padronizados em PDF, catálogo de serviços e produtos, contratos com assinatura digital e envio ágil via WhatsApp.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white">2. Planos de Acesso e Assinatura</h3>
                <div className="space-y-2 text-xs">
                  <p>
                    <strong>Plano Básico:</strong> Destinado a profissionais que necessitam de até 20 orçamentos mensais, geração em PDF e catálogo. Disponibiliza 7 dias de teste grátis no primeiro cadastro.
                  </p>
                  <p>
                    <strong>Plano Pro Completo:</strong> Orçamentos ilimitados, Consultor de Preços com Inteligência Artificial e suporte prioritário. Disponibiliza 7 dias de teste grátis no primeiro cadastro.
                  </p>
                  <p>
                    <strong>Plano Premium:</strong> Inclui todos os recursos do Pro, além de módulo de Contratos de Prestação de Serviços com Assinatura Eletrônica Digital e trilha de auditoria. <em>Não possui período de teste gratuito; sua ativação ocorre após validação do pagamento via Pix.</em>
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white">3. Responsabilidade do Usuário</h3>
                <p>
                  O prestador de serviço é o único responsável pela veracidade dos valores, itens, prazos e termos inseridos nas propostas emitidas. O OrçaFácil Pro fornece o suporte técnico e visual, não participando da relação comercial ou da execução dos serviços entre o prestador e seu cliente final.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white">4. Validade Jurídica das Assinaturas Eletrônicas</h3>
                <p>
                  As assinaturas colhidas pelo módulo de contratos do OrçaFácil Pro enquadram-se como <strong>Assinaturas Eletrônicas Simples/Avançadas</strong>, respaldadas pela Lei Federal nº 14.063/2020 e pelo Art. 10, § 2º da Medida Provisória nº 2.200-2/2001, registrando evidências probatórias como endereço IP, carimbo de data/hora (UTC) e metadados de concordância.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white">5. Cancelamento e Suspensão</h3>
                <p>
                  O usuário pode solicitar o cancelamento de sua assinatura a qualquer momento, sem taxas de rescisão ou fidelidade compulsória. Em caso de inadimplência após o período de teste ou vencimento do plano, o acesso à emissão de novos orçamentos poderá ser temporariamente suspenso até regularização.
                </p>
              </section>
            </div>
          )}

          {/* ABA 3: POLÍTICA DE COOKIES & DADOS */}
          {activeTab === 'cookies' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-slate-300">
                <h3 className="font-bold text-white text-sm">Como Utilizamos Cookies e Armazenamento Local</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Transparência total sobre as tecnologias que utilizamos no seu navegador.
                </p>
              </div>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white">O que são Cookies e LocalStorage?</h3>
                <p>
                  Cookies e o Armazenamento Local (LocalStorage) são pequenos arquivos ou chaves gravados com segurança no seu navegador de internet para que o sistema reconheça sua sessão e suas preferências de trabalho.
                </p>

                <div className="space-y-3">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-blue-400" />
                        1. Cookies de Sessão e Autenticação (Estritamente Necessários)
                      </span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded">Essencial</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Mantêm sua conta conectada de forma segura entre recarregamentos e páginas, evitando que você precise digitar sua senha a cada tela. Gerenciados pelo Supabase Auth sob HTTPS seguro.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-emerald-400" />
                        2. Armazenamento Offline e Cache (Estritamente Necessários)
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">Modo Obra</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Permitem que o OrçaFácil Pro funcione em modo offline mesmo quando você estiver em locais sem internet ou com sinal instável na obra, guardando temporariamente suas alterações até que a sincronização com a nuvem ocorra.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-2">
                        <Cookie className="w-3.5 h-3.5 text-amber-400" />
                        3. Preferências de Interface
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded">Preferências</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Armazenam se você prefere o menu lateral recolhido, seu consentimento de privacidade e preferências visuais.
                    </p>
                  </div>
                </div>
              </section>

              <section className="bg-emerald-950/30 border border-emerald-800/40 p-4 rounded-xl text-emerald-200 space-y-1 text-xs">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Sem Cookies de Terceiros ou Anúncios Invasivos
                </div>
                <p className="text-emerald-300/90">
                  O OrçaFácil Pro <strong>NÃO</strong> utiliza cookies de rastreamento publicitário, redes de anúncios, pixels invasivos do Facebook ou venda de hábitos de navegação. Todo o armazenamento é funcional e necessário para a prestação do serviço.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* FOOTER DO MODAL */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 text-center sm:text-left">
            Dúvidas legais ou LGPD? Escreva para <span className="text-blue-400 font-mono">damasceno1871@gmail.com</span>
          </span>
          <button
            id="btn-confirm-read-legal"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md active:scale-95"
          >
            Entendido e Concordo
          </button>
        </div>
      </div>
    </div>
  );
};
