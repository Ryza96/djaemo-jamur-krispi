import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.join(process.cwd(), ".env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  const k = t.slice(0, i).trim();
  const v = t.slice(i + 1).trim();
  if (!(k in process.env)) process.env[k] = v;
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data: products } = await sb.from("products").select("id, name, weight, weight_grams");
  console.log("=== PRODUCTS: weight (text) vs weight_grams (int) ===\n");
  for (const p of products ?? []) {
    const parsedWeight = Number(String(p.weight).replace(/[^0-9.]/g, ""));
    const match = p.weight_grams === parsedWeight;
    console.log(`${p.name}`);
    console.log(`  weight (text): "${p.weight}" → parsed: ${parsedWeight}`);
    console.log(`  weight_grams (int): ${p.weight_grams}`);
    console.log(`  ${match ? "MATCH" : "MISMATCH — weight_grams needs backfill"}`);
    console.log("");
  }
}
main();
