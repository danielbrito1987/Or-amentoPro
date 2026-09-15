import jsPDF from 'jspdf';
import { Contract } from '../types';
import { formatCurrency } from '../utils/formatters';

/**
 * Gera o documento PDF oficial do Contrato de Prestação de Serviços com layout
 * executivo, cláusulas formatadas, caixas de assinaturas eletrônicas, rubrica gráfica
 * e carimbo de conformidade jurídica (MP 2.200-2/2001 e Lei 14.063/2020).
 */
export const generateContractPdf = (contract: Contract) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - (margin * 2);

  const drawHeader = (currentPage: number) => {
    // Barra superior em azul escuro elegante
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 26, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', pageWidth / 2, 12, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225); // slate-300
    const subtitle = `Contrato nº: ${contract.contractNumber} • Orçamento de Origem: ${contract.quoteNumber}`;
    doc.text(subtitle, pageWidth / 2, 19, { align: 'center' });

    // Linha de detalhe no rodapé da página
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Documento com validade jurídica nos termos da MP 2.200-2/2001 e Lei 14.063/2020 • ${contract.contractNumber}`,
      margin,
      pageHeight - 7
    );
    doc.text(`Página ${currentPage}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  };

  let currentPage = 1;
  drawHeader(currentPage);

  let y = 35;

  // Box resumo das partes e valor no topo
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('CONTRATADA:', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${contract.providerName} (${contract.providerDocument || 'Doc. não informado'})`, margin + 28, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('CONTRATANTE:', margin + 4, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${contract.clientName} (${contract.clientDocument || 'Doc. a confirmar'})`, margin + 30, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('VALOR GLOBAL:', margin + 4, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(`${formatCurrency(contract.totalValue)}`, margin + 30, y + 18);

  y += 28;

  // Renderização do texto das cláusulas
  const lines = doc.splitTextToSize(contract.content, contentWidth);
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Quebra de página automática se estiver próximo do rodapé
    if (y > pageHeight - 26) {
      doc.addPage();
      currentPage++;
      drawHeader(currentPage);
      y = 34;
    }

    if (
      line.startsWith('CLÁUSULA') ||
      line.startsWith('INSTRUMENTO PARTICULAR') ||
      line.startsWith('CONTRATADA (PRESTADORA') ||
      line.startsWith('CONTRATANTE (CLIENTE')
    ) {
      // Espaçamento extra antes de nova cláusula
      y += 2;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(line, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      y += 4.8;
    } else if (line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.') || line.trim().startsWith('4.') || line.trim().startsWith('5.') || line.trim().startsWith('6.') || line.trim().startsWith('7.') || line.trim().startsWith('8.')) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(line, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      y += 4.5;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(line, margin, y);
      y += 4.5;
    }
  }

  // Verifica se o bloco de assinaturas cabe na página atual; se não, cria uma nova
  if (y > pageHeight - 80) {
    doc.addPage();
    currentPage++;
    drawHeader(currentPage);
    y = 34;
  } else {
    y += 8;
  }

  // Bloco de Assinaturas Eletrônicas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ASSINATURAS ELETRÔNICAS DAS PARTES', margin, y);
  y += 5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'As assinaturas abaixo foram colhidas eletronicamente com registro de data, hora, endereço IP e hash de auditoria em plena conformidade com a MP nº 2.200-2/2001 e a Lei nº 14.063/2020.',
    margin,
    y
  );
  y += 8;

  const boxWidth = (contentWidth - 8) / 2;
  const boxHeight = 44;

  contract.signatures.forEach((sig, index) => {
    const x = margin + index * (boxWidth + 8);
    const isSigned = sig.status === 'signed';

    // Caixa de fundo
    doc.setFillColor(isSigned ? 248 : 255, isSigned ? 250 : 250, isSigned ? 252 : 250);
    doc.setDrawColor(isSigned ? 16 : 203, isSigned ? 185 : 213, isSigned ? 129 : 225);
    doc.setLineWidth(isSigned ? 0.4 : 0.2);
    doc.roundedRect(x, y, boxWidth, boxHeight, 2.5, 2.5, 'FD');

    // Cabeçalho do signatário
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const roleLabel = sig.signerType === 'provider' ? 'CONTRATADA (PRESTADOR)' : 'CONTRATANTE (CLIENTE)';
    doc.text(roleLabel, x + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(sig.name || 'Nome não preenchido', x + 4, y + 11);
    if (sig.document) {
      doc.text(`Doc: ${sig.document}`, x + 4, y + 15);
    }

    if (isSigned) {
      // Se houver imagem da rubrica em Base64, estampa na caixa
      if (sig.signatureDataUrl && sig.signatureDataUrl.startsWith('data:image')) {
        try {
          doc.addImage(sig.signatureDataUrl, 'PNG', x + 4, y + 17, 34, 11);
        } catch (e) {
          console.warn('Não foi possível estampar a imagem da rubrica:', e);
        }
      }

      // Selo de assinatura verde
      doc.setTextColor(16, 185, 129); // emerald-600
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('✓ ASSINADO DIGITALMENTE', x + 4, y + 30);

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      const signDate = sig.signedAt ? new Date(sig.signedAt).toLocaleString('pt-BR') : '';
      doc.text(`Data/Hora: ${signDate}`, x + 4, y + 34.5);
      doc.text(`IP: ${sig.ipAddress || 'Registrado'} • Hash: ${sig.hash || 'BR-EID-VALID'}`, x + 4, y + 38.5);
    } else {
      // Linha tracejada de assinatura física de contingência
      doc.setDrawColor(148, 163, 184);
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.line(x + 4, y + 26, x + boxWidth - 4, y + 26);
      doc.setLineDashPattern([], 0);

      doc.setTextColor(217, 119, 6); // amber-600
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('⏳ AGUARDANDO ASSINATURA ELETRÔNICA', x + 4, y + 32);

      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.text('Acesse o link do sistema para assinar pelo celular.', x + 4, y + 37);
    }
  });

  const fileName = `${contract.contractNumber}_Contrato_${contract.clientName.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};
