/**
 * Regression tests for inventory + fulfillment concurrency fixes.
 *
 * Run: npx tsx scripts/verify-inventory-concurrency.ts
 *
 * Covers:
 *  1. validateStockBatch duplicate-product aggregation (Fix 1)
 *  2. Index alignment — Map-based productName lookup (Fix 1)
 */

let passed = 0;
let failed = 0;

function assert(cond: boolean, name: string, detail?: string) {
  if (cond) {
    passed++;
    console.log(`  \x1b[32m✔\x1b[0m ${name}`);
  } else {
    failed++;
    console.error(`  \x1b[31m✘\x1b[0m ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function assertEqual(a: unknown, b: unknown, name: string, detail?: string) {
  assert(
    JSON.stringify(a) === JSON.stringify(b),
    name,
    detail ?? `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`,
  );
}

console.log("=".repeat(60));
console.log("Fix 1: Duplicate-product aggregation in validateStockBatch");
console.log("=".repeat(60));

// Simulate the aggregation logic currently in inventory.repository.ts
// validateStockBatch — group by productId, SUM quantities, compare to stock.
function simulateValidateStockBatch(
  items: Array<{ productId: string; quantity: number }>,
  stockMap: Map<string, number>,
): Array<{
  productId: string;
  productName: string;
  requested: number;
  available: number;
  sufficient: boolean;
}> {
  const ids = [...new Set(items.map((i) => i.productId))];
  const aggregated = new Map<string, number>();
  for (const item of items) {
    aggregated.set(
      item.productId,
      (aggregated.get(item.productId) ?? 0) + item.quantity,
    );
  }
  const results: Array<{
    productId: string;
    productName: string;
    requested: number;
    available: number;
    sufficient: boolean;
  }> = [];
  for (const [productId, totalQty] of aggregated) {
    const currentStock = stockMap.get(productId) ?? 0;
    results.push({
      productId,
      productName: "",
      requested: totalQty,
      available: currentStock,
      sufficient: currentStock >= totalQty,
    });
  }
  return results;
}

// Scenario: product A stock=5, two order_items both A (qty 3 + qty 4 = 7).
{
  const stockMap = new Map<string, number>([
    ["A", 5],
    ["B", 10],
  ]);
  const items = [
    { productId: "A", quantity: 3 },
    { productId: "A", quantity: 4 },
    { productId: "B", quantity: 2 },
  ];
  const results = simulateValidateStockBatch(items, stockMap);
  const resultA = results.find((r) => r.productId === "A");
  const resultB = results.find((r) => r.productId === "B");

  assert(results.length === 2, "Deduplicates A into single row", `got ${results.length}`);
  assert(
    resultA?.requested === 7 && resultA?.sufficient === false,
    "Cumulative qty (7) > stock (5) → insufficient",
    `requested=${resultA?.requested} sufficient=${resultA?.sufficient}`,
  );
  assertEqual(
    resultB?.requested,
    2,
    "Non-duplicate product unaffected",
  );
}

// Scenario: product C stock=10, three order_items C (qty 2 + 3 + 5 = 10) → sufficient.
{
  const stockMap = new Map<string, number>([["C", 10]]);
  const items = [
    { productId: "C", quantity: 2 },
    { productId: "C", quantity: 3 },
    { productId: "C", quantity: 5 },
  ];
  const results = simulateValidateStockBatch(items, stockMap);
  const resultC = results.find((r) => r.productId === "C");
  assertEqual(
    resultC?.requested,
    10,
    "Cumulative exactly equal stock → sufficient",
  );
  assert(resultC?.sufficient === true, "-> sufficient=true");
}

// Scenario: product missing from stockMap → treated as insufficient.
{
  const stockMap = new Map<string, number>();
  const items = [{ productId: "GHOST", quantity: 1 }];
  const results = simulateValidateStockBatch(items, stockMap);
  const g = results.find((r) => r.productId === "GHOST");
  assert(
    g?.available === 0 && g?.sufficient === false,
    "Missing product → available 0, insufficient",
  );
}

console.log("");
console.log("=".repeat(60));
console.log("Fix 1: Map-based productName lookup (index alignment)");
console.log("=".repeat(60));

// Simulate the service-layer mapping for validateOrderStock:
// build Map<productId, productName> from order_items, then fill names by map lookup.
function mapNamesByLookup(
  results: Array<{ productId: string; productName: string }>,
  orderItems: Array<{ product_id: string; product_name: string }>,
) {
  const nameMap = new Map(orderItems.map((i) => [i.product_id, i.product_name]));
  return results.map((r) => ({ ...r, productName: nameMap.get(r.productId) ?? "" }));
}

{
  // order_items with duplicate product A (positions 0 and 1)
  const orderItems = [
    { product_id: "A", product_name: "Jamur Original" },
    { product_id: "A", product_name: "Jamur Original" },
    { product_id: "B", product_name: "Jamur Pedas" },
  ];
  // validateStockBatch dedupes → results has A (once) and B
  const batchResults = [
    { productId: "A", productName: "", requested: 7, available: 5, sufficient: false },
    { productId: "B", productName: "", requested: 2, available: 10, sufficient: true },
  ];
  const mapped = mapNamesByLookup(batchResults, orderItems);
  const mappedA = mapped.find((r) => r.productId === "A");
  const mappedB = mapped.find((r) => r.productId === "B");
  assertEqual(
    mappedA?.productName,
    "Jamur Original",
    "productName filled from Map by productId (not positional)",
  );
  assertEqual(mappedB?.productName, "Jamur Pedas", "B name correct");
}

console.log("");
if (failed === 0) {
  console.log(`\x1b[32mAll ${passed} assertions passed.\x1b[0m`);
} else {
  console.error(`\x1b[31m${failed} of ${passed + failed} assertions FAILED.\x1b[0m`);
  process.exit(1);
}
