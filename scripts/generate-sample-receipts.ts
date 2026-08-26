/**
 * Standalone script to generate sample receipt PDFs for preview.
 * Run: npx tsx scripts/generate-sample-receipts.ts
 */
import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";
import { toBuffer as qrToBuffer } from "qrcode";
import fs from "fs";
import path from "path";

const SITE = {
  name: "Djaemo Jamur Krispi",
  tagline: "Camilan jamur renyah, alami, dan penuh rasa.",
  email: "nguntaljamor@gmail.com",
  phone: "081239047565",
};

const C = {
  primary: "#0b3634",
  primaryMid: "#12504c",
  gold: "#e3b33d",
  goldBright: "#f2c955",
  cream: "#fbf6ea",
  cream2: "#f3ead6",
  ink: "#10201e",
  inkSoft: "#4c5c58",
  border: "#d1cdc4",
  white: "#ffffff",
} as const;

const PAPER_SIZES = {
  A6: { width: 297.64, height: 419.53, margin: 15 },
} as const;

/* ── Mock data ── */
function mockOrder2Item() {
  return {
    id: "mock-1",
    order_id: "DJM-20260825-001",
    customer_name: "Rina Susanti",
    customer_phone: "+62 856-1234-5678",
    customer_email: "rina@example.com",
    shipping_address:
      "Jl. Merdeka No. 42, RT 03/RW 05, Kel. Sukamaju, Kec. Bojonegoro, Kab. Bojonegoro, Jawa Timur 62115",
    notes: "Tolong bungkus bubble wrap ekstra ya, biar aman.",
    total_amount: 87000,
    created_at: "2026-08-20T10:30:00Z",
    courier_company: "jne",
    courier_type: "reg",
    courier_etd: "2-3 hari",
    waybill_id: "JNE1234567890",
    order_items: [
      { product_name: "Jamur Krispi Original 250g", price: 45000, quantity: 1, subtotal: 45000, weight_grams: 300 },
      { product_name: "Jamur Krispi Pedas 250g", price: 42000, quantity: 1, subtotal: 42000, weight_grams: 300 },
    ],
  };
}

function mockOrder5Item() {
  return {
    id: "mock-2",
    order_id: "DJM-20260825-002",
    customer_name: "Budi Santoso",
    customer_phone: "+62 813-9876-5432",
    customer_email: "budi@example.com",
    shipping_address:
      "Jl. Pahlawan No. 17, Kel. Ngumpakdalem, Kec. Bojonegoro, Kab. Bojonegoro, Jawa Timur 62111",
    notes: null,
    total_amount: 215000,
    created_at: "2026-08-22T09:15:00Z",
    courier_company: "jne",
    courier_type: "oke",
    courier_etd: "3-4 hari",
    waybill_id: "JNE0987654321",
    order_items: [
      { product_name: "Jamur Krispi Original 250g", price: 45000, quantity: 2, subtotal: 90000, weight_grams: 300 },
      { product_name: "Jamur Krispi Pedas 250g", price: 42000, quantity: 1, subtotal: 42000, weight_grams: 300 },
      { product_name: "Jamur Krispi Balado 500g", price: 85000, quantity: 1, subtotal: 85000, weight_grams: 550 },
      { product_name: "Jamur Krispi Original 100g", price: 20000, quantity: 1, subtotal: 20000, weight_grams: 120 },
    ],
  };
}

/* ── Logo ── */
function loadLogo(): Buffer | null {
  const p = path.join(process.cwd(), "public", "images", "logo", "logo.png");
  try {
    return fs.existsSync(p) ? fs.readFileSync(p) : null;
  } catch {
    return null;
  }
}

/* ── Barcode ── */
async function generateBarcode(text: string): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    bwipjs.toBuffer(
      { bcid: "code128", text: String(text), scale: 4, height: 15, includetext: false },
      (err: unknown, png: Buffer) => {
        if (err) return reject(err);
        resolve(png);
      },
    );
  });
}

