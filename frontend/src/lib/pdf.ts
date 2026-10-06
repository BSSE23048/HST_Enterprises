import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Client, Invoice, InvoiceItem } from '../types';

const COLORS = {
  MAROON: 'rgb(121, 14, 19)', 
  BLUE: '#232361',   
  BORDER: '#b0b0b0', 
  TEXT: '#000000',   
  MUTED: '#000000'   
};

const FONTS = {
  BODY: 'Helvetica',
  BOLD: 'Helvetica'
};

function formatMoney(value: number): string {
  return value.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// --- NEW HELPER: ENFORCE DD-MM-YYYY STRICTLY IN PDF ---
function formatPdfDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  // If date is in YYYY-MM-DD format, convert it to DD-MM-YYYY
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

async function loadImageAsDataURL(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string | null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function buildLines(invoice: Invoice | null, draftItems: InvoiceItem[]) {
  if (invoice?.items?.length) return invoice.items;
  return draftItems
    .filter((it) => it.description && String(it.description).trim().length > 0)
    .map((item, index) => ({
      lineNo: item.lineNo ?? index + 1,
      description: item.description,
      unit: (item as any).unit || 'Nos', 
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: Number(item.quantity || 0) * Number(item.unitPrice || 0)
    }));
}

export async function renderInvoicePdf(params: {
  client?: Client | null;
  invoice: Invoice | null;
  draftItems: InvoiceItem[];
  invoiceNumber: string;
  invoiceDate: string;
  notes?: string;
  recordType?: 'invoice' | 'quotation';
  terms?: string;
  signingAssets?: { signature: string; stamp: string };
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 30;
  const contentBottom = footerY - 5;
  const continuationTop = 20;
  const ensureSpace = (y: number, height: number) => {
    if (y + height <= contentBottom) return y;
    doc.addPage();
    return continuationTop;
  };

  const isQuotation = params.recordType === 'quotation';

  const lines = buildLines(params.invoice, params.draftItems);
  const subtotal = lines.reduce((s, r) => s + (r.lineTotal ?? r.quantity * r.unitPrice), 0);
  
  const amountPaid = params.invoice?.amountPaid || 0;
  const balanceDue = params.invoice?.balanceDue !== undefined ? params.invoice.balanceDue : subtotal;

  const logoData = await loadImageAsDataURL('/HST_logo.png');
  const assets = params.signingAssets ?? await (await import('./privateAssets')).loadSigningAssets();
  const stampData = assets.stamp;
  const signatureData = assets.signature;

  const addFooter = (docInstance: jsPDF, pageNum: number) => {
    docInstance.setPage(pageNum);

    docInstance.setDrawColor(COLORS.BORDER);
    docInstance.setLineWidth(0.5);
    docInstance.line(14, footerY, pageWidth - 14, footerY);

    docInstance.setFillColor(250, 250, 252);
    docInstance.rect(14, footerY + 0.5, pageWidth - 28, 29.5, 'F');

    const col1X = 18;
    const col2X = 85;
    const col3X = 140;
    const startY = footerY + 5;

    docInstance.setFont(FONTS.BOLD, 'bold');
    docInstance.setFontSize(9.5); 
    docInstance.setTextColor(COLORS.MAROON);
    docInstance.text('Office Address', col1X, startY);
    
    docInstance.setFont(FONTS.BODY, 'normal');
    docInstance.setFontSize(8.5); 
    docInstance.setTextColor(COLORS.TEXT);
    docInstance.text('6- Muhammadia Electric Market,', col1X, startY + 5.5);
    docInstance.text('15 Brandreth Road, Lahore', col1X, startY + 10.5);
    docInstance.text('NTN # 367891-7', col1X, startY + 15.5);

    docInstance.setFont(FONTS.BOLD, 'bold');
    docInstance.setFontSize(9.5);
    docInstance.setTextColor(COLORS.MAROON);
    docInstance.text('Contact', col2X, startY);
    
    docInstance.setFont(FONTS.BODY, 'normal');
    docInstance.setFontSize(8.5);
    docInstance.setTextColor(COLORS.TEXT);
    docInstance.text('Tel: 042-37664202', col2X, startY + 5.5);
    docInstance.text('Fax: 042-37664302', col2X, startY + 10.5);

    docInstance.setFont(FONTS.BOLD, 'bold');
    docInstance.setFontSize(9.5);
    docInstance.setTextColor(COLORS.MAROON);
    docInstance.text('Emails', col3X, startY);
    
    docInstance.setFont(FONTS.BODY, 'normal');
    docInstance.setFontSize(8.5);
    docInstance.setTextColor(COLORS.TEXT);
    docInstance.text('hstenterprisespk@gmail.com', col3X, startY + 5.5);
    docInstance.text('zulfiqaragha285@gmail.com', col3X, startY + 10.5);
    docInstance.text('aghashoaibzaib2004@gmail.com', col3X, startY + 15.5);
  };

  if (logoData) {
    try { doc.addImage(logoData, 'PNG', 16, 12, 30, 20); } catch (e) {}
  }

  const textStartX = 48; 
  
  doc.setFont(FONTS.BOLD, 'bold');
  doc.setFontSize(26); 
  doc.setTextColor(COLORS.MAROON);
  doc.text('HST ENTERPRISES', textStartX, 21); 
  
  doc.setFont(FONTS.BOLD, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.MAROON);
  doc.text('Importer, General Order Supplier, Contractor & Services', textStartX, 27);

  doc.setFont(FONTS.BOLD, 'bold');
  doc.setFontSize(22); 
  doc.setTextColor(isQuotation ? COLORS.MAROON : COLORS.BLUE);
  doc.text(isQuotation ? 'QUOTATION' : 'INVOICE', pageWidth - 16, 21, { align: 'right' }); 

  let currentY = 48; 

  doc.setFont(FONTS.BOLD, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.MUTED);
  doc.text(isQuotation ? 'QUOTATION FOR:' : 'BILLED TO:', 16, currentY);

  const metaLabelX = pageWidth - 45;
  const metaValueX = pageWidth - 16;

  doc.text(isQuotation ? 'QUOTE NO:' : 'INVOICE NO:', metaLabelX, currentY, { align: 'right' });
  doc.setFontSize(11);
  doc.setTextColor(COLORS.TEXT);
  doc.text(`${params.invoice?.invoiceNumber ?? params.invoiceNumber}`, metaValueX, currentY, { align: 'right' });

  currentY += 6;

  const companyName = params.client?.displayName ?? params.invoice?.clientName ?? 'Client';
  
  doc.setFont(FONTS.BOLD, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(COLORS.TEXT);
  doc.text(`M/S ${companyName}`, 16, currentY);

  doc.setFont(FONTS.BOLD, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.MUTED);
  doc.text('DATE:', metaLabelX, currentY, { align: 'right' });
  
  doc.setFontSize(11);
  doc.setTextColor(COLORS.TEXT);
  
  // THE FIX: Format the date string right here before printing
  const rawDate = params.invoiceDate || params.invoice?.invoiceDate || '';
  const finalDisplayDate = formatPdfDate(rawDate);
  doc.text(finalDisplayDate, metaValueX, currentY, { align: 'right' });

  currentY += 6;

  if (params.client?.purchaserName) {
    doc.setFont(FONTS.BOLD, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(COLORS.TEXT);
    doc.text(params.client.purchaserName, 16, currentY);
    currentY += 8;
  } else {
    currentY += 2;
  }

  doc.setDrawColor(COLORS.BORDER);
  doc.setLineWidth(0.2);
  doc.line(16, currentY, pageWidth - 16, currentY);
  currentY += 6;

  autoTable(doc, {
    startY: currentY,
    margin: { left: 16, right: 16, bottom: 45 },
    pageBreak: 'auto',
    head: [['Sr', 'Description', 'Unit', 'Qty', 'Rate', 'Amount']],
    body: lines.map((item, idx) => [
      String(item.lineNo ?? idx + 1).padStart(2, '0'),
      item.description,
      (item as any).unit || 'Nos', 
      String(item.quantity),
      `Rs ${formatMoney(item.unitPrice)}`,
      `Rs ${formatMoney(item.lineTotal ?? item.quantity * item.unitPrice)}`
    ]),
    styles: { font: FONTS.BODY, fontSize: 10, cellPadding: 3, textColor: COLORS.TEXT, lineColor: COLORS.BORDER, lineWidth: 0.1, valign: 'middle' },
    headStyles: { fillColor: isQuotation ? COLORS.MAROON : COLORS.BLUE, textColor: 255, fontStyle: 'bold', fontSize: 10, cellPadding: 4, valign: 'middle', halign: 'center' },
    alternateRowStyles: { fillColor: [252, 252, 253] },
    columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 1: { cellWidth: 'auto', halign: 'left' }, 2: { cellWidth: 18, halign: 'center' }, 3: { cellWidth: 15, halign: 'center' }, 4: { cellWidth: 30, halign: 'right' }, 5: { cellWidth: 35, halign: 'right' } }
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? currentY;
  const lastPage = doc.getNumberOfPages();
  doc.setPage(lastPage);

  const totalsY = ensureSpace(finalY + 8, isQuotation ? 21 : 27);
  const totalsBoxX = pageWidth - 90;
  
  if (!isQuotation) {
    doc.setFont(FONTS.BOLD, 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(COLORS.MAROON);
    doc.text('Note:', 16, totalsY + 6);
    doc.setFont(FONTS.BODY, 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(COLORS.TEXT);
    doc.text('Goods once sold are not Returnable.', 16, totalsY + 11.5);
  }

  doc.setDrawColor(COLORS.BORDER);
  doc.setLineWidth(0.5);
  doc.line(totalsBoxX, totalsY, pageWidth - 16, totalsY);

  doc.setFont(FONTS.BODY, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.TEXT);
  doc.text('Subtotal:', totalsBoxX + 2, totalsY + 6);
  doc.text(`Rs ${formatMoney(subtotal)}`, pageWidth - 16, totalsY + 6, { align: 'right' });

  if (!isQuotation) {
    doc.text('Amount Paid:', totalsBoxX + 2, totalsY + 12);
    doc.text(`Rs ${formatMoney(amountPaid)}`, pageWidth - 16, totalsY + 12, { align: 'right' });

    doc.setDrawColor(COLORS.BORDER);
    doc.setLineWidth(0.2);
    doc.line(totalsBoxX, totalsY + 16, pageWidth - 16, totalsY + 16);

    doc.setFont(FONTS.BOLD, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COLORS.MAROON);
    doc.text('Balance Due:', totalsBoxX + 2, totalsY + 22);
    doc.text(`Rs ${formatMoney(balanceDue)}`, pageWidth - 16, totalsY + 22, { align: 'right' });

    doc.setDrawColor(COLORS.MAROON);
    doc.setLineWidth(0.5);
    doc.line(totalsBoxX, totalsY + 26, pageWidth - 16, totalsY + 26);
    doc.setLineWidth(0.2);
    doc.line(totalsBoxX, totalsY + 27, pageWidth - 16, totalsY + 27);
  } else {
    doc.setDrawColor(COLORS.BORDER);
    doc.setLineWidth(0.2);
    doc.line(totalsBoxX, totalsY + 10, pageWidth - 16, totalsY + 10);

    doc.setFont(FONTS.BOLD, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COLORS.MAROON);
    doc.text('Estimated Total:', totalsBoxX + 2, totalsY + 16);
    doc.text(`Rs ${formatMoney(subtotal)}`, pageWidth - 16, totalsY + 16, { align: 'right' });

    doc.setDrawColor(COLORS.MAROON);
    doc.setLineWidth(0.5);
    doc.line(totalsBoxX, totalsY + 20, pageWidth - 16, totalsY + 20);
    doc.setLineWidth(0.2);
    doc.line(totalsBoxX, totalsY + 21, pageWidth - 16, totalsY + 21);
  }

  let dynamicY = totalsY + (isQuotation ? 26 : 32);

  // Paginate wrapped text before drawing it, keeping each heading with a line.
  const drawTextSection = (heading: string, text: string, fontSize: number, color: string) => {
    doc.setFont(FONTS.BODY, 'normal');
    doc.setFontSize(8.5);
    const textLines: string[] = doc.splitTextToSize(text, pageWidth - 110);
    dynamicY = ensureSpace(dynamicY, 10);
    doc.setFont(FONTS.BOLD, 'bold');
    doc.setFontSize(fontSize);
    doc.setTextColor(color);
    doc.text(heading, 16, dynamicY);
    dynamicY += 5;
    doc.setFont(FONTS.BODY, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(COLORS.TEXT);
    for (const line of textLines) {
      dynamicY = ensureSpace(dynamicY, 4);
      doc.text(line, 16, dynamicY);
      dynamicY += 4;
    }
    dynamicY += 5;
  };

  if (isQuotation && params.terms) {
    drawTextSection('TERMS & CONDITIONS:', params.terms, 10, COLORS.MAROON);
  }

  if (params.notes) {
    drawTextSection('ADDITIONAL NOTES:', params.notes, 9, COLORS.TEXT);
  }
  
  // Text sections already include trailing space. Start 4 mm after their
  // final baseline instead of counting that space twice.
  const hasTextSection = Boolean((isQuotation && params.terms) || params.notes);
  const preferredTop = dynamicY + (hasTextSection ? -5 : 5);
  const availableHeight = contentBottom - preferredTop;
  // Use a readable compact arrangement before adding a page solely for signing.
  // Both layouts include the images, labels and text descenders in their bounds.
  const compactSignature = availableHeight < 51 && availableHeight >= 30;
  const signatureTop = ensureSpace(preferredTop, compactSignature ? 30 : 51);

  if (stampData) {
    try { doc.addImage(stampData, 'PNG', 65, signatureTop, compactSignature ? 100 / 3 : 50, compactSignature ? 30 : 45); } catch (e) {}
  }

  if (signatureData) {
    try { doc.addImage(signatureData, 'PNG', 16, signatureTop + (compactSignature ? 2 : 14), compactSignature ? 36 : 45, compactSignature ? 17.6 : 22); } catch (e) {}
  }

  doc.setFont(FONTS.BOLD, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.TEXT);
  doc.text('Authorized Signature', 16, signatureTop + (compactSignature ? 23 : 44));

  doc.setFont(FONTS.BODY, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.TEXT);
  doc.text('Agha Zulfiqar Ahmed', 16, signatureTop + (compactSignature ? 28 : 49));

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    addFooter(doc, i);
  }

  return doc;
}

export async function viewInvoicePdf(params: Parameters<typeof renderInvoicePdf>[0]) {
  try {
    const doc = await renderInvoicePdf(params);
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const viewWindow = window.open(blobUrl, '_blank');
    if (viewWindow) viewWindow.opener = null;
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    if (!viewWindow) alert("Your browser blocked the preview window. Please allow pop-ups for this site.");
  } catch (error) {
    console.error("PDF Preview Error:", error);
    alert("Failed to open the preview window.");
  }
}

export async function downloadInvoicePdf(params: Parameters<typeof renderInvoicePdf>[0]) {
  try {
    const doc = await renderInvoicePdf(params);
    const filename = (params.invoice?.invoiceNumber ?? params.invoiceNumber).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100) || 'HST-document';
    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error("PDF Generation Error:", error);
    alert("Failed to download the PDF. Check console for details.");
  }
}

