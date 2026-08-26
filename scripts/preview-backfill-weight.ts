/**
 * Read-only script: preview backfill of weight_grams
 * TWO-STAGE backfill:
 *   Stage 1: products.weight_grams ← parse(products.weight)
 *   Stage 2: order_items.weight_grams ← products.weight_grams × quantity
 *
 * Run: npx tsx scripts/preview-backfill-weight.ts
 * NO UPDATE/INSERT/DELETE — SELECT only.
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function parseWeight(w: string | null): number {
  if (!w) return 100;
  const n = Number(w.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 100;
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   BACKFILL PREVIEW — READ ONLY, TIDAK ADA YANG DIUBAH  ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  // ── Stage 1: products ──
  console.log("═══ STAGE 1: Backfill products.weight_grams ═══\n");

  const { data: products } = await sb
    .from("products")
    .select("id, name, weight, weight_grams")
    .order("name");

  if (!products || products.length === 0) {
    console.log("No products found.");
    return;
  }

  console.log(
    "product_name".padEnd(42) +
    "weight(text)".padEnd(15) +
    "current_wg".padEnd(12) +
    "correct_wg".padEnd(12) +
    "action"
  );
  console.log("─".repeat(95));

  let stage1Updates = 0;
  let stage1Skipped = 0;

  for (const p of products) {
    const correct = parseWeight(p.weight);
    const needsUpdate = p.weight_grams !== correct;
    if (needsUpdate) stage1Updates++;
    else stage1Skipped++;

    console.log(
      (p.name || "").substring(0, 40).padEnd(42) +
      (p.weight || "null").padEnd(15) +
      String(p.weight_grams).padEnd(12) +
      String(correct).padEnd(12) +
      (needsUpdate ? "UPDATE → " + correct : "KEEP (already correct)")
    );
  }

  console.log(`\nStage 1: ${stage1Updates} to UPDATE, ${stage1Skipped} already correct\n`);

  // ── Stage 2: order_items ──
  console.log("═══ STAGE 2: Backfill order_items.weight_grams ═══\n");

  const { data: items } = await sb
    .from("order_items")
    .select("id, order_id, product_id, product_name, quantity, weight_grams, created_at")
    .order("created_at", { ascending: false });

  if (!items || items.length === 0) {
    console.log("No order_items found.");
    return;
  }

  const productMap = new Map((products).map((p) => [p.id, p]));

  console.log(
    "item_id".padEnd(8) +
    "product_name".padEnd(38) +
    "qty".padEnd(5) +
    "current".padEnd(10) +
    "correct".padEnd(10) +
    "diff".padEnd(10) +
    "action"
  );
  console.log("─".repeat(100));

  let stage2Updates = 0;
  let stage2Skipped = 0;
  let totalCurrentWeight = 0;
  let totalCorrectWeight = 0;

  for (const item of items) {
    const product = productMap.get(item.product_id);
    const correctPerItem = parseWeight(product?.weight ?? null);
    const correctTotal = correctPerItem * item.quantity;
    const currentTotal = item.weight_grams * item.quantity;
    const diff = correctTotal - currentTotal;
    const needsUpdate = item.weight_grams !== correctPerItem;

    if (needsUpdate) stage2Updates++;
    else stage2Skipped++;
    totalCurrentWeight += currentTotal;
    totalCorrectWeight += correctTotal;

    console.log(
      String(item.id).padEnd(8) +
      (item.product_name || "").substring(0, 36).padEnd(38) +
      String(item.quantity).padEnd(5) +
      `${item.weight_grams}g`.padEnd(10) +
      `${correctTotal}g`.padEnd(10) +
      `${diff >= 0 ? "+" : ""}${diff}g`.padEnd(10) +
      (needsUpdate ? `UPDATE ${item.weight_grams}→${correctPerItem}` : "KEEP")
    );
  }

  console.log(`\nStage 2: ${stage2Updates} to UPDATE, ${stage2Skipped} already correct`);
  console.log(`Total weight across all items: ${totalCurrentWeight}g → ${totalCorrectWeight}g (diff: ${totalCorrectWeight - totalCurrentWeight}g)\n`);

  // ── SQL Preview ──
  console.log("═══ SQL YANG AKAN DIJALANKAN (setelah approval) ═══\n");
  console.log(`-- Stage 1: Fix products.weight_grams from weight text
UPDATE products
SET weight_grams = CAST(REGEXP_REPLACE(weight, '[^0-9.]', '', 'g') AS INTEGER)
WHERE weight_grams != CAST(REGEXP_REPLACE(weight, '[^0-9.]', '', 'g') AS INTEGER)
  AND weight IS NOT NULL;

-- Stage 2: Fix order_items.weight_grams from corrected products
UPDATE order_items
SET weight_grams = p.weight_grams
FROM products p
WHERE order_items.product_id = p.id
  AND order_items.weight_grams != p.weight_grams;`);

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║              DRY RUN ONLY — TIDAK ADA YANG DIUPDATE     ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
