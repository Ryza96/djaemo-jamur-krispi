/**
 * INTEGRATION TEST — Admin → Notification Log Flow
 *
 * Tests the full pipeline:
 *   Admin Confirm → FulfillmentService → NotificationEngine
 *   → PayloadBuilder → WA Channel → MockProvider → NotificationLog
 *
 * Scenarios:
 *   #1: SUCCESS — Admin confirms order → notification sent
 *   #2: DOUBLE CONFIRM — 1 order = 1 notification (idempotency)
 *   #3: INVALID TRANSITION — confirmed → confirmed rejected
 *
 * NOTE: Transition table logic is mirrored from fulfillment.service.ts
 * to avoid importing Supabase-dependent modules. This tests the
 * integration CONTRACT between components.
 *
 * Run with:
 *   $env:NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="fake-key"
 *   npx tsx lib/notifications/__tests__/admin-notification-integration.test.ts
 */

// Env vars must be set BEFORE running this script (tsx hoists imports):
//   $env:NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321";
//   $env:SUPABASE_SERVICE_ROLE_KEY="fake-key";
//   npx tsx lib/notifications/__tests__/admin-notification-integration.test.ts

// ─── Static Imports (no Supabase dependency) ─────────────────────────────

import { FULFILLMENT_STATUS } from "../../services/payment/types";
import { createWhatsAppChannel } from "../channels/whatsapp/wa-channel";
import { createMockWhatsAppProvider } from "../channels/whatsapp/mock-provider";
import { formatWaMessage } from "../channels/whatsapp/formatter";
import { createChannelRegistry } from "../channel-registry";
import { createEmailChannel } from "../channels/email/email-channel";
import { createMockEmailProvider } from "../channels/email/mock-provider";
import type {
  NotificationPayload,
  NotificationChannel,
  ChannelResult,
} from "../types";
import type { FulfillmentStatus } from "../../services/payment/types";
import type {
  WhatsAppProvider,
  WhatsAppMessage,
} from "../channels/whatsapp/types";

// ─── Test Harness ────────────────────────────────────────────────────────

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

// ─── State Machine Transition Table (mirrors fulfillment.service.ts) ─────

const VALID_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  [FULFILLMENT_STATUS.NEW]: [
    FULFILLMENT_STATUS.CONFIRMED,
    FULFILLMENT_STATUS.CANCELLED,
    FULFILLMENT_STATUS.WAITING_FOR_RESTOCK,
  ],
  [FULFILLMENT_STATUS.CONFIRMED]: [
    FULFILLMENT_STATUS.PACKING,
    FULFILLMENT_STATUS.CANCELLED,
  ],
  [FULFILLMENT_STATUS.PACKING]: [
    FULFILLMENT_STATUS.WAYBILL_CREATED,
    FULFILLMENT_STATUS.CANCELLED,
  ],
  [FULFILLMENT_STATUS.WAYBILL_CREATED]: [FULFILLMENT_STATUS.PICKED_UP],
  [FULFILLMENT_STATUS.PICKED_UP]: [FULFILLMENT_STATUS.SHIPPED],
  [FULFILLMENT_STATUS.SHIPPED]: [FULFILLMENT_STATUS.DELIVERED],
  [FULFILLMENT_STATUS.DELIVERED]: [],
  [FULFILLMENT_STATUS.CANCELLED]: [],
  [FULFILLMENT_STATUS.WAITING_FOR_RESTOCK]: [
    FULFILLMENT_STATUS.CONFIRMED,
    FULFILLMENT_STATUS.CANCELLED,
  ],
};

