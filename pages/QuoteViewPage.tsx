
import React, { useState } from 'react';
import { Quote, ProviderInfo } from '../types';
import { Button } from '../components/Button';
import { ChevronLeft, MessageCircle, FileDown, Loader2, Check } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { shareOrDownloadPdf } from '../utils/pdfGenerator';

interface QuoteViewPageProps {
  quote: Quote;
  providerInfo: ProviderInfo;
  onBack: () => void;
  onEdit: () => void;
}

export const QuoteViewPage: React.FC<QuoteViewPageProps> = ({ quote, providerInfo, onBack, onEdit }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSharePdf = async () => {
    setIsGeneratingPdf(true);
    setFeedback(null);
    try {
      const result = await shareOrDownloadPdf('printable-quote', quote);
      if (result.method === 'download') {
        setFeedback('PDF gerado e baixado no seu dispositivo!');
        setTimeout(() => setFeedback(null), 4500);
      } else if (result.method === 'share') {
        setFeedback('Orçamento compartilhado com sucesso!');
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch (err: any) {
      console.error('Erro ao gerar/compartilhar PDF:', err);
      setFeedback('Não foi possível gerar o PDF. Tente novamente.');
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const generateShareText = () => {
    const itemsList = quote.items.map(i => `• ${i.quantity}${i.unit || 'un'} x ${i.name}: ${formatCurrency(i.price * i.quantity)}`).join('\n');
    return `*Orçamento ${quote.number}*\n\nOlá, ${quote.customerName}!\nSegue o resumo do orçamento solicitado:\n\n${itemsList}\n\n*Total: ${formatCurrency(quote.total)}*\n\n${quote.notes ? `_Obs: ${quote.notes}_` : ''}\n\nAtenciosamente,\n*${providerInfo.name}*`;
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(generateShareText());
    const phone = quote.customerPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone.startsWith('55') ? phone : '55' + phone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <Button variant="secondary" onClick={onBack} className="w-full sm:w-auto"><ChevronLeft size={20} className="mr-2" /> Voltar</Button>
        <div className="flex flex-wrap justify-center items-center gap-2 w-full sm:w-auto">
          <Button variant="secondary" onClick={onEdit}>Editar</Button>
          <Button variant="primary" className="bg-green-600 hover:bg-green-700 border-none shadow-md shadow-green-600/20" icon={<MessageCircle size={20} />} onClick={handleWhatsAppShare}>WhatsApp</Button>
          <Button 
            id="btn-share-pdf"
            variant="primary"
            onClick={handleSharePdf} 
            disabled={isGeneratingPdf}
            icon={isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
            className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25"
          >
            {isGeneratingPdf ? 'Gerando PDF...' : 'Compartilhar PDF'}
          </Button>
        </div>
      </div>

      {feedback && (
        <div className="no-print max-w-[210mm] mx-auto bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
          <Check size={18} className="text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <div id="printable-quote" className="bg-white p-6 md:p-12 rounded-lg shadow-sm max-w-[210mm] mx-auto min-h-[297mm] border border-gray-100 overflow-x-auto overflow-y-hidden">
        <div className="min-w-[600px] md:min-w-0">
          <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
            <div className="flex gap-6">
              {providerInfo.logo && <div className="flex-shrink-0"><img src={providerInfo.logo} className="h-20 max-w-[160px] object-contain" /></div>}
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1">{providerInfo.name}</h1>
                <div className="text-xs md:text-sm text-gray-500 space-y-0.5">
                  {providerInfo.document && <p>CPF/CNPJ: {providerInfo.document}</p>}
                  {providerInfo.phone && <p>Fone: {providerInfo.phone}</p>}
                  {providerInfo.email && <p>{providerInfo.email}</p>}
                  {providerInfo.address && <p className="max-w-xs">{providerInfo.address}</p>}
                </div>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-blue-600 text-lg md:text-xl font-bold uppercase tracking-widest mb-1">Orçamento</h2>
              <p className="text-slate-800 font-bold text-lg">{quote.number}</p>
              <p className="text-sm text-gray-400">Emissão: {new Date(quote.date).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 md:p-6 mb-8">
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase mb-2">Para o Cliente</p>
            <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-1">{quote.customerName || '(Não informado)'}</h3>
            <p className="text-xs md:text-sm text-slate-600">{quote.customerPhone} • {quote.customerEmail}</p>
            <p className="text-xs text-slate-500 mt-2 leading-tight">{quote.customerAddress} • {quote.customerCity}/{quote.customerState}</p>
          </div>

          <table className="w-full text-left mb-12">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-4 font-bold text-slate-800 text-sm">Item</th>
                <th className="py-4 px-4 text-center font-bold text-slate-800 text-sm">Qtd</th>
                <th className="py-4 px-4 text-right font-bold text-slate-800 text-sm">Unitário</th>
                <th className="py-4 text-right font-bold text-slate-800 text-sm">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quote.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-4"><p className="font-semibold text-slate-800 text-sm">{item.name}</p></td>
                  <td className="py-4 px-4 text-center text-slate-600 text-sm">{item.quantity} {item.unit}</td>
                  <td className="py-4 px-4 text-right text-slate-600 text-sm">{formatCurrency(item.price)}</td>
                  <td className="py-4 text-right font-bold text-slate-900 text-sm">{formatCurrency(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-8 text-right font-medium text-slate-500 text-sm">Valor Total</td>
                <td className="pt-8 text-right text-2xl md:text-3xl font-extrabold text-blue-600">{formatCurrency(quote.total)}</td>
              </tr>
            </tfoot>
          </table>

          {quote.notes && (
            <div className="border-t border-slate-100 pt-8">
              <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase mb-3 tracking-widest">Observações</p>
              <div className="text-xs md:text-sm text-slate-600 whitespace-pre-wrap">{quote.notes}</div>
            </div>
          )}

          <div className="mt-20 flex justify-center gap-12 md:gap-24 text-center">
            <div className="w-40 md:w-48 border-t border-slate-300 pt-2 text-[10px] text-gray-400 font-medium uppercase">Assinatura do Prestador</div>
            <div className="w-40 md:w-48 border-t border-slate-300 pt-2 text-[10px] text-gray-400 font-medium uppercase">Aceite do Cliente</div>
          </div>
        </div>
      </div>
    </div>
  );
};
