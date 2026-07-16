/**
 * MOCK TEST — WhatsApp Channel MVP
 *
 * Tests:
 *   Scenario #1: Success — formatWaMessage + send via mock provider
 *   Scenario #1b: Missing Phone — channel handles null phone gracefully
 *   Scenario #2: Double Click — idempotency (engine-level explanation)
 *   Scenario #3: Idempotency — same order, same event
 *
 * Run with: npx tsx lib/notifications/__tests__/whatsapp-channel.test.ts
 */

import { createWhatsAppChannel } from "../channels/whatsapp/wa-channel";
import { createMockWhatsAppProvider } from "../channels/whatsapp/mock-provider";
import { formatWaMessage } from "../channels/whatsapp/formatter";
import type { NotificationPayload, NotificationChannel, ChannelResult } from "../types";

// ─── Helpers ────────────────────────────────────────────────────────────

let passCount = 0;
let failCount = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    passCount++;
    console.log(`  ✅ PASS: ${label}`);
  } else {
    failCount++;
    const msg = detail ? `${label} — ${detail}` : label;
    failures.push(msg);
    console.log(`  ❌ FAIL: ${msg}`);
  }
}

function group(name: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${name}`);
  console.log(`${"=".repeat(60)}`);
}

// ─── Mock Payloads ──────────────────────────────────────────────────────

function createMockPayload(overrides?: Partial<NotificationPayload>): NotificationPayload {
  return {
    event: "order.confirmed",
    orderId: "DJ-20260715-A1B2C3D4",
    timestamp: new Date().toISOString(),
    customer: {
      name: "Budi Santoso",
      email: "budi@example.com",
      phone: "6281234567890",
    },
    order: {
      orderId: "DJ-20260715-A1B2C3D4",
      totalAmount: 85000,
      subtotal: 75000,
      shippingFee: 10000,
      shippingAddress: "Jl. Merdeka No. 1, Jakarta",
      createdAt: new Date().toISOString(),
    },
    items: [
      { productName: "Jamur Crispy Original", quantity: 2, price: 35000, subtotal: 70000 },
      { productName: "Sambal Ekstra", quantity: 1, price: 5000, subtotal: 5000 },
    ],
    ...overrides,
  };
}

function createMockPayloadNoPhone(): NotificationPayload {
  return {
    ...createMockPayload(),
    customer: { name: "Budi Santoso", email: "budi@example.com", phone: null },
  };
}

// ─── Main ───────────────────────────────────────────────────────────────

async function main() {

// ─── Test: Scenario #1 — Success ───────────────────────────────────────

group("SCENARIO #1: SUCCESS — Admin Confirm → WA Terkirim");

const payload = createMockPayload();
const channel = createWhatsAppChannel(createMockWhatsAppProvider());

// 1a. Format message
const waMessage = formatWaMessage(payload);
assert(waMessage.message.includes("Budi Santoso"), "Nama customer muncul di WA");
assert(waMessage.message.includes("DJ-20260715-A1B2C3D4"), "Nomor pesanan muncul di WA");
assert(waMessage.message.includes("telah kami konfirmasi"), "Template konfirmasi ada");
assert(waMessage.message.includes("D'Jaemo Jamur Krispi"), "Brand name ada di footer");
assert(waMessage.message.includes("Silahkan simpan Nomor"), "Instruksi tracking ada");
assert(!waMessage.message.includes("{{NAMA_CUSTOMER}}"), "Template variable sudah direplace");
assert(!waMessage.message.includes("{{NOMOR_PESANAN}}"), "Template variable nomor sudah direplace");

// 1b. Send via mock provider
const result = await channel.send(payload, payload.customer);
assert(result.success === true, "Mock provider mengembalikan success");
assert(result.channelId === "whatsapp", "Channel ID adalah 'whatsapp'");
assert(typeof result.messageId === "string" && result.messageId.length > 0, "Message ID dihasilkan");
assert(result.messageId!.startsWith("mock-"), "Message ID diawali 'mock-'");

console.log(`\n📩 WA Message yang akan dikirim:\n---\n${waMessage.message}\n---`);

// ─── Test: Scenario #1b — Missing Phone ─────────────────────────────────

group("SCENARIO #1b: MISSING PHONE — Skip WA");

const noPhonePayload = createMockPayloadNoPhone();
const noPhoneResult = await channel.send(noPhonePayload, noPhonePayload.customer);
assert(noPhoneResult.success === false, "Mengembalikan false saat phone null");
assert(noPhoneResult.error === "NO_RECIPIENT_PHONE", "Error code NO_RECIPIENT_PHONE");

// ─── Test: Scenario #2 — Double Click ───────────────────────────────────

group("SCENARIO #2: DOUBLE CLICK — Protection via state machine");

let sendCount = 0;

const trackingChannel: NotificationChannel = createWhatsAppChannel({
  providerId: "mock-tracker",
  async send() {
    sendCount++;
    return { success: true, messageId: `mock-${sendCount}` };
  },
});

const payloadDc = createMockPayload({ orderId: "DJ-DOUBLE-CLICK" });
const r1 = await trackingChannel.send(payloadDc, payloadDc.customer);
const r2 = await trackingChannel.send(payloadDc, payloadDc.customer);

assert(r1.success === true, "WA ke-1 sukses");
assert(r2.success === true, "WA ke-2 sukses (channel level — dedup di engine)");

// Verify engine-level comment
console.log("");
console.log("  🔒 LAPIS PROTEKSI DOUBLE CLICK:");
console.log("    1st: State machine — confirmed→confirmed = invalid transition");
console.log("    2nd: NotificationLogRepository.isSent() — skip jika already sent");
console.log("    3rd: Partial Unique Index — mencegah duplikat status='sent' di DB");

// ─── Test: Scenario #3 — Idempotency ────────────────────────────────────

group("SCENARIO #3: IDEMPOTENCY — 1 order = 1 notification");

const idemPayload = createMockPayload({ orderId: "DJ-IDEM-001" });
const firstSend = await channel.send(idemPayload, idemPayload.customer);
assert(firstSend.success === true, "WA pertama untuk order baru sukses");

// Second send — in real flow, engine-level isSent() would catch this.
// At channel level, the send will succeed again (channel has no state).
// The real protection is in NotificationLogRepository + Partial Unique Index.
const secondSend = await channel.send(idemPayload, idemPayload.customer);
assert(secondSend.success === true, "WA kedua sukses (channel pure — engine yang skip)");

console.log("");
console.log("  ✅ IDEMPOTENSI DIJAMIN OLEH:");
console.log("    - NotificationLogRepository.isSent() pre-check");
console.log("    - Partial Unique Index: UNIQUE (event, order_id, channel_id) WHERE sent");
console.log("    - tryMarkSent() error 23505 handling");

// ─── Summary ────────────────────────────────────────────────────────────

console.log(`\n${"=".repeat(60)}`);
console.log(`  HASIL TEST`);
console.log(`${"=".repeat(60)}`);
console.log(`  ✅ Pass: ${passCount}`);
console.log(`  ❌ Fail: ${failCount}`);

if (failCount > 0) {
  console.log(`\n  Failures:`);
  for (const f of failures) {
    console.log(`    - ${f}`);
  }
  process.exit(1);
} else {
  console.log(`\n  ✅ SEMUA TEST BERHASIL`);
}

}

main().catch((err) => {
  console.error("❌ Test error:", err);
  process.exit(1);
});
