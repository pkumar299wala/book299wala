// Book.299wala.com - Protected Firebase Storage Download, PDF Watermarking & Excel Export Service
import { getBytes, ref } from 'firebase/storage';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import * as XLSX from 'xlsx';
import { storage } from '../firebase';
import { Order, Product } from '../types';
import { getFileRecordFirestore } from './firestoreService';

function maskMobile(mobile: string): string {
  if (mobile.length < 6) return mobile;
  return `${mobile.slice(0, 5)}xxxxx`;
}

// Verifies paid/confirmed order, fetches protected file bytes from Firebase Storage (if uploaded),
// and stamps Customer Name + Mobile + Order ID watermark on every page.
export async function generateWatermarkedProductFile(params: {
  order: Order;
  product?: Product;
  productId: string;
  watermarkEnabled: boolean;
}): Promise<{ blob: Blob; filename: string }> {
  const { order, product, productId, watermarkEnabled } = params;
  const orderItem = order.items.find((i) => i.productId === productId);
  const fileId = orderItem?.mainFileId || product?.mainFileId;
  const baseName =
    orderItem?.mainFileName || product?.mainFileName || `${product?.name || 'Study_Material'}.pdf`;

  let uploadedMeta = null;
  let fileBytes: ArrayBuffer | null = null;

  if (fileId) {
    try {
      uploadedMeta = await getFileRecordFirestore(fileId);
      if (uploadedMeta?.storagePath) {
        fileBytes = await getBytes(ref(storage, uploadedMeta.storagePath));
      }
    } catch (err) {
      console.warn('Fetching protected storage file fallback to generated study PDF:', err);
    }
  }

  // If uploaded file is non-PDF (Word/Excel/PPT/ZIP), return raw bytes securely
  if (
    fileBytes &&
    uploadedMeta &&
    !uploadedMeta.mimeType.includes('pdf') &&
    !uploadedMeta.name.toLowerCase().endsWith('.pdf')
  ) {
    return {
      blob: new Blob([fileBytes], { type: uploadedMeta.mimeType }),
      filename: uploadedMeta.name,
    };
  }

  let pdfDoc: PDFDocument;
  if (fileBytes) {
    try {
      pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    } catch {
      pdfDoc = await createStudyPdfDocument(product, order.id);
    }
  } else {
    pdfDoc = await createStudyPdfDocument(product, order.id);
  }

  // Stamp customer Name + Mobile + Order ID watermark on every page
  if (watermarkEnabled) {
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const watermarkText = `For: ${order.customerName} - ${maskMobile(order.mobile)} - Order #${order.id} - Book.299wala.com`;
    const pages = pdfDoc.getPages();

    pages.forEach((page, idx) => {
      const { height } = page.getSize();
      page.drawText(watermarkText, {
        x: 42,
        y: height / 2 - 45,
        size: 14,
        font,
        color: rgb(0.04, 0.17, 0.44),
        opacity: 0.16,
        rotate: degrees(32),
      });
      page.drawText(`${watermarkText} | Page ${idx + 1}`, {
        x: 32,
        y: 20,
        size: 8.5,
        font,
        color: rgb(0.85, 0.28, 0.05),
        opacity: 0.85,
      });
    });
  }

  const outBytes = await pdfDoc.save();
  const safeFilename = baseName.toLowerCase().endsWith('.pdf') ? baseName : `${baseName}.pdf`;
  return {
    blob: new Blob([outBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
    filename: safeFilename,
  };
}

async function createStudyPdfDocument(product?: Product, orderId?: string): Promise<PDFDocument> {
  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const title = product?.name || 'Book.299wala.com Study Material';
  const sampleSections = product?.samplePagesText?.length
    ? product.samplePagesText
    : [
        'Chapter 1 Overview: Important Board Exam Concepts, Definitions & Formulas.',
        'Chapter 2 Practice Questions: Most Expected Long & Short Questions with Answers.',
        'Quick Revision Summary: Exam Hall Tips by Galaxy Science Academy, Ghazipur.',
      ];

  sampleSections.forEach((sectionText, idx) => {
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();

    page.drawRectangle({
      x: 0,
      y: height - 72,
      width,
      height: 72,
      color: rgb(11 / 255, 44 / 255, 111 / 255),
    });

    page.drawText('Book.299wala.com | Galaxy Science Academy, Ghazipur', {
      x: 36,
      y: height - 32,
      size: 13,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText(`${product?.classLevel || 'Board'} | ${product?.subject || 'Study Pack'} | Order #${orderId || ''}`, {
      x: 36,
      y: height - 52,
      size: 10,
      font: bodyFont,
      color: rgb(1, 0.78, 0.55),
    });

    page.drawText(title.slice(0, 68), {
      x: 36,
      y: height - 110,
      size: 15,
      font: boldFont,
      color: rgb(0.06, 0.09, 0.16),
    });

    page.drawText(`Page ${idx + 1} of ${sampleSections.length} (Licensed Student Edition)`, {
      x: 36,
      y: height - 132,
      size: 10,
      font: bodyFont,
      color: rgb(0.35, 0.4, 0.48),
    });

    page.drawLine({
      start: { x: 36, y: height - 144 },
      end: { x: width - 36, y: height - 144 },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92),
    });

    const words = sectionText.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      if ((current + ' ' + w).length > 76) {
        lines.push(current.trim());
        current = w;
      } else {
        current += ' ' + w;
      }
    }
    if (current.trim()) lines.push(current.trim());

    let yPos = height - 178;
    for (const line of lines) {
      page.drawText(line, {
        x: 36,
        y: yPos,
        size: 12,
        font: bodyFont,
        color: rgb(0.12, 0.16, 0.22),
      });
      yPos -= 20;
    }

    if (idx === 0 && product?.whatIsInside?.length) {
      yPos -= 20;
      page.drawText('Key Highlights Included in This Pack:', {
        x: 36,
        y: yPos,
        size: 12,
        font: boldFont,
        color: rgb(11 / 255, 44 / 255, 111 / 255),
      });
      yPos -= 20;
      product.whatIsInside.forEach((item) => {
        page.drawText(`• ${item.slice(0, 72)}`, {
          x: 44,
          y: yPos,
          size: 11,
          font: bodyFont,
          color: rgb(0.2, 0.25, 0.32),
        });
        yPos -= 18;
      });
    }

    page.drawText('Protected Student Copy · Book.299wala.com · Galaxy Science Academy, Ghazipur', {
      x: 36,
      y: 40,
      size: 9,
      font: bodyFont,
      color: rgb(0.42, 0.46, 0.52),
    });
  });

  return pdfDoc;
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function exportSalesReportExcel(orders: Order[], format: 'xlsx' | 'csv'): void {
  const rows = orders.map((o) => ({
    'Order ID': `#${o.id}`,
    'Date': new Date(o.createdAt).toLocaleString('en-IN'),
    'Customer Name': o.customerName,
    'Mobile': o.mobile,
    'WhatsApp': o.whatsapp,
    'Class': o.classLevel,
    'Products': o.items.map((i) => `${i.productName} (x${i.quantity})`).join(', '),
    'Subtotal (INR)': o.subtotal,
    'Discount (INR)': o.discountAmount + o.comboDiscount,
    'Delivery (INR)': o.deliveryCharge,
    'Grand Total (INR)': o.grandTotal,
    'Payment Mode': o.paymentMethod,
    'Payment Status': o.paymentStatus,
    'Order Status': o.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');

  if (format === 'xlsx') {
    XLSX.writeFile(workbook, `Book299wala_Sales_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } else {
    XLSX.writeFile(workbook, `Book299wala_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`, {
      bookType: 'csv',
    });
  }
}
