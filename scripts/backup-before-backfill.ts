/**
 * Backup script: export products and order_items to CSV before backfill.
 * READ-ONLY on source data — writes only to backup/ directory.
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
const backupDir = path.join(process.cwd(), "backup", "pre-weight-fix-2026-08-25");

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => {
      const v = row[h];
      if (v === null || v === undefined) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    }).join(","));
  }
  return lines.join("\n");
}

async function main() {
  console.log("=== BACKUP: pre-weight-fix-2026-08-25 ===\n");

  // Backup products
  const { data: products } = await sb.from("products").select("*");
  if (products) {
    const csv = toCsv(products as Record<string, unknown>[]);
    const filePath = path.join(backupDir, "products.csv");
    fs.writeFileSync(filePath, csv);
    console.log(`products: ${products.length} rows → ${filePath}`);
  }

  // Backup order_items
  const { data: items } = await sb.from("order_items").select("*");
  if (items) {
    const csv = toCsv(items as Record<string, unknown>[]);
    const filePath = path.join(backupDir, "order_items.csv");
    fs.writeFileSync(filePath, csv);
    console.log(`order_items: ${items.length} rows → ${filePath}`);
  }

  console.log("\nBackup complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