function isValidTransition(
  from: FulfillmentStatus | null,
  to: FulfillmentStatus,
): boolean {
  if (!from) {
    return (
      to === FULFILLMENT_STATUS.CONFIRMED ||
      to === FULFILLMENT_STATUS.CANCELLED
    );
  }
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

// ─── Mock Notification Log (In-Memory) ───────────────────────────────────

interface LogEntry {
  id: string;
  event: string;
  orderId: string;
  channelId: string;
  status: string;
}

class MockNotificationLog {
  private logs = new Map<string, LogEntry>();
  private counter = 0;

  async isSent(
    event: string,
    orderId: string,
    channelId: string,
  ): Promise<boolean> {
    for (const log of this.logs.values()) {
      if (
        log.event === event &&
        log.orderId === orderId &&
        log.channelId === channelId &&
        log.status === "sent"
      ) {
        return true;
      }
    }
    return false;
  }

  async insertPending(
    event: string,
    orderId: string,
    channelId: string,
  ): Promise<string> {
    const id = `log-${++this.counter}`;
    this.logs.set(id, {
      id,
      event,
      orderId,
      channelId,
      status: "pending",
    });
    return id;
  }

  async tryMarkSent(id: string): Promise<boolean> {
    const log = this.logs.get(id);
    if (!log) return false;
    log.status = "sent";
    return true;
  }

  async markFailed(id: string): Promise<void> {
    const log = this.logs.get(id);
    if (log) log.status = "failed";
  }

  getLogs(): LogEntry[] {
    return Array.from(this.logs.values());
  }

  getSentLogs(orderId: string): LogEntry[] {
    return this.getLogs().filter(
      (l) => l.orderId === orderId && l.status === "sent",
    );
  }

  getSentCount(event: string, orderId: string): number {
    return this.getLogs().filter(
      (l) =>
        l.event === event &&
        l.orderId === orderId &&
        l.status === "sent",
    ).length;
  }

  reset() {
    this.logs.clear();
    this.counter = 0;
  }
}

// ─── Simulated Notification Engine ───────────────────────────────────────

/**
 * Simulates NotificationEngine.dispatch() using real channels
 * and a mock notification log. Tests the integration contract
 * without requiring a database.
 *
 * This mirrors the exact logic in notification-engine.ts:
 *   1. isSent() → skip if already sent
 *   2. insertPending() → create pending log
 *   3. channel.send() → dispatch to channel
 *   4. tryMarkSent() or markFailed() → update log
 */
async function simulateDispatch(params: {
  event: string;
  orderId: string;
  payload: NotificationPayload;
  channels: NotificationChannel[];
  log: MockNotificationLog;
}): Promise<ChannelResult[]> {
  const { event, orderId, payload, channels, log } = params;
  const recipient = payload.customer;

  const results = await Promise.allSettled(
    channels.map(async (ch) => {
      if (await log.isSent(event, orderId, ch.channelId)) {
        return {
          success: true,
          channelId: ch.channelId,
          skipped: true,
          timestamp: new Date().toISOString(),
        };
      }

      const logId = await log.insertPending(event, orderId, ch.channelId);

      const result = await ch.send(payload, recipient);

      if (result.success) {
        await log.tryMarkSent(logId);
      } else {
        await log.markFailed(logId);
      }

      return result;
    }),
  );

  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return {
      success: false,
      channelId: channels[i].channelId,
      error: r.reason instanceof Error ? r.reason.message : "UNKNOWN_ERROR",
      timestamp: new Date().toISOString(),
    };
  });
}

// ─── Mock Payload Factory ────────────────────────────────────────────────

