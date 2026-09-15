import React, { useRef, useState, useEffect } from 'react';
import { X, Check, RotateCcw, ShieldCheck, PenTool, Type, FileCheck, Smartphone } from 'lucide-react';
import { Button } from './Button';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  signerType: 'provider' | 'client';
  defaultName: string;
  defaultDoc?: string;
  defaultEmail?: string;
  defaultPhone?: string;
  onConfirmSignature: (signatureData: {
    signatureDataUrl: string;
    name: string;
    doc: string;
    email?: string;
    phone?: string;
  }) => Promise<void>;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  isOpen,
  onClose,
  title,
  signerType,
  defaultName,
  defaultDoc = '',
  defaultEmail = '',
  defaultPhone = '',
  onConfirmSignature
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [name, setName] = useState(defaultName);
  const [document, setDocument] = useState(defaultDoc);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(defaultName || '');
    setDocument(defaultDoc || '');
    setEmail(defaultEmail || '');
    setPhone(defaultPhone || '');
    setHasDrawn(false);
  }, [defaultName, defaultDoc, defaultEmail, defaultPhone, isOpen]);

  // Redimensiona o canvas com escala de alta densidade (Retina)
  useEffect(() => {
    if (!isOpen || mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a'; // slate-900 elegante
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    const mouseEvent = e as React.MouseEvent;
    return {
      x: mouseEvent.clientX - rect.left,
      y: mouseEvent.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    setIsDrawing(true);
    setHasDrawn(true);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
  };

  /**
   * Converte a assinatura em texto estilizado para DataURL quando o usuário opta por digitar
   */
  const generateTypedSignatureDataUrl = (signerName: string): string => {
    const tempCanvas = window.document.createElement('canvas');
    tempCanvas.width = 500;
    tempCanvas.height = 140;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    ctx.font = 'italic 34px "Brush Script MT", "Caveat", "Dancing Script", cursive, Georgia';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(signerName, tempCanvas.width / 2, tempCanvas.height / 2);

    return tempCanvas.toDataURL('image/png');
  };

  const handleConfirm = async () => {
    if (!name.trim()) {
      alert('Por favor, informe o nome completo do signatário.');
      return;
    }

    let signatureUrl = '';
    if (mode === 'draw') {
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        signatureUrl = canvas.toDataURL('image/png');
      }
    } else {
      signatureUrl = generateTypedSignatureDataUrl(name);
    }

    setSaving(true);
    try {
      await onConfirmSignature({
        signatureDataUrl: signatureUrl,
        name: name.trim(),
        doc: document.trim(),
        email: email.trim(),
        phone: phone.trim()
      });
      onClose();
    } catch (err: any) {
      alert('Erro ao confirmar assinatura: ' + (err.message || 'Tente novamente.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Topo */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${signerType === 'provider' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                  Assinatura Eletrônica do Contrato
                </h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${signerType === 'provider' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {signerType === 'provider' ? 'Contratada' : 'Contratante'}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-sm">{title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Campos de Identificação do Signatário */}
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo do Signatário *
              </label>
              <input
                type="text"
                placeholder="Ex: João da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CPF ou CNPJ
              </label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail para Notificação
              </label>
              <input
                type="email"
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp / Telefone
              </label>
              <input
                type="text"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50/50"
              />
            </div>
          </div>

          {/* Abas de Modo de Rubrica */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Forma da Assinatura:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setMode('draw')}
                  className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${mode === 'draw' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'}`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Desenhar Rubrica
                </button>
                <button
                  type="button"
                  onClick={() => setMode('type')}
                  className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${mode === 'type' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'}`}
                >
                  <Type className="w-3.5 h-3.5" />
                  Gerar Manuscrita
                </button>
              </div>
            </div>

            {mode === 'draw' ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-slate-400" />
                    Use a ponta do dedo na tela ou o mouse
                  </span>
                  {hasDrawn && (
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Limpar Rubrica
                    </button>
                  )}
                </div>
                <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 relative overflow-hidden flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-[140px] cursor-crosshair touch-none select-none bg-slate-50"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
                      <PenTool className="w-5 h-5 opacity-40 animate-pulse" />
                      <span>Desenhe sua assinatura neste quadro</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center min-h-[140px]">
                <p className="text-2xl sm:text-3xl italic text-slate-800 font-serif text-center px-4">
                  {name.trim() || 'Sua Assinatura'}
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Assinatura tipográfica com validação por carimbo de data/hora e IP
                </p>
              </div>
            )}
          </div>

          {/* Selo de Validade Jurídica */}
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Validade Jurídica Garantida: </span>
              Conforme o Art. 10 da MP nº 2.200-2/2001 e a Lei nº 14.063/2020. Ficam registrados data, hora, IP de origem e certificado de integridade.
            </div>
          </div>
        </div>

        {/* Rodapé e Botões de Ação */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 shadow-md shadow-emerald-600/20"
          >
            <Check className="w-4 h-4 mr-1.5" />
            {saving ? 'Registrando Assinatura...' : 'Confirmar e Assinar'}
          </Button>
        </div>
      </div>
    </div>
  );
};
