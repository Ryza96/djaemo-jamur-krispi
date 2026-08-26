/**
 * Generate receipt PDF for a specific order (from DB data).
 * Run: npx tsx scripts/generate-order-receipt.ts DJ-20260825-1TWC3K9J
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";
import { toBuffer as qrToBuffer } from "qrcode";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const SITE = { tagline: "Camilan jamur renyah, alami, dan penuh rasa.", email: "nguntaljamor@gmail.com", phone: "081239047565" };
const C = { primary: "#0b3634", gold: "#e3b33d", goldBright: "#f2c955", cream: "#fbf6ea", ink: "#10201e", inkSoft: "#4c5c58", border: "#d1cdc4", white: "#ffffff" };

function loadLogo(): Buffer | null {
  const p = path.join(process.cwd(), "public", "images", "logo", "logo.png");
  try { return fs.existsSync(p) ? fs.readFileSync(p) : null; } catch { return null; }
}

async function generateBarcode(text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer({ bcid: "code128", text, scale: 4, height: 15, includetext: false },
      (err: unknown, png: Buffer) => { if (err) return reject(err); resolve(png); });
  });
}

async function main() {
  const orderId = process.argv[2];
  if (!orderId) { console.error("Usage: npx tsx scripts/generate-order-receipt.ts <order_id>"); process.exit(1); }

  // Fetch order with items
  const { data: order } = await sb.from("orders").select("*, order_items(*)").eq("order_id", orderId).single();
  if (!order) { console.error(`Order ${orderId} not found`); process.exit(1); }

  const items = order.order_items ?? [];
  const totalWeight = items.reduce((s: number, i: any) => s + (i.weight_grams ?? 0) * i.quantity, 0);
  const totalQty = items.reduce((s: number, i: any) => s + i.quantity, 0);

  console.log(`Order: ${orderId}`);
  console.log(`Items: ${totalQty}`);
  console.log(`Total weight: ${totalWeight}g`);
  console.log(`Weight detail:`);
  for (const item of items) {
    console.log(`  ${item.product_name} ×${item.quantity}: ${item.weight_grams}g/ea = ${item.weight_grams * item.quantity}g`);
  }

  // Generate A6 PDF
  const paper = { width: 297.64, height: 419.53, margin: 15 };
  const doc = new PDFDocument({ size: [paper.width, paper.height], margin: paper.margin, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const waybill = order.waybill_id ?? orderId;
  const PW = paper.width - 2 * paper.margin;
  const LH = paper.height - paper.margin;
  let cursorY = paper.margin;

  const weightLabel = totalWeight >= 1000 ? `${(totalWeight / 1000).toFixed(1)} kg` : `${totalWeight} g`;
  const logoBuffer = loadLogo();
  const barcodeBuffer = await generateBarcode(waybill);
  const qrBuffer = await qrToBuffer(`https://djaemojamurkrispi.com/checkout/success?order_id=${orderId}`, { type: "png", width: 100 });

  function pngDim(buf: Buffer) { return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }; }
  function imgH(buf: Buffer, dw: number) { const d = pngDim(buf); return dw * (d.h / d.w); }
  function checkPageBreak(n: number) { if (cursorY + n > LH) { doc.addPage(); cursorY = paper.margin; } }
  function moveCursor(dy: number) { cursorY += dy; }
  function setFont(s: number, f: string) { doc.fontSize(s).font(f); }
  function drawRR(x: number, y: number, w: number, h: number, r: number, fill: string) { doc.save(); doc.roundedRect(x, y, w, h, r).fill(fill); doc.restore(); }
  function drawLine(x: number, y: number, w: number) { doc.save(); doc.moveTo(x, y).lineTo(x + w, y).lineWidth(0.3).stroke(C.border); doc.restore(); }
  function formatRp(n: number) { return `Rp ${n.toLocaleString("id-ID")}`; }
  function formatDate(iso: string) { return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }); }

  // Header
  checkPageBreak(70);
  const logoW = 18;
  if (logoBuffer) { const lh = imgH(logoBuffer, logoW); doc.image(logoBuffer, paper.margin, cursorY + (10 - lh) / 2, { width: logoW }); }
  const badgeText = "RESI PENGIRIMAN"; setFont(5, "Helvetica-Bold");
  const badgeW = doc.widthOfString(badgeText) + 10; const badgeH = 10; const badgeX = paper.margin + PW - badgeW;
  drawRR(badgeX, cursorY, badgeW, badgeH, 2, C.primary); doc.fillColor(C.white);
  doc.text(badgeText, badgeX + 5, cursorY + 2.5, { width: badgeW - 10, align: "center" }); doc.fillColor(C.ink); moveCursor(12);
  setFont(5, "Helvetica-Oblique"); doc.fillColor(C.inkSoft);
  doc.text(SITE.tagline, paper.margin, cursorY, { width: PW, align: "center" }); doc.fillColor(C.ink); moveCursor(8);
  setFont(6, "Helvetica"); doc.fillColor(C.inkSoft);
  doc.text("No. Order", paper.margin, cursorY, { width: PW * 0.35 });
  setFont(12, "Helvetica-Bold"); doc.fillColor(C.primary);
  doc.text(orderId, paper.margin + PW * 0.35, cursorY - 1, { width: PW * 0.65 }); doc.fillColor(C.ink); moveCursor(15);
  const qrW = 42; const qrH2 = imgH(qrBuffer, qrW); const bcW = PW - qrW - 10; const bcH = imgH(barcodeBuffer, bcW);
  doc.image(qrBuffer, paper.margin, cursorY, { width: qrW });
  doc.image(barcodeBuffer, paper.margin + qrW + 10, cursorY, { width: bcW }); moveCursor(Math.max(qrH2, bcH) + 2);
  setFont(5, "Helvetica"); doc.fillColor(C.inkSoft);
  doc.text(waybill, paper.margin + qrW + 10, cursorY, { width: bcW, align: "center" }); doc.fillColor(C.ink); moveCursor(8);

  // Recipient
  function sectionHeader(label: string) { checkPageBreak(12); const h = 10; drawRR(paper.margin, cursorY, PW, h, 2, C.primary); setFont(5, "Helvetica-Bold"); doc.fillColor(C.white); doc.text(label, paper.margin + 5, cursorY + 2.5, { width: PW - 10 }); doc.fillColor(C.ink); moveCursor(h + 2); }
  function addrBlock(name: string, phone: string, address: string) { const indent = 8; setFont(7, "Helvetica-Bold"); doc.fillColor(C.ink); doc.text(name, paper.margin + indent, cursorY, { width: PW - indent }); moveCursor(doc.heightOfString(name, { width: PW - indent }) + 1); setFont(6, "Helvetica"); doc.fillColor(C.inkSoft); doc.text(phone + "  |  " + address, paper.margin + indent, cursorY, { width: PW - indent, height: 16, ellipsis: true }); doc.fillColor(C.ink); moveCursor(13); }

  sectionHeader("PENERIMA");
  addrBlock(order.customer_name || "-", order.customer_phone || "-", order.shipping_address || "-");
  drawLine(paper.margin, cursorY, PW); moveCursor(2);
  sectionHeader("PENGIRIM");
  addrBlock("Jamur Krispi", "+62812345678", "Bojonegoro");
  drawLine(paper.margin, cursorY, PW); moveCursor(2);

  // Info row
  checkPageBreak(12);
  const parts = [order.courier_company + "/" + order.courier_type, formatDate(order.created_at), `${totalQty} item`, weightLabel, formatRp(order.total_amount)];
  setFont(6, "Helvetica"); doc.fillColor(C.inkSoft);
  doc.text(parts.join("  \u00b7  "), paper.margin, cursorY, { width: PW, align: "center" }); doc.fillColor(C.ink); moveCursor(10);
  drawLine(paper.margin, cursorY, PW); moveCursor(2);

  // Package detail
  checkPageBreak(28); const indent = 8; const leftW = PW * 0.48; const rightW = PW * 0.48; const colGap = PW * 0.04;
  setFont(5.5, "Helvetica"); doc.fillColor(C.inkSoft);
  doc.text("Berat", paper.margin + indent, cursorY, { width: leftW });
  doc.text("Jumlah", paper.margin + leftW + colGap, cursorY, { width: rightW });
  setFont(5.5, "Helvetica-Bold"); doc.fillColor(C.ink);
  doc.text(weightLabel, paper.margin + indent, cursorY + 7, { width: leftW });
  doc.text(`${totalQty} item`, paper.margin + leftW + colGap, cursorY + 7, { width: rightW });
  doc.fillColor(C.ink); moveCursor(16);
  drawLine(paper.margin, cursorY, PW); moveCursor(2);

  // Notes
  checkPageBreak(14); drawRR(paper.margin, cursorY, PW, 12, 2, C.cream);
  setFont(5, "Helvetica-Oblique"); doc.fillColor(C.inkSoft);
  doc.text("Harap simpan resi ini sebagai bukti pengiriman.", paper.margin + 4, cursorY + 3, { width: PW - 8, align: "center" });
  doc.fillColor(C.ink); moveCursor(16);

  // Footer
  checkPageBreak(44); const footerH = 38; drawRR(paper.margin, cursorY, PW, footerH, 3, C.primary);
  setFont(12, "Helvetica-BoldOblique"); doc.fillColor(C.gold);
  doc.text("Terima Kasih", paper.margin, cursorY + 3, { width: PW, align: "center" });
  setFont(4.5, "Helvetica-Oblique"); doc.fillColor(C.cream);
  doc.text("Sudah mendukung UMKM lokal.", paper.margin, cursorY + 17, { width: PW, align: "center" });
  setFont(4.5, "Helvetica"); doc.fillColor(C.goldBright);
  doc.text(`${SITE.phone}  |  ${SITE.email}`, paper.margin, cursorY + 26, { width: PW, align: "center" });
  doc.fillColor(C.ink); moveCursor(footerH + 4);
  checkPageBreak(10); setFont(5, "Helvetica"); doc.fillColor(C.inkSoft);
  doc.text("Jika paket tidak diterima dalam kondisi baik, segera hubungi kami.", paper.margin, cursorY, { width: PW, align: "center" });
  doc.fillColor(C.ink); moveCursor(8);

  // Output
  return new Promise<void>((resolve) => {
    doc.on("end", () => {
      const pdf = Buffer.concat(chunks);
      const outPath = path.join(process.cwd(), `receipt-${orderId}.pdf`);
      fs.writeFileSync(outPath, pdf);
      console.log(`\nPDF generated: ${outPath} (${pdf.length} bytes)`);
      resolve();
    });
    doc.end();
  });
}

main().catch((err) => { console.error(err); process.exit(1); });
