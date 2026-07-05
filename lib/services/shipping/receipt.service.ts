import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";
import { toBuffer as qrToBuffer } from "qrcode";
import fs from "fs";
import path from "path";
import { OrderRepository } from "@/lib/repositories";
import { getShipperConfig } from "./constants";
import type { OrderDetailRow } from "@/lib/repositories/order.repository";

export interface ReceiptResult {
  success: true;
  pdf: Buffer;
  filename: string;
}

export interface ReceiptError {
  success: false;
  error: string;
}

export const ReceiptService = {
  async generateReceipt(orderId: string): Promise<ReceiptResult | ReceiptError> {
    try {
      const order = await OrderRepository.findDetailByOrderId(orderId);
      if (!order) {
        return { success: false, error: "ORDER_NOT_FOUND" };
      }

      const pdf = await buildPdf(order);
      return {
        success: true,
        pdf,
        filename: `resi-${order.order_id}.pdf`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate receipt";
      return { success: false, error: message };
    }
  },
};

async function buildPdf(order: OrderDetailRow): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 18 });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const shipper = getShipperConfig();
  const customer = order.customers;
  const items = order.order_items ?? [];

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const leftColWidth = pageWidth * 0.6;
  const rightColWidth = pageWidth - leftColWidth;

  const logoPath = path.join(process.cwd(), "public", "images", "logo", "logo.png");
  let logoBuffer: Buffer | null = null;
  try {
    if (fs.existsSync(logoPath)) logoBuffer = fs.readFileSync(logoPath);
  } catch {
    logoBuffer = null;
  }

  const barcodeBuffer = await generateBarcode(order.order_id);
  const orderUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/orders/${order.order_id}`;
  const qrBuffer = await qrToBuffer(orderUrl || String(order.order_id), { type: "png", width: 140 });

  if (logoBuffer) doc.image(logoBuffer, doc.x, doc.y, { width: 120 });
  doc.fontSize(16).font("Helvetica-Bold").text("WAYBILL / RESI", doc.x + 140, doc.y + 6, { align: "left" });
  doc.moveDown(0.6);
  doc.fontSize(11).font("Helvetica").text(`No. Order: ${order.order_id}`, { align: "left" });

  const barcodeX = doc.page.width - doc.page.margins.right - 200;
  doc.image(barcodeBuffer, barcodeX, doc.y - 30, { width: 180 });

  doc.moveDown(1);

  const boxY = doc.y;
  doc.rect(doc.x, boxY, leftColWidth, 110).stroke();
  doc.rect(doc.x + leftColWidth + 10, boxY, rightColWidth - 10, 110).stroke();

  doc.fontSize(10).font("Helvetica-Bold").text("Pengirim:", doc.x + 6, boxY + 6);
  doc.fontSize(10).font("Helvetica").text(shipper.name, doc.x + 6, boxY + 22);
  doc.fontSize(9).text(shipper.address, doc.x + 6, boxY + 36, { width: leftColWidth - 12 });

  const rightX = doc.x + leftColWidth + 16;
  doc.fontSize(10).font("Helvetica-Bold").text("Penerima:", rightX, boxY + 6);
  doc.fontSize(10).font("Helvetica").text(customer?.name ?? "-", rightX, boxY + 22);
  doc.fontSize(9).text(customer?.address ?? "-", rightX, boxY + 36, { width: rightColWidth - 26 });

  doc.moveDown(7);

  doc.fontSize(10).font("Helvetica-Bold").text("Detail Pengiriman");
  doc.moveDown(0.3);
  doc.fontSize(9).font("Helvetica").text(`Tanggal: ${new Date(order.created_at).toLocaleString()}`);
  doc.text(`Status: ${order.fulfillment_status ?? order.status ?? "-"}`);
  doc.text(`Total: Rp ${order.total_amount?.toLocaleString() ?? 0}`);

  const totalWeight = items.reduce((sum, item) => sum + (item.weight_grams ?? 0) * item.quantity, 0);
  doc.text(`Berat: ${totalWeight > 0 ? `${totalWeight} gram` : "-"}`);

  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica-Bold").text("Item:");
  doc.moveDown(0.3);
  items.forEach((it, i) => {
    doc.font("Helvetica").fontSize(9).text(`${i + 1}. ${it.product_name} x ${it.quantity} — Rp ${it.price?.toLocaleString() ?? 0}`);
  });

  doc.image(qrBuffer, doc.page.width - doc.page.margins.right - 120, doc.y + 12, { width: 100 });

  doc.moveDown(2);
  doc.fontSize(9).font("Helvetica").text("Terima kasih telah berbelanja. Simpan resi ini sebagai bukti pengiriman.");

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

async function generateBarcode(text: string): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: "code128",
        text: String(text),
        scale: 3,
        height: 10,
        includetext: false,
      },
      (err: unknown, png: Buffer) => {
        if (err) return reject(err);
        resolve(png);
      },
    );
  });
}
