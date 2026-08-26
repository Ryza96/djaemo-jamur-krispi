/**
 * Post-backfill verification. Read-only.
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

async function main() {
  console.log("=== POST-BACKFILL VERIFICATION ===\n");

  // 1. Products check
  const { data: products } = await sb.from("products").select("name, weight, weight_grams");
  console.log("── Products ──");
  for (const p of products ?? []) {
    const parsed = Number(String(p.weight).replace(/[^0-9.]/g, ""));
    const ok = p.weight_grams === parsed;
    console.log(`  ${p.name}: weight_grams=${p.weight_grams} (expected ${parsed}) ${ok ? "✓" : "✗ MISMATCH"}`);
  }

  // 2. All order_items
  const { data: items } = await sb
    .from("order_items")
    .select("id, order_id, product_name, quantity, weight_grams")
    .order("id");

  console.log("\n── All order_items ──");
  let totalWeight = 0;
  for (const item of items ?? []) {
    const w = item.weight_grams * item.quantity;
    totalWeight += w;
    console.log(`  #${item.id} ${item.product_name} ×${item.quantity}: ${item.weight_grams}g/ea = ${w}g`);
  }
  console.log(`\n  TOTAL weight across all items: ${totalWeight}g (expected: 1152g) ${totalWeight === 1152 ? "✓" : "✗"}`);

  // 3. Specific order DJ-20260825-1TWC3K9J
  console.log("\n── Order DJ-20260825-1TWC3K9J ──");
  const { data: orderItems } = await sb
    .from("order_items")
    .select("id, product_name, quantity, weight_grams")
    .eq("order_id", (await sb.from("orders").select("id").eq("order_id", "DJ-20260825-1TWC3K9J").single()).data?.id ?? "");

  if (!orderItems || orderItems.length === 0) {
    // Try fetching by order_id directly from orders table
    const { data: order } = await sb.from("orders").select("id").eq("order_id", "DJ-20260825-1TWC3K9J").single();
    if (order) {
      const { data: oi } = await sb.from("order_items").select("id, product_name, quantity, weight_grams").eq("order_id", order.id);
      let orderTotal = 0;
      for (const item of oi ?? []) {
        const w = item.weight_grams * item.quantity;
        orderTotal += w;
        console.log(`  ${item.product_name} ×${item.quantity}: ${item.weight_grams}g/ea = ${w}g`);
      }
      console.log(`\n  Order total: ${orderTotal}g (expected: 216g) ${orderTotal === 216 ? "✓" : "✗"}`);
    } else {
      console.log("  Order not found in database.");
    }
  } else {
    let orderTotal = 0;
    for (const item of orderItems) {
      const w = item.weight_grams * item.quantity;
      orderTotal += w;
      console.log(`  ${item.product_name} ×${item.quantity}: ${item.weight_grams}g/ea = ${w}g`);
    }
    console.log(`\n  Order total: ${orderTotal}g (expected: 216g) ${orderTotal === 216 ? "✓" : "✗"}`);
  }

  // 4. No default 100 remaining
  const { count } = await sb
    .from("order_items")
    .select("*", { count: "exact", head: true })
    .eq("weight_grams", 100);
  console.log(`\n── Remaining default 100g rows: ${count} ${count === 0 ? "✓" : "✗"} ──`);

  console.log("\n=== VERIFICATION COMPLETE ===");
}

main().catch((err) => { console.error(err); process.exit(1); });
