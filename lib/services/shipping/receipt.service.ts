import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";
import { toBuffer as qrToBuffer } from "qrcode";
import fs from "fs";
import path from "path";
import { OrderRepository } from "@/lib/repositories";
import { getShipperConfig } from "./constants";
import type { OrderDetailRow } from "@/lib/repositories/order.repository";
import { SITE } from "@/lib/constants";

export interface ReceiptResult {
  success: true;
  pdf: Buffer;
  filename: string;
}

export interface ReceiptError {
  success: false;
  error: string;
}

/**
 * Paper size configuration.
 * To add a new size (e.g. thermal 10×15 cm), add an entry here and
 * pass `size` to generateReceipt(). No other code needs to change.
 *
 * 1 mm ≈ 2.83465 pt
 */
const PAPER_SIZES = {
  A6: { width: 297.64, height: 419.53, margin: 15 },
  A4: { width: 595.28, height: 841.89, margin: 35 },
} as const;

type PaperKey = keyof typeof PAPER_SIZES;

export const ReceiptService = {
  async generateReceipt(
    orderId: string,
    paperSize: PaperKey = "A6",
  ): Promise<ReceiptResult | ReceiptError> {
    try {
      const order = await OrderRepository.findDetailByOrderId(orderId);
      if (!order) {
        return { success: false, error: "ORDER_NOT_FOUND" };
      }

      const pdf = await buildPdf(order, PAPER_SIZES[paperSize]);
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

/* ── Brand palette (from globals.css) ── */
const C = {
  primary: "#0b3634",      // --teal-deep
  primaryMid: "#12504c",   // --teal-mid
  gold: "#e3b33d",         // --gold
  goldBright: "#f2c955",   // --gold-bright
  cream: "#fbf6ea",        // --cream
  cream2: "#f3ead6",       // --cream-2
  ink: "#10201e",          // --ink
  inkSoft: "#4c5c58",      // --ink-soft
  border: "#d1cdc4",       // neutral border
  white: "#ffffff",
} as const;

async function buildPdf(
  order: OrderDetailRow,
  paper: { width: number; height: number; margin: number },
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: [paper.width, paper.height],
    margin: paper.margin,
    bufferPages: true,
  });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const shipper = getShipperConfig();
  const items = order.order_items ?? [];
  const waybill = order.waybill_id ?? order.order_id;

  const PW = paper.width - 2 * paper.margin;
  const LH = paper.height - paper.margin;
  let cursorY = paper.margin;

  /* ── Derived data ── */
  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
  const totalWeightGrams = items.reduce((s, i) => s + (i.weight_grams ?? 0) * i.quantity, 0);
  const hasNotes = Boolean(order.notes && order.notes.trim());
  const weightLabel =
    totalWeightGrams > 0
      ? totalWeightGrams >= 1000
        ? `${(totalWeightGrams / 1000).toFixed(1)} kg`
        : `${totalWeightGrams} g`
      : "-";

  /* ── Size-adaptive flags ── */
  const compact = PW < 350;

  /* ── Images ── */
  const logoBuffer = loadLogo();
  const barcodeBuffer = await generateBarcode(waybill);
  const orderUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/checkout/success?order_id=${order.order_id}`;
  const qrBuffer = await qrToBuffer(orderUrl || String(order.order_id), {
    type: "png",
    width: compact ? 100 : 180,
  });

  /* ── Helpers ── */

  function pngDim(buf: Buffer) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }

  function imgH(buf: Buffer, displayW: number) {
    const d = pngDim(buf);
    return displayW * (d.h / d.w);
  }

  function checkPageBreak(needed: number) {
    if (cursorY + needed > LH) {
      doc.addPage();
      cursorY = paper.margin;
    }
  }

  function moveCursor(dy: number) {
    cursorY += dy;
  }

  function setFont(size: number, family: string) {
    doc.fontSize(size).font(family);
  }

  function drawRoundedRect(
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill: string,
  ) {
    doc.save();
    doc.roundedRect(x, y, w, h, r).fill(fill);
    doc.restore();
  }

  function drawBoxBorder(x: number, y: number, w: number, h: number) {
    doc.save();
    doc.roundedRect(x, y, w, h, 3).lineWidth(0.5).stroke(C.border);
    doc.restore();
  }

  function drawThinLine(x: number, y: number, w: number) {
    doc.save();
    doc.moveTo(x, y).lineTo(x + w, y).lineWidth(0.3).stroke(C.border);
    doc.restore();
  }

  function formatRp(n: number) {
    return `Rp ${n.toLocaleString("id-ID")}`;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     A6 COMPACT LAYOUT — portrait, brand-matched, mockup-derived
     Budget: ~389pt usable height (419.53 - 2×15)
     Target total: ~320pt for 2-item order
     ══════════════════════════════════════════════════════════════════════ */

  function buildCompactHeader() {
    checkPageBreak(70);

    // Row 1: Logo left + tagline + badge right  (~14pt)
    const logoW = 18;
    if (logoBuffer) {
      const lh = imgH(logoBuffer, logoW);
      doc.image(logoBuffer, paper.margin, cursorY + (10 - lh) / 2, { width: logoW });
    }
    // Badge right-aligned on same line
    const badgeText = "RESI PENGIRIMAN";
    setFont(5, "Helvetica-Bold");
    const badgeW = doc.widthOfString(badgeText) + 10;
    const badgeH = 10;
    const badgeX = paper.margin + PW - badgeW;
    drawRoundedRect(badgeX, cursorY, badgeW, badgeH, 2, C.primary);
    doc.fillColor(C.white);
    doc.text(badgeText, badgeX + 5, cursorY + 2.5, { width: badgeW - 10, align: "center" });
    doc.fillColor(C.ink);
    moveCursor(12);

    // Row 2: Tagline
    setFont(5, "Helvetica-Oblique");
    doc.fillColor(C.inkSoft);
    doc.text(SITE.tagline, paper.margin, cursorY, { width: PW, align: "center" });
    doc.fillColor(C.ink);
    moveCursor(8);

    // Row 3: "No. Order" + order ID
    setFont(6, "Helvetica");
    doc.fillColor(C.inkSoft);
    doc.text("No. Order", paper.margin, cursorY, { width: PW * 0.35 });
    setFont(12, "Helvetica-Bold");
    doc.fillColor(C.primary);
    doc.text(order.order_id, paper.margin + PW * 0.35, cursorY - 1, { width: PW * 0.65 });
    doc.fillColor(C.ink);
    moveCursor(15);

    // Row 4: QR left + barcode right
    const qrW = 42;
    const qrH = imgH(qrBuffer, qrW);
    const barcodeW = PW - qrW - 10;
    const barcodeH = imgH(barcodeBuffer, barcodeW);

    doc.image(qrBuffer, paper.margin, cursorY, { width: qrW });
    doc.image(barcodeBuffer, paper.margin + qrW + 10, cursorY, { width: barcodeW });
    moveCursor(Math.max(qrH, barcodeH) + 2);

    // Barcode text below
    setFont(5, "Helvetica");
    doc.fillColor(C.inkSoft);
    doc.text(waybill, paper.margin + qrW + 10, cursorY, { width: barcodeW, align: "center" });
    doc.fillColor(C.ink);
    moveCursor(8);
  }

  function buildCompactSectionHeader(label: string) {
    checkPageBreak(12);
    const h = 10;
    drawRoundedRect(paper.margin, cursorY, PW, h, 2, C.primary);
    setFont(5, "Helvetica-Bold");
    doc.fillColor(C.white);
    doc.text(label, paper.margin + 5, cursorY + 2.5, { width: PW - 10 });
    doc.fillColor(C.ink);
    moveCursor(h + 2);
  }

  function buildCompactAddressBlock(
    name: string,
    phone: string,
    address: string,
  ) {
    const indent = 8;
    const lineH = 8;

    setFont(7, "Helvetica-Bold");
    doc.fillColor(C.ink);
    doc.text(name, paper.margin + indent, cursorY, { width: PW - indent });
    moveCursor(doc.heightOfString(name, { width: PW - indent }) + 1);

    setFont(6, "Helvetica");
    doc.fillColor(C.inkSoft);
    doc.text(phone + "  |  " + address, paper.margin + indent, cursorY, {
      width: PW - indent,
      height: lineH * 2,
      ellipsis: true,
    });
    doc.fillColor(C.ink);
    moveCursor(lineH + 5);
  }

  function buildCompactRecipient() {
    buildCompactSectionHeader("PENERIMA");
    buildCompactAddressBlock(
      order.customer_name || "-",
      order.customer_phone || "-",
      order.shipping_address || "-",
    );
    drawThinLine(paper.margin, cursorY, PW);
    moveCursor(2);
  }

  function buildCompactSender() {
    buildCompactSectionHeader("PENGIRIM");
    buildCompactAddressBlock(
      shipper.name,
      shipper.phone || "-",
      [shipper.address, shipper.city].filter(Boolean).join(", "),
    );
    drawThinLine(paper.margin, cursorY, PW);
    moveCursor(2);
  }

  function buildCompactInfoRow() {
    // One compact row: courier · date · items · weight · total
    checkPageBreak(12);
    const parts: string[] = [];
    const courierParts = [order.courier_company, order.courier_type].filter(Boolean);
    if (courierParts.length) parts.push(courierParts.join("/").toUpperCase());
    parts.push(formatDate(order.created_at));
    parts.push(`${totalQuantity} item`);
    if (totalWeightGrams > 0) parts.push(weightLabel);
    parts.push(formatRp(order.total_amount));

    setFont(6, "Helvetica");
    doc.fillColor(C.inkSoft);
    doc.text(parts.join("  \u00b7  "), paper.margin, cursorY, { width: PW, align: "center" });
    doc.fillColor(C.ink);
    moveCursor(10);

    // ETD if available
    const orderAny = order as unknown as { courier_etd?: string | null };
    const etd = orderAny.courier_etd;
    if (typeof etd === "string" && etd) {
      setFont(5.5, "Helvetica");
      doc.fillColor(C.inkSoft);
      doc.text("Estimasi: " + etd, paper.margin, cursorY, { width: PW, align: "center" });
      doc.fillColor(C.ink);
      moveCursor(8);
    }

    drawThinLine(paper.margin, cursorY, PW);
    moveCursor(2);
  }

  function buildCompactPackageDetail() {
    checkPageBreak(28);
    const indent = 8;
    const rowH = 8;

    // Compact 2-column layout for package details
    const leftW = PW * 0.48;
    const rightW = PW * 0.48;
    const colGap = PW * 0.04;

    // Row 1: Berat + Jumlah
    setFont(5.5, "Helvetica");
    doc.fillColor(C.inkSoft);
    doc.text("Berat", paper.margin + indent, cursorY, { width: leftW });
    doc.text("Jumlah", paper.margin + leftW + colGap, cursorY, { width: rightW });
    setFont(5.5, "Helvetica-Bold");
    doc.fillColor(C.ink);
    doc.text(weightLabel, paper.margin + indent, cursorY + 7, { width: leftW });
    doc.text(`${totalQuantity} item`, paper.margin + leftW + colGap, cursorY + 7, { width: rightW });
    doc.fillColor(C.ink);
    moveCursor(rowH + 8);

    // Row 2: Asuransi + Produk (truncated)
    setFont(5.5, "Helvetica");
    doc.fillColor(C.inkSoft);
    doc.text("Asuransi", paper.margin + indent, cursorY, { width: leftW });
    doc.text("Produk", paper.margin + leftW + colGap, cursorY, { width: rightW });
    setFont(5.5, "Helvetica-Bold");
    doc.fillColor(C.ink);
    doc.text("Tidak", paper.margin + indent, cursorY + 7, { width: leftW });
    const prodText = items.slice(0, 3).map((it) => it.product_name).join(", ") + (items.length > 3 ? "..." : "");
    setFont(5.5, "Helvetica");
    doc.text(prodText, paper.margin + leftW + colGap, cursorY + 7, { width: rightW, ellipsis: true });
    doc.fillColor(C.ink);
    moveCursor(rowH + 8);

    drawThinLine(paper.margin, cursorY, PW);
    moveCursor(2);
  }

  function buildCompactNotes() {
    if (!hasNotes) {
      checkPageBreak(14);
      drawRoundedRect(paper.margin, cursorY, PW, 12, 2, C.cream);
      setFont(5, "Helvetica-Oblique");
      doc.fillColor(C.inkSoft);
      doc.text(
        "Harap simpan resi ini sebagai bukti pengiriman.",
        paper.margin + 4,
        cursorY + 3,
        { width: PW - 8, align: "center" },
      );
      doc.fillColor(C.ink);
      moveCursor(16);
      return;
    }

    checkPageBreak(20);
    const textW = PW - 10;
    setFont(6, "Helvetica");
    const notesH = doc.heightOfString(order.notes!, { width: textW });
    const sectionH = Math.max(notesH + 10, 18);
    drawRoundedRect(paper.margin, cursorY, PW, sectionH, 2, C.cream);

    setFont(5, "Helvetica-Bold");
    doc.fillColor(C.primary);
    doc.text("CATATAN", paper.margin + 5, cursorY + 2, { width: textW });

    setFont(6, "Helvetica");
    doc.fillColor(C.inkSoft);
    doc.text(order.notes!, paper.margin + 5, cursorY + 9, {
      width: textW,
      height: notesH,
      ellipsis: true,
    });
    doc.fillColor(C.ink);
    moveCursor(sectionH + 3);
  }

  function buildCompactFooter() {
    // Footer: "Terima Kasih" + contact + warning — all in compact bar
    checkPageBreak(44);
    const footerH = 38;

    drawRoundedRect(paper.margin, cursorY, PW, footerH, 3, C.primary);

    setFont(12, "Helvetica-BoldOblique");
    doc.fillColor(C.gold);
    doc.text("Terima Kasih", paper.margin, cursorY + 3, { width: PW, align: "center" });

    setFont(4.5, "Helvetica-Oblique");
    doc.fillColor(C.cream);
    doc.text("Sudah mendukung UMKM lokal.", paper.margin, cursorY + 17, { width: PW, align: "center" });

    setFont(4.5, "Helvetica");
    doc.fillColor(C.goldBright);
    const contactParts: string[] = [];
    if (SITE.phone) contactParts.push(SITE.phone);
    if (SITE.email) contactParts.push(SITE.email);
    doc.text(contactParts.join("  |  "), paper.margin, cursorY + 26, { width: PW, align: "center" });

    doc.fillColor(C.ink);
    moveCursor(footerH + 4);

    // Warning
    checkPageBreak(10);
    setFont(5, "Helvetica");
    doc.fillColor(C.inkSoft);
    doc.text(
      "Jika paket tidak diterima dalam kondisi baik, segera hubungi kami.",
      paper.margin, cursorY, { width: PW, align: "center" },
    );
    doc.fillColor(C.ink);
    moveCursor(8);
  }

  /* ══════════════════════════════════════════════════════════════════════
     A4 FULL LAYOUT — desain asli, dipertahankan
     ══════════════════════════════════════════════════════════════════════ */

  function buildA4Header() {
    const logoDisplayW = 70;
    const logoDisplayH = logoBuffer ? imgH(logoBuffer, logoDisplayW) : 0;
    const sectionH = Math.max(28, logoDisplayH) + 12;
    checkPageBreak(sectionH);

    drawRoundedRect(paper.margin, cursorY, PW, sectionH, 6, C.primary);

    if (logoBuffer) {
      const logoY = cursorY + (sectionH - logoDisplayH) / 2;
      doc.image(logoBuffer, paper.margin + 10, logoY, { width: logoDisplayW });
    }

    setFont(20, "Helvetica-Bold");
    doc.fillColor(C.white);
    const tw = doc.widthOfString("SHIPPING LABEL");
    doc.text("SHIPPING LABEL", paper.margin + PW - tw - 15, cursorY + (sectionH - 20) / 2);
    doc.fillColor(C.ink);
    moveCursor(sectionH + 10);
  }

  function buildA4Waybill() {
    checkPageBreak(65);
    setFont(26, "Helvetica-Bold");
    doc.fillColor(C.primary);
    doc.text(waybill, paper.margin, cursorY, { width: PW, align: "center" });
    doc.fillColor(C.ink);
    moveCursor(32);
    setFont(9, "Helvetica");
    doc.fillColor(C.inkSoft);
    doc.text("NOMOR RESI", paper.margin, cursorY, { width: PW, align: "center" });
    doc.fillColor(C.ink);
    moveCursor(14);
  }

  function buildA4Barcode() {
    const barcodeW = PW * 0.85;
    const barcodeH = imgH(barcodeBuffer, barcodeW);
    checkPageBreak(barcodeH + 14);
    const x = paper.margin + (PW - barcodeW) / 2;
    doc.image(barcodeBuffer, x, cursorY, { width: barcodeW });
    moveCursor(barcodeH + 10);
    setFont(8, "Helvetica");
    doc.fillColor(C.inkSoft);
    doc.text(waybill, paper.margin, cursorY, { width: PW, align: "center" });
    doc.fillColor(C.ink);
    moveCursor(14);
  }

  function buildA4Courier() {
    const parts = [order.courier_company, order.courier_type].filter(Boolean);
    if (!parts.length) return;
    const label = parts.join(" / ").toUpperCase();
    setFont(10, "Helvetica-Bold");
    const tw = doc.widthOfString(label);
    const badgeW = tw + 24;
    const badgeH = 22;
    const badgeX = paper.margin + (PW - badgeW) / 2;
    checkPageBreak(badgeH + 14);
    drawRoundedRect(badgeX, cursorY, badgeW, badgeH, 4, C.cream);
    drawBoxBorder(badgeX, cursorY, badgeW, badgeH);
    doc.fillColor(C.primary);
    doc.text(label, badgeX + 12, cursorY + 5, { width: badgeW - 24, align: "center" });
    doc.fillColor(C.ink);
    moveCursor(badgeH + 10);
  }

  function buildA4SenderRecipient() {
    const leftW = PW * 0.6 - 5;
    const rightW = PW * 0.4 - 5;
    const boxH = 130;
    checkPageBreak(boxH + 14);

    const leftX = paper.margin;
    const rightX = paper.margin + leftW + 10;
    const y = cursorY;

    drawRoundedRect(leftX, y, leftW, boxH, 6, C.cream);
    drawRoundedRect(rightX, y, rightW, boxH, 6, C.cream);

    let ly = y + 10;
    drawRoundedRect(leftX, ly, leftW, 20, 4, C.primaryMid);
    setFont(9, "Helvetica-Bold");
    doc.fillColor(C.white);
    doc.text("PENERIMA", leftX + 8, ly + 5, { width: leftW - 16 });
    doc.fillColor(C.ink);
    ly += 28;
    setFont(13, "Helvetica-Bold");
    doc.text(order.customer_name || "-", leftX + 10, ly, { width: leftW - 20 });
    ly += doc.heightOfString(order.customer_name || "-", { width: leftW - 20 }) + 4;
    if (order.customer_phone) {
      setFont(9, "Helvetica");
      doc.fillColor(C.inkSoft);
      doc.text(`Telp: ${order.customer_phone}`, leftX + 10, ly, { width: leftW - 20 });
      ly += 14;
    }
    setFont(9, "Helvetica");
    doc.fillColor(C.inkSoft);
    const addrH = doc.heightOfString(order.shipping_address || "-", { width: leftW - 20 });
    const addrSpace = boxH - (ly - y) - 10;
    doc.text(order.shipping_address || "-", leftX + 10, ly, {
      width: leftW - 20,
      height: Math.min(addrH, addrSpace),
      ellipsis: true,
    });

    let ry = y + 10;
    drawRoundedRect(rightX, ry, rightW, 20, 4, C.primary);
    setFont(9, "Helvetica-Bold");
    doc.fillColor(C.white);
    doc.text("PENGIRIM", rightX + 8, ry + 5, { width: rightW - 16 });
    doc.fillColor(C.ink);
    ry += 28;
    setFont(11, "Helvetica-Bold");
    doc.text(shipper.name, rightX + 8, ry, { width: rightW - 16 });
    ry += doc.heightOfString(shipper.name, { width: rightW - 16 }) + 4;
    setFont(9, "Helvetica");
    doc.fillColor(C.inkSoft);
    doc.text(`Telp: ${shipper.phone}`, rightX + 8, ry, { width: rightW - 16 });
    ry += 14;
    const sAddrH = doc.heightOfString(shipper.address || "-", { width: rightW - 16 });
    const sAddrSpace = boxH - (ry - y) - 10;
    doc.text(shipper.address || "-", rightX + 8, ry, {
      width: rightW - 16,
      height: Math.min(sAddrH, sAddrSpace),
      ellipsis: true,
    });

    doc.fillColor(C.ink);
    moveCursor(boxH + 10);
  }

  function buildA4PackageInfo() {
    const barH = 24;
    checkPageBreak(barH + 10);
    drawRoundedRect(paper.margin, cursorY, PW, barH, 4, C.cream);
    drawBoxBorder(paper.margin, cursorY, PW, barH);
    const colW = PW / 4;
    const fields = [
      { label: "TANGGAL", value: formatDate(order.created_at) },
      { label: "JUMLAH", value: `${totalQuantity} item` },
      { label: "BERAT", value: weightLabel },
      { label: "TOTAL", value: formatRp(order.total_amount) },
    ];
    fields.forEach((f, i) => {
      const x = paper.margin + i * colW + 8;
      setFont(7, "Helvetica");
      doc.fillColor(C.inkSoft);
      doc.text(f.label, x, cursorY + 4, { width: colW - 16 });
      setFont(9, "Helvetica-Bold");
      doc.fillColor(C.ink);
      doc.text(f.value, x, cursorY + 14, { width: colW - 16 });
    });
    doc.fillColor(C.ink);
    moveCursor(barH + 10);
  }

  function buildA4Notes() {
    if (!hasNotes) return;
    const labelH = 16;
    setFont(8, "Helvetica");
    const notesH = doc.heightOfString(order.notes!, { width: PW - 20 });
    const sectionH = labelH + notesH + 14;
    checkPageBreak(sectionH + 10);
    drawRoundedRect(paper.margin, cursorY, PW, sectionH, 6, C.cream);
    drawBoxBorder(paper.margin, cursorY, PW, sectionH);
    setFont(8, "Helvetica-Bold");
    doc.fillColor(C.primary);
    doc.text("CATATAN CUSTOMER", paper.margin + 10, cursorY + 6, { width: PW - 20 });
    setFont(9, "Helvetica");
    doc.fillColor(C.inkSoft);
    doc.text(order.notes!, paper.margin + 10, cursorY + labelH + 4, { width: PW - 20 });
    doc.fillColor(C.ink);
    moveCursor(sectionH + 8);
  }

  function buildA4Items() {
    const LIMIT = 8;
    const shown = items.slice(0, LIMIT);
    const headerH = 22;
    const rowH = 16;
    const rowsH = shown.length * rowH;
    const overflowH = items.length > LIMIT ? rowH : 0;
    const sectionH = headerH + rowsH + overflowH + 12;
    checkPageBreak(sectionH + 10);

    drawRoundedRect(paper.margin, cursorY, PW, headerH, 4, C.primary);
    setFont(9, "Helvetica-Bold");
    doc.fillColor(C.white);
    doc.text(
      `DAFTAR ITEM${items.length > LIMIT ? ` (${LIMIT} dari ${items.length})` : ""}`,
      paper.margin + 10,
      cursorY + 6,
      { width: PW - 20 },
    );
    doc.fillColor(C.ink);
    moveCursor(headerH + 4);

    setFont(7, "Helvetica");
    doc.fillColor(C.inkSoft);
    doc.text("NO", paper.margin + 8, cursorY, { width: 25 });
    doc.text("NAMA PRODUK", paper.margin + 33, cursorY, { width: PW - 130 });
    doc.text("QTY", paper.margin + PW - 95, cursorY, { width: 35, align: "center" });
    doc.text("SUBTOTAL", paper.margin + PW - 55, cursorY, { width: 55, align: "right" });
    moveCursor(12);
    doc.save();
    doc.moveTo(paper.margin + 5, cursorY).lineTo(paper.margin + PW - 5, cursorY).lineWidth(0.3).stroke(C.border);
    doc.restore();
    moveCursor(3);

    for (let i = 0; i < shown.length; i++) {
      const item = shown[i];
      setFont(9, "Helvetica");
      doc.fillColor(C.ink);
      doc.text(String(i + 1), paper.margin + 8, cursorY, { width: 25 });
      doc.text(item.product_name, paper.margin + 33, cursorY, { width: PW - 130, ellipsis: true });
      doc.text(String(item.quantity), paper.margin + PW - 95, cursorY, { width: 35, align: "center" });
      doc.text(formatRp(item.subtotal), paper.margin + PW - 55, cursorY, { width: 55, align: "right" });
      moveCursor(rowH);
    }

    if (items.length > LIMIT) {
      setFont(8, "Helvetica");
      doc.fillColor(C.inkSoft);
      doc.text(`+${items.length - LIMIT} item lainnya`, paper.margin + 33, cursorY, { width: PW - 130 });
      moveCursor(rowH);
    }
    doc.fillColor(C.ink);
    moveCursor(10);
  }

  function buildA4QR() {
    const qrDisplayW = 90;
    const qrDisplayH = imgH(qrBuffer, qrDisplayW);
    const sigBoxH = 80;
    const sectionH = Math.max(qrDisplayH + 20, sigBoxH) + 30;
    checkPageBreak(sectionH);

    const leftW = PW * 0.45;
    const rightW = PW * 0.55 - 5;
    const rightX = paper.margin + leftW + 10;

    const qrX = paper.margin + (leftW - qrDisplayW) / 2;
    doc.image(qrBuffer, qrX, cursorY, { width: qrDisplayW });
    setFont(8, "Helvetica");
    doc.fillColor(C.inkSoft);
    doc.text("Scan untuk Tracking", paper.margin, cursorY + qrDisplayH + 4, { width: leftW, align: "center" });
    setFont(7, "Helvetica");
    doc.text(order.order_id, paper.margin, cursorY + qrDisplayH + 16, { width: leftW, align: "center" });

    drawBoxBorder(rightX, cursorY, rightW, sigBoxH);
    setFont(8, "Helvetica-Bold");
    doc.fillColor(C.inkSoft);
    doc.text("TANDA TANGAN PENERIMA", rightX + 8, cursorY + 6, { width: rightW - 16 });
    setFont(7, "Helvetica");
    doc.fillColor(C.inkSoft);
    doc.text("Tanggal: ........../........../..........", rightX + 8, cursorY + sigBoxH - 20, { width: rightW - 16 });

    doc.fillColor(C.ink);
    moveCursor(sectionH);
  }

  function buildA4Footer() {
    checkPageBreak(30);
    doc.save();
    doc.moveTo(paper.margin, cursorY).lineTo(paper.margin + PW, cursorY).lineWidth(0.3).stroke(C.border);
    doc.restore();
    moveCursor(8);
    setFont(7, "Helvetica");
    doc.fillColor(C.inkSoft);
    doc.text(
      `${shipper.name} — ${shipper.address || ""} ${shipper.city || ""} | Dicetak: ${new Date().toLocaleString("id-ID")}`,
      paper.margin,
      cursorY,
      { width: PW, align: "center" },
    );
    doc.fillColor(C.ink);
  }

  /* ── Render pipeline ── */

  if (compact) {
    buildCompactHeader();
    buildCompactRecipient();
    buildCompactSender();
    buildCompactInfoRow();
    buildCompactPackageDetail();
    buildCompactNotes();
    buildCompactFooter();
  } else {
    buildA4Header();
    buildA4Waybill();
    buildA4Barcode();
    buildA4Courier();
    buildA4SenderRecipient();
    buildA4PackageInfo();
    buildA4Notes();
    buildA4Items();
    buildA4QR();
    buildA4Footer();
  }

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

/* ── Utilities ── */

function loadLogo(): Buffer | null {
  const p = path.join(process.cwd(), "public", "images", "logo", "logo.png");
  try {
    return fs.existsSync(p) ? fs.readFileSync(p) : null;
  } catch {
    return null;
  }
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
