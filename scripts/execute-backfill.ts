// ⚠️ WARNING: Script ini sudah PERNAH DIJALANKAN pada 2026-08-25 untuk backfill
// weight_grams. JANGAN jalankan ulang tanpa analisis — bisa menimpa data yang
// sudah benar. Backup tersedia di backup/pre-weight-fix-2026-08-25/

/**
 * Execute backfill: products.weight_grams and order_items.weight_grams
 * Uses Supabase JS client (no raw SQL needed).
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

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

function parseWeight(w: string | null): number {
  if (!w) return 100;
  const n = Number(w.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 100;
}

async function main() {
  const stage = process.argv[2]; // "1" or "2"

  if (stage === "1") {
    console.log("=== STAGE 1: Backfill products.weight_grams ===\n");

    const { data: products } = await sb.from("products").select("id, name, weight, weight_grams");
    if (!products) { console.error("Failed to fetch products"); process.exit(1); }

    let updated = 0;
    for (const p of products) {
      const correct = parseWeight(p.weight);
      if (p.weight_grams === correct) {
        console.log(`  SKIP  ${p.name} — already ${correct}`);
        continue;
      }
      const { error } = await sb.from("products").update({ weight_grams: correct }).eq("id", p.id);
      if (error) { console.error(`  ERROR ${p.name}:`, error.message); process.exit(1); }
      console.log(`  FIXED ${p.name}: ${p.weight_grams} → ${correct}`);
      updated++;
    }
    console.log(`\nStage 1 complete: ${updated} products updated.\n`);

  } else if (stage === "2") {
    console.log("=== STAGE 2: Backfill order_items.weight_grams ===\n");

    // Load products to get correct weight_grams
    const { data: products } = await sb.from("products").select("id, weight_grams");
    const productMap = new Map((products ?? []).map((p) => [p.id, p.weight_grams]));

    const { data: items } = await sb.from("order_items").select("id, product_id, product_name, quantity, weight_grams");
    if (!items) { console.error("Failed to fetch order_items"); process.exit(1); }

    let updated = 0;
    for (const item of items) {
      const correctPerItem = productMap.get(item.product_id) ?? 100;
      if (item.weight_grams === correctPerItem) {
        console.log(`  SKIP  #${item.id} ${item.product_name} — already ${correctPerItem}`);
        continue;
      }
      const { error } = await sb.from("order_items").update({ weight_grams: correctPerItem }).eq("id", item.id);
      if (error) { console.error(`  ERROR #${item.id}:`, error.message); process.exit(1); }
      console.log(`  FIXED #${item.id} ${item.product_name}: ${item.weight_grams} → ${correctPerItem} (×${item.quantity} = ${correctPerItem * item.quantity}g)`);
      updated++;
    }
    console.log(`\nStage 2 complete: ${updated} order_items updated.\n`);

  } else {
    console.error("Usage: npx tsx scripts/execute-backfill.ts <1|2>");
    process.exit(1);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
