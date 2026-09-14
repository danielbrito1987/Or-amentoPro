import jsPDF from 'jspdf';
import { Contract } from '../types';

export const generateContractPdf = (contract: Contract) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Identificador: ${contract.contractNumber} • Orçamento Ref: ${contract.quoteNumber}`, pageWidth / 2, 20, { align: 'center' });

  let y = 35;
  doc.setTextColor(30, 41, 59);
  const lines = doc.splitTextToSize(contract.content, contentWidth);
  doc.setFontSize(9.5);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (y > 265) {
      doc.addPage();
      y = 25;
    }
    if (line.startsWith('INSTRUMENTO') || line.startsWith('CLÁUSULA') || line.startsWith('CONTRATADA:') || line.startsWith('CONTRATANTE:')) {
      doc.setFont('helvetica', 'bold');
      doc.text(line, margin, y);
      doc.setFont('helvetica', 'normal');
    } else {
      doc.text(line, margin, y);
    }
    y += 5;
  }

  if (y > 215) {
    doc.addPage();
    y = 30;
  } else {
    y += 15;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('ASSINATURAS ELETRÔNICAS DAS PARTES', margin, y);
  y += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text('Documento assinado digitalmente com conformidade jurídica nos termos da MP nº 2.200-2/2001 e Lei nº 14.063/2020.', margin, y);
  y += 12;

  const colWidth = (contentWidth - 10) / 2;
  contract.signatures.forEach((sig, idx) => {
    const x = margin + (idx % 2) * (colWidth + 10);
    const boxY = y + Math.floor(idx / 2) * 45;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, boxY, colWidth, 40, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(sig.signerType === 'provider' ? 'CONTRATADA:' : 'CONTRATANTE:', x + 4, boxY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(sig.name, x + 4, boxY + 12);
    if (sig.document) doc.text(`Doc: ${sig.document}`, x + 4, boxY + 16);

    if (sig.status === 'signed') {
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.text('✓ ASSINADO DIGITALMENTE', x + 4, boxY + 23);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const signDate = sig.signedAt ? new Date(sig.signedAt).toLocaleString('pt-BR') : '';
      doc.text(`Data/Hora: ${signDate}`, x + 4, boxY + 28);
      doc.text(`Autenticidade: HASH-${contract.id.substring(0, 8).toUpperCase()}`, x + 4, boxY + 33);
    } else {
      doc.setTextColor(234, 88, 12);
      doc.setFont('helvetica', 'bold');
      doc.text('⏳ AGUARDANDO ASSINATURA', x + 4, boxY + 25);
    }
  });

  doc.save(`${contract.contractNumber}_Contrato.pdf`);
};