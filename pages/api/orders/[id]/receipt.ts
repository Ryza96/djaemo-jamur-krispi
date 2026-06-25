import type { NextApiRequest, NextApiResponse } from 'next';
import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import QRCode from 'qrcode';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // fetch by order_id or id
    const byOrderId = await supabase.from('orders').select('*, order_items(*)').eq('order_id', id).single();
    
    let order = byOrderId.data as any;

    if (!order) {
      const byId = await supabase.from('orders').select('*, order_items(*)').eq('id', id).single();
      
      order = byId.data as any;
    }

    if (!order) {
      console.warn('Receipt: order not found for id', id);
      return res.status(404).json({ error: 'Order tidak ditemukan.' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 18 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="resi-${order.order_id}.pdf"`);

    // prepare images: logo, barcode, qr
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo', 'logo.png');
    let logoBuffer: Buffer | null = null;
    try {
      if (fs.existsSync(logoPath)) logoBuffer = fs.readFileSync(logoPath);
    } catch (e) {
      logoBuffer = null;
    }

    // barcode (code128)
    const barcodeBuffer = await new Promise<Buffer>((resolve, reject) => {
      bwipjs.toBuffer({
        bcid: 'code128',
        text: String(order.order_id),
        scale: 3,
        height: 10,
        includetext: false,
      }, function (err: any, png: Buffer) {
        if (err) return reject(err);
        resolve(png);
      });
    });

    // QR code pointing to order tracking URL
    const orderUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/orders/${order.order_id}`;
    const qrBuffer = await QRCode.toBuffer(orderUrl || String(order.order_id), { type: 'png', width: 140 });

    // Header area
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const leftColWidth = pageWidth * 0.6;
    const rightColWidth = pageWidth - leftColWidth;

    if (logoBuffer) doc.image(logoBuffer, doc.x, doc.y, { width: 120 });
    doc.fontSize(16).font('Helvetica-Bold').text('WAYBILL / RESI', doc.x + 140, doc.y + 6, { align: 'left' });
    doc.moveDown(0.6);
    doc.fontSize(11).font('Helvetica').text(`No. Order: ${order.order_id}`, { align: 'left' });

    // place barcode on right
    const barcodeX = doc.page.width - doc.page.margins.right - 200;
    doc.image(barcodeBuffer, barcodeX, doc.y - 30, { width: 180 });

    doc.moveDown(1);

    // sender and receiver boxes
    const boxY = doc.y;
    doc.rect(doc.x, boxY, leftColWidth, 110).stroke();
    doc.rect(doc.x + leftColWidth + 10, boxY, rightColWidth - 10, 110).stroke();

    // left: pengirim
    doc.fontSize(10).font('Helvetica-Bold').text('Pengirim:', doc.x + 6, boxY + 6);
    doc.fontSize(10).font('Helvetica').text(order.sender_name || '-', doc.x + 6, boxY + 22);
    doc.fontSize(9).text(order.sender_address || '-', doc.x + 6, boxY + 36, { width: leftColWidth - 12 });

    // right: penerima
    const rightX = doc.x + leftColWidth + 16;
    doc.fontSize(10).font('Helvetica-Bold').text('Penerima:', rightX, boxY + 6);
    doc.fontSize(10).font('Helvetica').text(order.customer_name || order.to_name || '-', rightX, boxY + 22);
    doc.fontSize(9).text(order.customer_address || order.to_address || '-', rightX, boxY + 36, { width: rightColWidth - 26 });

    doc.moveDown(7);

    // shipment info and items
    doc.fontSize(10).font('Helvetica-Bold').text('Detail Pengiriman');
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica').text(`Tanggal: ${new Date(order.created_at).toLocaleString()}`);
    doc.text(`Status: ${order.status || '-'}`);
    doc.text(`Total: Rp ${order.total_amount?.toLocaleString() || 0}`);
    doc.text(`Berat: ${order.weight || '-'}`);

    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').text('Item:');
    doc.moveDown(0.3);
    const items: any[] = order.order_items || [];
    items.forEach((it: any, i: number) => {
      doc.font('Helvetica').fontSize(9).text(`${i + 1}. ${it.name || it.product_name || 'Item'} x ${it.quantity || 1} — Rp ${it.price?.toLocaleString() || 0}`);
    });

    // QR in bottom-right
    doc.image(qrBuffer, doc.page.width - doc.page.margins.right - 120, doc.y + 12, { width: 100 });

    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica').text('Terima kasih telah berbelanja. Simpan resi ini sebagai bukti pengiriman.');

    doc.pipe(res as any);
    doc.end();
  } catch (err: any) {
    console.error('Error generating PDF receipt (pages api):', err);
    res.status(500).json({ error: err?.message || 'Gagal menghasilkan resi.' });
  }
}
