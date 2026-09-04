import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Quote } from '../types';

export const generateQuotePdfBlob = async (elementId: string): Promise<Blob> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Elemento do orçamento não encontrado para gerar o PDF.');
  }

  // Renderiza com viewport simulada e largura fixa A4 (794px) para garantir PDF perfeito mesmo em telas mobile
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1024,
    onclone: (clonedDoc) => {
      const clonedEl = clonedDoc.getElementById(elementId);
      if (clonedEl) {
        clonedEl.style.width = '794px';
        clonedEl.style.maxWidth = '794px';
        clonedEl.style.overflow = 'visible';
        clonedEl.style.boxShadow = 'none';
        clonedEl.style.border = 'none';
      }
    }
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  
  // Configura PDF A4 padrão (210 x 297 mm)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = 210;
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  if (pdfHeight <= 297) {
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  } else {
    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= 297;

    while (heightLeft > 0) {
      position -= 297;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= 297;
    }
  }

  return pdf.output('blob');
};

export const shareOrDownloadPdf = async (
  elementId: string, 
  quote: Quote
): Promise<{ method: 'share' | 'download' | 'canceled' }> => {
  const blob = await generateQuotePdfBlob(elementId);
  const cleanNumber = (quote.number || 'proposta').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `orcamento_${cleanNumber}.pdf`;
  const file = new File([blob], fileName, { type: 'application/pdf' });

  // Verifica suporte a compartilhamento nativo com arquivo (Smartphones Android, iOS, tablets e navegadores compatíveis)
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `Orçamento ${quote.number}`,
        text: `Olá, segue o orçamento ${quote.number} em formato PDF.`
      });
      return { method: 'share' };
    } catch (err: any) {
      // Se o usuário cancelou o seletor nativo, encerra graciosamente
      if (err?.name === 'AbortError') {
        return { method: 'canceled' };
      }
      console.warn('Compartilhamento nativo não completado, acionando download:', err);
    }
  }

  // Fallback automático para navegadores desktop que não suportam navigator.share com arquivos
  downloadBlob(blob, fileName);
  return { method: 'download' };
};

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};
