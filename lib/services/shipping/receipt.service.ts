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
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const shipper = getShipperConfig();
  const customer = order.customers;
  const items = order.order_items ?? [];
  const waybill = order.waybill_id ?? order.order_id;

  const PAGE_MARGIN = 40;
  const PAGE_W = doc.page.width - 2 * PAGE_MARGIN;
  const PAGE_B = doc.page.height - PAGE_MARGIN;

  const IMG = {
    logo: 100,
    qr: 100,
    barcodeRatio: 0.8,
  } as const;

  const FONT = {
    waybillValue: 22,
    headerValue: 18,
    recipientName: 17,
    courierValue: 13,
    recipientLabel: 13,
    body: 11,
    sectionLabel: 11,
    waybillLabel: 10,
    senderName: 10,
    courierLabel: 9,
    senderAddr: 9,
    items: 9,
    scan: 9,
    footer: 8,
  } as const;

  const GAP = {
    rowTight: 0.3,
    rowNormal: 0.5,
    rowLoose: 2,
    imageAfter: 1.5,
    sectionAfter: 1,
  } as const;

  const logoBuffer = (() => {
    const p = path.join(process.cwd(), "public", "images", "logo", "logo.png");
    try {
      return fs.existsSync(p) ? fs.readFileSync(p) : null;
    } catch {
      return null;
    }
  })();

  const barcodeBuffer = await generateBarcode(waybill);
  const orderUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/checkout/success?order_id=${order.order_id}`;
  const qrBuffer = await qrToBuffer(orderUrl || String(order.order_id), { type: "png", width: 140 });

  // ── Layout helpers ──

  function pngDim(buf: Buffer) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }

  function checkPageBreak(needed: number) {
    if (doc.y + needed > PAGE_B) doc.addPage();
  }

  function lineHeight() {
    return doc.currentLineHeight();
  }

  function spacer(n: number) {
    doc.moveDown(n);
  }

  function drawDivider() {
    doc.lineWidth(0.5);
    doc.moveTo(doc.x, doc.y).lineTo(doc.x + PAGE_W, doc.y).stroke();
  }

  function measureText(text: string, size: number, family: string) {
    doc.fontSize(size).font(family);
    return doc.heightOfString(text, { width: PAGE_W });
  }

  function renderSectionLabel(text: string, size: number = FONT.sectionLabel) {
    doc.fontSize(size).font("Helvetica-Bold").text(text);
  }

  function renderCentered(text: string, size: number, family: string) {
    doc.fontSize(size).font(family).text(text, { align: "center" });
  }

  function imgDisplayHeight(buf: Buffer, displayW: number) {
    const { w, h } = pngDim(buf);
    return displayW * (h / w);
  }

  function renderImageCentered(buf: Buffer, displayW: number) {
    const { w, h } = pngDim(buf);
    const displayH = displayW * (h / w);
    const x = doc.x + (PAGE_W - displayW) / 2;
    doc.image(buf, x, doc.y, { width: displayW });
    return displayH;
  }

  // ── Section builders ──

  function buildLogo() {
    if (!logoBuffer) return;
    const displayH = imgDisplayHeight(logoBuffer, IMG.logo);
    const needed = displayH + 3 * lineHeight();
    checkPageBreak(needed);
    renderImageCentered(logoBuffer, IMG.logo);
    spacer(3);
  }

  function buildHeader() {
    const textH = measureText("SHIPPING LABEL", FONT.headerValue, "Helvetica-Bold");
    const lh = lineHeight();
    const needed = textH + lh * GAP.rowNormal + lh * GAP.sectionAfter;
    checkPageBreak(needed);
    renderCentered("SHIPPING LABEL", FONT.headerValue, "Helvetica-Bold");
    spacer(GAP.rowNormal);
    drawDivider();
    spacer(GAP.sectionAfter);
  }

  function buildBarcode() {
    const displayW = PAGE_W * IMG.barcodeRatio;
    const displayH = imgDisplayHeight(barcodeBuffer, displayW);
    const needed = displayH + GAP.imageAfter * lineHeight();
    checkPageBreak(needed);
    renderImageCentered(barcodeBuffer, displayW);
    spacer(GAP.imageAfter);
  }

  function buildWaybill() {
    const valueH = measureText(waybill, FONT.waybillValue, "Helvetica-Bold");
    const lhV = lineHeight();
    const labelH = measureText("Nomor Resi", FONT.waybillLabel, "Helvetica");
    const lhL = lineHeight();
    const needed = valueH + lhV * GAP.rowTight + labelH + lhL * GAP.imageAfter + lhL * GAP.sectionAfter;
    checkPageBreak(needed);
    renderCentered(waybill, FONT.waybillValue, "Helvetica-Bold");
    spacer(GAP.rowTight);
    renderCentered("Nomor Resi", FONT.waybillLabel, "Helvetica");
    spacer(GAP.imageAfter);
    drawDivider();
    spacer(GAP.sectionAfter);
  }

  function buildCourier() {
    const parts = [order.courier_company, order.courier_type].filter(Boolean);
    if (!parts.length) return;
    const valueH = measureText(parts.join(" ").toUpperCase(), FONT.courierValue, "Helvetica-Bold");
    const lhV = lineHeight();
    const labelH = measureText("Kurir", FONT.courierLabel, "Helvetica");
    const lhL = lineHeight();
    const needed = valueH + lhV * GAP.rowTight + labelH + lhL * GAP.imageAfter + lhL * GAP.sectionAfter;
    checkPageBreak(needed);
    renderCentered(parts.join(" ").toUpperCase(), FONT.courierValue, "Helvetica-Bold");
    spacer(GAP.rowTight);
    renderCentered("Kurir", FONT.courierLabel, "Helvetica");
    spacer(GAP.imageAfter);
    drawDivider();
    spacer(GAP.sectionAfter);
  }

  function buildRecipient() {
    const name = customer?.name ?? "-";
    const addr = order.shipping_address ?? customer?.address ?? "-";

    doc.fontSize(FONT.recipientLabel).font("Helvetica-Bold");
    const labelH = doc.heightOfString("PENERIMA", { width: PAGE_W });
    const lhLabel = lineHeight();

    doc.fontSize(FONT.recipientName).font("Helvetica-Bold");
    const nameH = doc.heightOfString(name, { width: PAGE_W });
    const lhName = lineHeight();

    doc.fontSize(FONT.body).font("Helvetica");
    const addrH = doc.heightOfString(addr, { width: PAGE_W });
    const lhAddr = lineHeight();

    const needed = labelH + lhLabel * GAP.rowNormal + nameH + lhName * GAP.rowTight + addrH + lhAddr * GAP.rowLoose + lhAddr * GAP.sectionAfter;
    checkPageBreak(needed);

    renderSectionLabel("PENERIMA", FONT.recipientLabel);
    spacer(GAP.rowNormal);
    doc.fontSize(FONT.recipientName).font("Helvetica-Bold").text(name);
    spacer(GAP.rowTight);
    doc.fontSize(FONT.body).font("Helvetica").text(addr, { width: PAGE_W });
    spacer(GAP.rowLoose);
    drawDivider();
    spacer(GAP.sectionAfter);
  }

  function buildSender() {
    doc.fontSize(FONT.sectionLabel).font("Helvetica-Bold");
    const labelH = doc.heightOfString("PENGIRIM", { width: PAGE_W });
    const lhLabel = lineHeight();

    doc.fontSize(FONT.senderName).font("Helvetica");
    const nameH = doc.heightOfString(shipper.name, { width: PAGE_W });

    doc.fontSize(FONT.senderAddr).font("Helvetica");
    const addrH = doc.heightOfString(shipper.address, { width: PAGE_W });
    const lhAddr = lineHeight();

    const needed = labelH + lhLabel * GAP.rowTight + nameH + addrH + lhAddr * GAP.imageAfter + lhAddr * GAP.sectionAfter;
    checkPageBreak(needed);

    renderSectionLabel("PENGIRIM");
    spacer(GAP.rowTight);
    doc.fontSize(FONT.senderName).font("Helvetica").text(shipper.name);
    doc.fontSize(FONT.senderAddr).font("Helvetica").text(shipper.address, { width: PAGE_W });
    spacer(GAP.imageAfter);
    drawDivider();
    spacer(GAP.sectionAfter);
  }

  function buildItems() {
    const LIMIT = 5;
    const shown = items.slice(0, LIMIT);

    doc.fontSize(FONT.sectionLabel).font("Helvetica-Bold");
    const labelH = doc.heightOfString("ITEM", { width: PAGE_W });
    const lhLabel = lineHeight();

    doc.fontSize(FONT.items).font("Helvetica");
    const lhItem = lineHeight();

    let itemsH = 0;
    const lines: string[] = [];
    for (let i = 0; i < shown.length; i++) {
      const line = `${i + 1}. ${shown[i].product_name}  x  ${shown[i].quantity}`;
      lines.push(line);
      itemsH += doc.heightOfString(line, { width: PAGE_W });
    }

    let overflowH = 0;
    if (items.length > LIMIT) {
      overflowH =
        lhItem * 0.2 +
        doc.heightOfString(`+${items.length - LIMIT} item lainnya`, { width: PAGE_W });
    }

    const needed = labelH + lhLabel * GAP.rowTight + itemsH + overflowH + lhItem * GAP.rowLoose + lhItem * GAP.sectionAfter;
    checkPageBreak(needed);

    renderSectionLabel("ITEM");
    spacer(GAP.rowTight);
    doc.fontSize(FONT.items).font("Helvetica");
    for (const line of lines) {
      doc.text(line, { width: PAGE_W });
    }
    if (items.length > LIMIT) {
      spacer(0.2);
      doc.text(`+${items.length - LIMIT} item lainnya`, { width: PAGE_W });
    }
    spacer(GAP.rowLoose);
    drawDivider();
    spacer(GAP.sectionAfter);
  }

  function buildQRFooter() {
    const qrH = imgDisplayHeight(qrBuffer, IMG.qr);

    doc.fontSize(FONT.scan).font("Helvetica");
    const scanH = doc.heightOfString("Scan untuk Tracking", { width: PAGE_W });
    const lhScan = lineHeight();

    doc.fontSize(FONT.footer).font("Helvetica");
    const orderIdH = doc.heightOfString(`Order ID: ${order.order_id}`, { width: PAGE_W });

    const needed = qrH + lhScan * GAP.rowTight + scanH + lhScan * GAP.rowLoose + lhScan * 0.5 + orderIdH;
    checkPageBreak(needed);

    renderImageCentered(qrBuffer, IMG.qr);
    spacer(GAP.rowTight);
    doc.fontSize(FONT.scan).font("Helvetica").text("Scan untuk Tracking", { align: "center" });
    spacer(GAP.rowLoose);
    drawDivider();
    spacer(0.5);
    doc.fontSize(FONT.footer).font("Helvetica").text(`Order ID: ${order.order_id}`, { align: "center" });
    doc.text(`Printed At: ${new Date().toLocaleString()}`, { align: "center" });
  }

  // ── Render pipeline ──

  buildLogo();
  buildHeader();
  buildBarcode();
  buildWaybill();
  buildCourier();
  buildRecipient();
  buildSender();
  buildItems();
  buildQRFooter();

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
        scale: 4,
        height: 15,
        includetext: false,
      },
      (err: unknown, png: Buffer) => {
        if (err) return reject(err);
        resolve(png);
      },
    );
  });
}