/* ── buildA6Pdf (copied from receipt.service.ts) ── */
async function buildA6Pdf(order: any): Promise<Buffer> {
  const paper = PAPER_SIZES.A6;
  const doc = new PDFDocument({
    size: [paper.width, paper.height],
    margin: paper.margin,
    bufferPages: true,
  });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const shipper = {
    name: "Jamur Krispi",
    phone: "+62812345678",
    address: "",
    city: "Bojonegoro",
  };
  const items = order.order_items ?? [];
  const waybill = order.waybill_id ?? order.order_id;

  const PW = paper.width - 2 * paper.margin;
  const LH = paper.height - paper.margin;
  let cursorY = paper.margin;

  const totalQuantity = items.reduce((s: number, i: any) => s + i.quantity, 0);
  const totalWeightGrams = items.reduce((s: number, i: any) => s + (i.weight_grams ?? 0) * i.quantity, 0);
  const hasNotes = Boolean(order.notes && order.notes.trim());
  const weightLabel =
    totalWeightGrams > 0
      ? totalWeightGrams >= 1000
        ? `${(totalWeightGrams / 1000).toFixed(1)} kg`
        : `${totalWeightGrams} g`
      : "-";

  const compact = PW < 350;
  const logoBuffer = loadLogo();
  const barcodeBuffer = await generateBarcode(waybill);
  const orderUrl = `https://djaemojamurkrispi.com/checkout/success?order_id=${order.order_id}`;
  const qrBuffer = await qrToBuffer(orderUrl, { type: "png", width: 100 });

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
  function drawRoundedRect(x: number, y: number, w: number, h: number, r: number, fill: string) {
    doc.save();
    doc.roundedRect(x, y, w, h, r).fill(fill);
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
    return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  }

  /* ── Compact Header ── */
  function buildCompactHeader() {
    checkPageBreak(70);
    const logoW = 18;
    if (logoBuffer) {
      const lh = imgH(logoBuffer, logoW);
      doc.image(logoBuffer, paper.margin, cursorY + (10 - lh) / 2, { width: logoW });
    }
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

    setFont(5, "Helvetica-Oblique");
    doc.fillColor(C.inkSoft);
    doc.text(SITE.tagline, paper.margin, cursorY, { width: PW, align: "center" });
    doc.fillColor(C.ink);
    moveCursor(8);

    setFont(6, "Helvetica");
    doc.fillColor(C.inkSoft);
    doc.text("No. Order", paper.margin, cursorY, { width: PW * 0.35 });
    setFont(12, "Helvetica-Bold");
    doc.fillColor(C.primary);
    doc.text(order.order_id, paper.margin + PW * 0.35, cursorY - 1, { width: PW * 0.65 });
    doc.fillColor(C.ink);
    moveCursor(15);

    const qrW = 42;
    const qrH = imgH(qrBuffer, qrW);
    const barcodeW = PW - qrW - 10;
    const barcodeH = imgH(barcodeBuffer, barcodeW);
    doc.image(qrBuffer, paper.margin, cursorY, { width: qrW });
    doc.image(barcodeBuffer, paper.margin + qrW + 10, cursorY, { width: barcodeW });
    moveCursor(Math.max(qrH, barcodeH) + 2);

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

  function buildCompactAddressBlock(name: string, phone: string, address: string) {
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

    const orderAny = order as any;
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
    const leftW = PW * 0.48;
    const rightW = PW * 0.48;
    const colGap = PW * 0.04;

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

    setFont(5.5, "Helvetica");
    doc.fillColor(C.inkSoft);
    doc.text("Asuransi", paper.margin + indent, cursorY, { width: leftW });
    doc.text("Produk", paper.margin + leftW + colGap, cursorY, { width: rightW });
    setFont(5.5, "Helvetica-Bold");
    doc.fillColor(C.ink);
    doc.text("Tidak", paper.margin + indent, cursorY + 7, { width: leftW });
    const prodText = items.slice(0, 3).map((it: any) => it.product_name).join(", ") + (items.length > 3 ? "..." : "");
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

    // Warning — no icon unicode, plain text only
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

  /* ── Pipeline ── */
  buildCompactHeader();
  buildCompactRecipient();
  buildCompactSender();
  buildCompactInfoRow();
  buildCompactPackageDetail();
  buildCompactNotes();
  buildCompactFooter();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

/* ── Main ── */
async function main() {
  console.log("Generating sample receipt PDFs...");

  const order2 = mockOrder2Item();
  const pdf2 = await buildA6Pdf(order2);
  const out2 = path.join(process.cwd(), "sample-receipt-a6.pdf");
  fs.writeFileSync(out2, pdf2);
  console.log(`  -> ${out2}`);

  const order5 = mockOrder5Item();
  const pdf5 = await buildA6Pdf(order5);
  const out5 = path.join(process.cwd(), "sample-receipt-a6-5item.pdf");
  fs.writeFileSync(out5, pdf5);
  console.log(`  -> ${out5}`);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
