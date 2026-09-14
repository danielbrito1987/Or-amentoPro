import React, { useState, useEffect } from 'react';
import { FileText, Download, Share2, Mail, CheckCircle2, Clock, PenTool, Trash2, ArrowRight } from 'lucide-react';
import { Contract } from '../types';
import { contractService } from '../services/contractService';
import { generateContractPdf } from '../services/contractPdfService';
import { saasService } from '../services/saasService';
import { useAuth } from '../contexts/AuthContext';
import { DigitalSignatureModal } from '../components/DigitalSignatureModal';
import { Button } from '../components/Button';

export const ContractsPage: React.FC<{ onUpgradeToPremium: () => void }> = ({ onUpgradeToPremium }) => {
  const { user, subscription } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signTarget, setSignTarget] = useState<'provider' | 'client'>('provider');

  const permissions = saasService.canUseContracts(user?.email);

  useEffect(() => {
    const list = contractService.getAllContracts();
    setContracts(list);
    if (list.length > 0 && !selectedContract) setSelectedContract(list[0]);
  }, []);

  if (!permissions.allowed) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800">
          <h2 className="text-2xl font-bold">Módulo de Contratos Digitais & Assinatura Eletrônica</h2>
          <p className="text-slate-400 mt-2 text-sm max-w-lg mx-auto">
            Disponível exclusivamente no Plano Premium (R$ 199,90/mês). Formalize propostas em contratos com validade jurídica instantaneamente.
          </p>
          <Button onClick={onUpgradeToPremium} className="mt-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3">
            Fazer Upgrade para Plano Premium (R$ 199,90)
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" /> Contratos de Prestação de Serviços
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-3">
          {contracts.map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedContract(c)}
              className={`p-4 rounded-xl border cursor-pointer ${
                selectedContract?.id === c.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900">{c.contractNumber}</span>
                <span className="font-bold text-sm">R$ {c.totalValue.toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Cliente: {c.clientName}</p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-7">
          {selectedContract && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <h3 className="font-bold text-slate-900">{selectedContract.title}</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => generateContractPdf(selectedContract)}>
                    <Download className="w-4 h-4 mr-1" /> PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const text = `Olá, ${selectedContract.clientName}! Segue o link para conferência e assinatura do Contrato ${selectedContract.contractNumber} (R$ ${selectedContract.totalValue.toFixed(2)}): ${window.location.origin}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-1" /> WhatsApp
                  </Button>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl max-h-72 overflow-y-auto text-xs font-mono whitespace-pre-wrap">
                {selectedContract.content}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {selectedContract.signatures.map(sig => (
                  <div key={sig.signerType} className="p-3 border rounded-xl bg-slate-50 text-xs">
                    <p className="font-semibold text-slate-800">{sig.signerType === 'provider' ? 'Prestador' : 'Cliente'}</p>
                    <p className="text-slate-500">{sig.name}</p>
                    {sig.status === 'signed' ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1 mt-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Assinado
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        className="mt-2 w-full text-xs h-7"
                        onClick={() => {
                          setSignTarget(sig.signerType);
                          setIsSignModalOpen(true);
                        }}
                      >
                        <PenTool className="w-3 h-3 mr-1" /> Assinar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedContract && (
        <DigitalSignatureModal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          title={`Assinatura ${selectedContract.contractNumber}`}
          signerType={signTarget}
          defaultName={signTarget === 'provider' ? selectedContract.providerName : selectedContract.clientName}
          defaultDoc={signTarget === 'provider' ? selectedContract.providerDocument : selectedContract.clientDocument}
          onConfirmSignature={async (url, name, doc) => {
            const updated = await contractService.signContract(selectedContract.id, signTarget, url, name, doc);
            if (updated) setSelectedContract(updated);
          }}
        />
      )}
    </div>
  );
};