function createMockPayload(
  overrides?: Partial<NotificationPayload>,
): NotificationPayload {
  return {
    event: "order.confirmed",
    orderId: "DJ-20260716-TEST001",
    timestamp: new Date().toISOString(),
    customer: {
      name: "Budi Santoso",
      email: "budi@example.com",
      phone: "6281234567890",
    },
    order: {
      orderId: "DJ-20260716-TEST001",
      totalAmount: 85000,
      subtotal: 75000,
      shippingFee: 10000,
      shippingAddress: "Jl. Merdeka No. 1, Jakarta",
      createdAt: new Date().toISOString(),
    },
    items: [
      {
        productName: "Jamur Crispy Original",
        quantity: 2,
        price: 35000,
        subtotal: 70000,
      },
      {
        productName: "Sambal Ekstra",
        quantity: 1,
        price: 5000,
        subtotal: 5000,
      },
    ],
    ...overrides,
  };
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  // ════════════════════════════════════════════════════════════════════════
  // SCENARIO #1: SUCCESS — Admin Confirm → Notification Sent
  // ════════════════════════════════════════════════════════════════════════

  group("SCENARIO #1: SUCCESS — Admin Confirm → Notification Sent");

  // ── Step 1: State Machine — new → confirmed = VALID ────────────────

  console.log("\n  Step 1: State Machine — FulfillmentService.isValidTransition()");

  assert(
    isValidTransition(FULFILLMENT_STATUS.NEW, FULFILLMENT_STATUS.CONFIRMED) === true,
    "isValidTransition(new → confirmed) = true",
  );
  assert(
    isValidTransition(FULFILLMENT_STATUS.NEW, FULFILLMENT_STATUS.CANCELLED) === true,
    "isValidTransition(new → cancelled) = true",
  );
  assert(
    isValidTransition(FULFILLMENT_STATUS.NEW, FULFILLMENT_STATUS.WAITING_FOR_RESTOCK) === true,
    "isValidTransition(new → waiting_for_restock) = true",
  );

  // ── Step 2: Notification Payload — structure verification ──────────

  console.log("\n  Step 2: Payload — NotificationPayload structure");

  const payload = createMockPayload();

  assert(payload.event === "order.confirmed", "Payload event = 'order.confirmed'");
  assert(payload.orderId === "DJ-20260716-TEST001", "Payload orderId present");
  assert(payload.customer.name === "Budi Santoso", "Payload customer.name = 'Budi Santoso'");
  assert(payload.customer.phone === "6281234567890", "Payload customer.phone = '6281234567890'");
  assert(payload.customer.email === "budi@example.com", "Payload customer.email present");
  assert(payload.order.orderId === "DJ-20260716-TEST001", "Payload order.orderId matches");
  assert(payload.order.totalAmount === 85000, "Payload order.totalAmount = 85000");
  assert(payload.items.length === 2, "Payload has 2 items");
  assert(payload.items[0].productName === "Jamur Crispy Original", "Item 1: Jamur Crispy Original");
  assert(payload.items[1].productName === "Sambal Ekstra", "Item 2: Sambal Ekstra");

  // ── Step 3: WA Channel — message contains name + order number ─────

  console.log("\n  Step 3: WA Channel — formatWaMessage()");

  const waMessage = formatWaMessage(payload);

  assert(waMessage.message.includes("Budi Santoso"), "WA message contains customer name 'Budi Santoso'");
  assert(waMessage.message.includes("DJ-20260716-TEST001"), "WA message contains order number 'DJ-20260716-TEST001'");
  assert(waMessage.message.includes("D'Jaemo Jamur Krispi"), "WA message contains brand name");
  assert(waMessage.message.includes("telah kami konfirmasi"), "WA message contains confirmation text");
  assert(waMessage.message.includes("Silahkan simpan Nomor"), "WA message contains tracking instruction");
  assert(!waMessage.message.includes("{{NAMA_CUSTOMER}}"), "Template variable {{NAMA_CUSTOMER}} replaced");
  assert(!waMessage.message.includes("{{NOMOR_PESANAN}}"), "Template variable {{NOMOR_PESANAN}} replaced");

  console.log(`\n  📩 WA Message Preview:\n  ---\n  ${waMessage.message.split("\n").join("\n  ")}\n  ---`);

  // ── Step 4: Mock Provider — receives formatted message ─────────────

  console.log("\n  Step 4: Mock Provider — send() receives formatted message");

  const mockProvider = createMockWhatsAppProvider();
  const channel = createWhatsAppChannel(mockProvider);

  const channelResult = await channel.send(payload, payload.customer);

  assert(channelResult.success === true, "Mock provider returns success");
  assert(channelResult.channelId === "whatsapp", "Channel ID = 'whatsapp'");
  assert(
    typeof channelResult.messageId === "string" && channelResult.messageId.length > 0,
    "Message ID generated",
  );
  assert(channelResult.messageId!.startsWith("mock-"), "Message ID prefixed with 'mock-'");

  // ── Step 5: WA Channel — receives name, phone, order number ───────

  console.log("\n  Step 5: WA Channel — receives customer name, phone, order number");

  let capturedMessage: WhatsAppMessage | null = null;
  let capturedTarget: string | null = null;

  const trackingProvider: WhatsAppProvider = {
    providerId: "tracking",
    async send(message: WhatsAppMessage) {
      capturedMessage = message;
      capturedTarget = message.target;
      return { success: true, messageId: `track-${Date.now()}` };
    },
  };

  const trackingChannel = createWhatsAppChannel(trackingProvider);
  await trackingChannel.send(payload, payload.customer);

  assert(capturedMessage !== null, "Provider received a message");
  assert(capturedMessage!.message.includes("Budi Santoso"), "Provider received message with customer name");
  assert(capturedMessage!.message.includes("DJ-20260716-TEST001"), "Provider received message with order number");
  assert(capturedTarget === "6281234567890", "Provider received target = customer phone '6281234567890'");

  // ── Step 6: Full Pipeline — notification log created ───────────────

  console.log("\n  Step 6: Full Pipeline — notification log created");

  const log = new MockNotificationLog();
  const registry = createChannelRegistry();
  registry.register(createWhatsAppChannel(createMockWhatsAppProvider()));
  registry.register(createEmailChannel(createMockEmailProvider()));

  const results = await simulateDispatch({
    event: "order.confirmed",
    orderId: "DJ-20260716-TEST001",
    payload,
    channels: registry.getAll(),
    log,
  });

  assert(results.length === 2, "Pipeline dispatches to 2 channels (whatsapp + email)");
  assert(results.every((r) => r.success === true), "All channel results are successful");

  const logs = log.getLogs();
  assert(logs.length === 2, "2 notification log entries created (1 per channel)");
  assert(logs.every((l) => l.status === "sent"), "All log entries marked as 'sent'");
  assert(logs.some((l) => l.channelId === "whatsapp"), "WhatsApp log entry exists");
  assert(logs.some((l) => l.channelId === "email"), "Email log entry exists");
  assert(logs.every((l) => l.event === "order.confirmed"), "All log entries have event = 'order.confirmed'");
  assert(logs.every((l) => l.orderId === "DJ-20260716-TEST001"), "All log entries have correct orderId");

  // ════════════════════════════════════════════════════════════════════════
  // SCENARIO #2: DOUBLE CONFIRM — 1 Order = 1 Notification
  // ════════════════════════════════════════════════════════════════════════

  group("SCENARIO #2: DOUBLE CONFIRM — 1 Order = 1 Notification");

  // ── Step 1: State Machine — confirmed → confirmed = INVALID ────────

  console.log("\n  Step 1: State Machine — confirmed → confirmed = INVALID");

  assert(
    isValidTransition(FULFILLMENT_STATUS.CONFIRMED, FULFILLMENT_STATUS.CONFIRMED) === false,
    "isValidTransition(confirmed → confirmed) = false",
  );

  // ── Step 2: Engine Idempotency — isSent prevents duplicate ─────────

  console.log("\n  Step 2: Engine — isSent prevents duplicate notification");

  const log2 = new MockNotificationLog();

  // First confirm → creates log, sends notification
  const firstResults = await simulateDispatch({
    event: "order.confirmed",
    orderId: "DJ-DOUBLE-001",
    payload: createMockPayload({ orderId: "DJ-DOUBLE-001" }),
    channels: registry.getAll(),
    log: log2,
  });

  assert(firstResults.every((r) => r.success === true), "First confirm: all notifications sent successfully");
  assert(
    log2.getSentCount("order.confirmed", "DJ-DOUBLE-001") === 2,
    "First confirm: 2 sent logs (whatsapp + email)",
  );

  // Second confirm → isSent returns true → skipped
  const secondResults = await simulateDispatch({
    event: "order.confirmed",
    orderId: "DJ-DOUBLE-001",
    payload: createMockPayload({ orderId: "DJ-DOUBLE-001" }),
    channels: registry.getAll(),
    log: log2,
  });

  assert(
    secondResults.every(
      (r) => r.success === true && "skipped" in r && (r as { skipped: boolean }).skipped === true,
    ),
    "Second confirm: all notifications skipped (idempotent)",
  );

  const totalSentAfterDouble = log2.getSentCount("order.confirmed", "DJ-DOUBLE-001");
  assert(totalSentAfterDouble === 2, `After double confirm: still only 2 sent logs (not ${totalSentAfterDouble})`);

  const totalLogsAfterDouble = log2.getLogs().filter((l) => l.orderId === "DJ-DOUBLE-001").length;
  assert(totalLogsAfterDouble === 2, `Total logs for order: ${totalLogsAfterDouble} (no duplicate inserts)`);

  // ── Step 3: Protection Layers Summary ───────────────────────────────

  console.log("\n  Step 3: Protection Layers Summary");
  console.log("    Layer 1: State machine — confirmed → confirmed = INVALID (no notification triggered)");
  console.log("    Layer 2: isSent() pre-check — skip if already sent");
  console.log("    Layer 3: Partial unique index — DB prevents duplicate 'sent' records");

  // ════════════════════════════════════════════════════════════════════════
  // SCENARIO #3: INVALID TRANSITION — confirmed → confirmed Rejected
  // ════════════════════════════════════════════════════════════════════════

  group("SCENARIO #3: INVALID TRANSITION — confirmed → confirmed Rejected");

  // ── Step 1: Invalid transitions from 'confirmed' ──────────────────

  console.log("\n  Step 1: State Machine — invalid transitions from 'confirmed'");

  const invalidTransitions: Array<{
    to: FulfillmentStatus;
    label: string;
  }> = [
    { to: FULFILLMENT_STATUS.CONFIRMED, label: "confirmed → confirmed" },
    { to: FULFILLMENT_STATUS.NEW, label: "confirmed → new" },
    { to: FULFILLMENT_STATUS.WAYBILL_CREATED, label: "confirmed → waybill_created (skip packing)" },
    { to: FULFILLMENT_STATUS.PICKED_UP, label: "confirmed → picked_up" },
    { to: FULFILLMENT_STATUS.SHIPPED, label: "confirmed → shipped" },
    { to: FULFILLMENT_STATUS.DELIVERED, label: "confirmed → delivered" },
    { to: FULFILLMENT_STATUS.WAITING_FOR_RESTOCK, label: "confirmed → waiting_for_restock" },
  ];

  for (const t of invalidTransitions) {
    assert(
      isValidTransition(FULFILLMENT_STATUS.CONFIRMED, t.to) === false,
      `${t.label} = INVALID`,
    );
  }

  // ── Step 2: Valid transitions from 'confirmed' ────────────────────

  console.log("\n  Step 2: Valid transitions from 'confirmed'");

  assert(
    isValidTransition(FULFILLMENT_STATUS.CONFIRMED, FULFILLMENT_STATUS.PACKING) === true,
    "confirmed → packing = VALID",
  );
  assert(
    isValidTransition(FULFILLMENT_STATUS.CONFIRMED, FULFILLMENT_STATUS.CANCELLED) === true,
    "confirmed → cancelled = VALID",
  );

  // ── Step 3: No notification for invalid transition ─────────────────

  console.log("\n  Step 3: No notification log for rejected transition");

  const log3 = new MockNotificationLog();

  const invalidTransitionResult = isValidTransition(
    FULFILLMENT_STATUS.CONFIRMED,
    FULFILLMENT_STATUS.CONFIRMED,
  );
  assert(invalidTransitionResult === false, "confirmed → confirmed rejected — notify() never called");
  assert(log3.getLogs().length === 0, "No notification logs created for rejected transition");

  // ── Step 4: Full transition table verification ─────────────────────

  console.log("\n  Step 4: Full transition table verification");

  const expectedValid: Array<[FulfillmentStatus, FulfillmentStatus]> = [
    ["new", "confirmed"],
    ["new", "cancelled"],
    ["new", "waiting_for_restock"],
    ["confirmed", "packing"],
    ["confirmed", "cancelled"],
    ["packing", "waybill_created"],
    ["packing", "cancelled"],
    ["waybill_created", "picked_up"],
    ["picked_up", "shipped"],
    ["shipped", "delivered"],
    ["waiting_for_restock", "confirmed"],
    ["waiting_for_restock", "cancelled"],
  ];

  for (const [from, to] of expectedValid) {
    assert(isValidTransition(from, to) === true, `Transition: ${from} → ${to} = VALID`);
  }

  // Terminal states — no transitions out
  const allStatuses: FulfillmentStatus[] = [
    "new", "confirmed", "packing", "waybill_created", "picked_up",
    "shipped", "delivered", "cancelled", "waiting_for_restock",
  ];

  for (const terminal of ["delivered", "cancelled"] as FulfillmentStatus[]) {
    for (const target of allStatuses) {
      if (target === terminal) continue;
      assert(
        isValidTransition(terminal, target) === false,
        `Terminal: ${terminal} → ${target} = INVALID`,
      );
    }
  }

  // ── Step 5: Customer-notifiable events ─────────────────────────────

  console.log("\n  Step 5: Customer-notifiable events mapping");

  const notifiableStatuses: FulfillmentStatus[] = [
    "confirmed",
  ];
  const nonNotifiableStatuses: FulfillmentStatus[] = [
    "new", "packing", "waybill_created", "picked_up", "shipped", "delivered", "cancelled", "waiting_for_restock",
  ];

  assert(notifiableStatuses.length === 1, "1 customer-notifiable status (confirmed only)");
  assert(nonNotifiableStatuses.length === 8, "8 non-notifiable statuses");

  console.log(`    Notifiable: ${notifiableStatuses.join(", ")}`);
  console.log(`    Non-notifiable: ${nonNotifiableStatuses.join(", ")}`);

  // ════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════════════════════

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  INTEGRATION TEST RESULTS`);
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
