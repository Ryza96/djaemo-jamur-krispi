# Notification Architecture RFC

**Project:** D'Jaemo Jamur Krispi Ecommerce  
**Sprint:** 12 — PR-2  
**Type:** Architecture RFC  
**Status:** DRAFT  

---

## 1. Problem Statement

### Masalah Bisnis

Setelah checkout, pelanggan tidak pernah mendapatkan konfirmasi dari sistem. Tidak ada notifikasi pembayaran berhasil, tidak ada nomor resi, tidak ada tracking update. Pelanggan hanya bisa mengecek status secara manual dengan menghubungi toko via WhatsApp.

Dampak:

- *Customer anxiety* — "Apakah order saya berhasil?"
- *Operational burden* — Admin harus manually notify setiap pelanggan
- *Trust deficit* — Tanpa notifikasi, pelanggan ragu untuk order lagi
- *Lost tracking* — Pelanggan tidak tahu nomor resi, tidak bisa tracking paket

### Mengapa Domain Baru Diperlukan

Notification memiliki karakteristik yang berbeda dari domain yang ada:

| Aspek | Existing Domain | Notification Domain |
|-------|----------------|-------------------|
| **Primary operation** | Read/Write business data | Send external messages |
| **Reliability requirement** | Transactional (ACID) | Best-effort with retry |
| **Failure impact** | Data inconsistency | Missed customer communication |
| **External dependency** | Midtrans, Biteship | Email provider, WA API |
| **Timing** | Synchronous / user-facing | Asynchronous / background |

Notification Domain membutuhkan *fire-and-forget architecture* yang tidak boleh memblokir transaksi bisnis utama.

---

## 2. Goals

| # | Goal | Keterangan |
|---|------|-----------|
| G1 | **Customer selalu mengetahui status order** | Setiap perubahan status yang signifikan menghasilkan notifikasi. |
| G2 | **Notification tidak mengubah business transaction** | Domain lain tidak terpengaruh oleh sukses/gagalnya notifikasi. |
| G3 | **Multi-channel ready** | Arquitecture mendukung Email, WhatsApp, dan channel lain tanpa perubahan domain. |
| G4 | **Pluggable channel** | Menambah channel baru cukup implementasi interface. |
| G5 | **Event-driven** | Notification Engine bereaksi terhadap event, bukan dipanggil langsung. |
| G6 | **Idempotent** | Event duplikat tidak menghasilkan notifikasi ganda. |
| G7 | **Observable** | Gagal kirim tercatat, sukses kirim tercatat. |

---

## 3. Non-Goals

| # | Non-Goal | Alasan |
|---|----------|--------|
| NG1 | **Marketing / Promo Broadcast** | Notification domain hanya untuk *transactional notification*. Marketing akan menjadi domain terpisah. |
| NG2 | **Bulk Email Campaign** | Tidak termasuk. Domain ini untuk 1:1 customer communication. |
| NG3 | **Push Notification** | Belum ada mobile app. Tidak relevan saat ini. |
| NG4 | **SMS Gateway** | Biaya tinggi, WhatsApp dan Email mencukupi. |
| NG5 | **In-app Notification / WebSocket** | Belum ada real-time requirement. Notification via WA/Email cukup. |
| NG6 | **Unsubscribe / Opt-out Management** | Tidak perlu untuk transactional notification. Akan relevan jika marketing domain dibuat. |
| NG7 | **Newsletter** | Bukan bagian dari notification domain. |

---

## 4. Architecture

### 4.1 High-Level Architecture

```
┌─────────────┐    ┌──────────────────────┐    ┌───────────────────┐
│  Publisher   │    │   Notification Engine │    │ Channel Dispatcher│
│  (Domain)    │───►│                      │───►│                   │
└─────────────┘    │ ┌──────────────────┐  │    │ ┌───────────────┐ │
                    │ │   Event Handler  │  │    │ │ Email Channel │─► SMTP / API
                    │ │ (per event type) │  │    │ └───────────────┘ │
                    │ └──────────────────┘  │    │ ┌───────────────┐ │
                    │ ┌──────────────────┐  │    │ │ WA Channel    │─► WhatsApp API
                    │ │  Payload Builder │  │    │ │ (future)      │ │
                    │ └──────────────────┘  │    │ └───────────────┘ │
                    │ ┌──────────────────┐  │    │ ┌───────────────┐ │
                    │ │  Log / Status    │  │    │ │ Push Channel  │─► (future)
                    │ └──────────────────┘  │    │ │ (future)      │ │
                    └──────────────────────┘    │ └───────────────┘ │
                                                 └───────────────────┘
```

### 4.2 Layer Description

| Layer | Tanggung Jawab |
|-------|---------------|
| **Publisher** | Domain services yang memproduksi event. Tidak memanggil notification secara langsung. |
| **Notification Engine** | Menerima event, membangun payload, menentukan channel, mengirim ke dispatcher. |
| **Channel Dispatcher** | Routing payload ke channel yang sesuai. Format-specific formatting di sini. |
| **Email Channel** | Implementasi pengiriman email via SMTP / Email API. |
| **WhatsApp Channel** | Implementasi pengiriman WA via API (future). |

### 4.3 Decoupling Pattern

Publisher tidak pernah memanggil Notification Engine secara langsung dengan `await`.  
Sebaliknya, Notification Engine mengekspos method `fire-and-forget`:

```
Publisher                               Notification Engine
    │                                           │
    │  engine.notify(event, orderId)            │
    │──► (async, non-blocking) ───────────────►│
    │                                           │──► Build Payload
    │                                           │──► Dispatch to Channel
    │  return immediately                       │──► Log Result
    │◄──────────────────────────────────────────│
    │                                           │
    │  (transaction continues)                  │  (channel sends async)
```

### 4.4 Queue Strategy (Future)

Untuk production, notifikasi yang gagal akan dimasukkan ke antrian:

```
Publisher → Notification Engine → Queue (pgmq) → Worker → Channel
```

Queue memberikan:
- Retry otomatis
- Back-pressure handling
- Recovery after outage

Untuk MVP, queue tidak diperlukan. Cukup fire-and-forget dengan immediate retry (1-2 kali).

---

## 5. Publisher

### 5.1 Publisher Map

| Publisher Domain | Service | Event | Integration Point |
|-----------------|---------|-------|------------------|
| **Payment** | `OrderService.processCallback()` | `STATUS_CHANGED` (→ PAID) | Setelah `updatePaymentByOrderId()` berhasil |
| **Payment** | `OrderService.processCallback()` | `STATUS_CHANGED` (→ FAILED) | Setelah update payment status |
| **Payment** | `OrderService.processCallback()` | `STATUS_CHANGED` (→ EXPIRED) | Setelah update payment status |
| **Fulfillment** | `FulfillmentService.executeTransition()` | `ORDER_CONFIRMED` | Setelah `updateFulfillmentStatus()` berhasil |
| **Fulfillment** | `FulfillmentService.executeTransition()` | `ORDER_WAYBILL_CREATED` | Setelah `updateFulfillmentStatus()` berhasil |
| **Fulfillment** | `FulfillmentService.executeTransition()` | `ORDER_SHIPPED` | Setelah `updateFulfillmentStatus()` berhasil |
| **Fulfillment** | `FulfillmentService.executeTransition()` | `ORDER_COMPLETED` | Setelah `updateFulfillmentStatus()` berhasil |
| **Fulfillment** | `FulfillmentService.executeTransition()` | `ORDER_CANCELLED` | Setelah `updateFulfillmentStatus()` berhasil |

### 5.2 Publisher Contract

Setiap publisher memanggil:

```typescript
NotificationEngine.notify({
  event: "order.confirmed",
  orderId: "DJ-20260708-ABCD1234",
  timestamp: "2026-07-08T10:30:00Z",
})
```

Publisher tidak perlu:
- Menyusun payload
- Menentukan channel
- Menangani kegagalan
- Mengetahui format notifikasi

### 5.3 Non-Publisher Events

Event berikut **tidak memicu notifikasi** dan tidak perlu diintegrasikan:

| Event | Alasan |
|-------|--------|
| `ORDER_CREATED` | Terlalu awal, customer masih di checkout |
| `SNAP_CREATED` | Customer sedang di redirect Midtrans |
| `SNAP_RETRY` | Technical internal |
| `CALLBACK_*` (INVALID, SKIPPED) | Security / internal |
| `ROLLBACK` | Internal recovery |
| `ORDER_PACKING` | Terlalu granular |
| `ORDER_PICKED_UP` | Tercakup oleh `ORDER_WAYBILL_CREATED` |
| `SHIPMENT_*` | Tercakup oleh fulfillment-level events |
| `NOTES_UPDATED` | Admin internal |

---

## 6. Subscriber

### 6.1 Who Subscribes

Notification Engine adalah **single subscriber** untuk semua event notifikasi.

Tidak ada subscriber lain untuk event ini — event notifikasi tidak dikonsumsi oleh domain lain.

### 6.2 Subscription Pattern

Notification Engine tidak menggunakan pub/sub infrastructure.  
Sebaliknya, Notification Engine adalah **service yang dipanggil secara eksplisit** oleh publisher.

```
// Di dalam FulfillmentService.executeTransition(), setelah sukses:
await OrderRepository.updateFulfillmentStatus(...)
await AuditLogService.logFulfillmentEvent(...)

// Fire notification — non-blocking, jangan await:
NotificationEngine.notify({
  event: "order.confirmed",  // langsung gunakan enum dari AuditLogService.events
  orderId,
  timestamp: new Date().toISOString(),
})
```

### 6.3 Mengapa Bukan Pub/Sub?

| Alasan | Detail |
|--------|--------|
| **Kesederhanaan** | Project belum memiliki message broker. Pub/Sub menambah infrastruktur. |
| **Sync call non-blocking** | Cukup panggil `.notify()` tanpa `await` untuk fire-and-forget. |
| **Serverless compatible** | Tidak perlu long-running subscriber. |
| **Gradual evolution** | Jika nanti butuh queue, tambahkan di dalam Notification Engine tanpa mengubah publisher. |

---

## 7. Notification Lifecycle

### 7.1 Lifecycle Diagram

```
  Event diterima dari Publisher
         │
         ▼
  ┌────────────────┐
  │   Validate     │── Invalid → log & discard
  │   Event        │
  └───────┬────────┘
          │ valid
          ▼
  ┌────────────────┐
  │   Check        │── Already sent → log & skip (idempotent)
  │   Idempotency  │
  └───────┬────────┘
          │ new
          ▼
  ┌────────────────┐
  │  Build Payload │── Ambil data dari OrderRepository
  └───────┬────────┘
          │
          ▼
  ┌────────────────┐
  │  Format by     │── Pilih channel (WA/Email berdasarkan preferensi)
  │  Channel       │
  └───────┬────────┘
          │
          ▼
  ┌────────────────┐     ┌──────────────┐
  │    Dispatch    │────►│ Channel Send  │── Success → log sent
  │    (async)     │     └──────┬───────┘
  └────────────────┘            │
                          Failure (retry?)
                               │
                          Retry exhausted?
                               │
                               ▼
                         ┌──────────────┐
                         │  Log Failure  │
                         │  + Continue   │
                         └──────────────┘
```

### 7.2 Stages Detail

| Stage | Deskripsi | Error Handling |
|-------|-----------|---------------|
| **Validate** | Pastikan event dikenali, orderId valid. | Discard + log jika invalid. |
| **Idempotency** | Cek apakah notifikasi untuk event+orderId sudah pernah dikirim. | Skip jika sudah. |
| **Build Payload** | Fetch `OrderDetailRow`, build structured payload. | Jika order tidak ditemukan, log + discard. |
| **Format by Channel** | Transform structured payload ke format channel (HTML email, WA template). | Channel-specific error → fallback channel? |
| **Dispatch** | Kirim ke channel(s). Async, tidak blocking. | Retry 1-2 kali, lalu log failure. |
| **Log** | Catat hasil (sent, failed, skipped) ke notification log. | Jika log gagal, notifikasi tetap dianggap terkirim. |

### 7.3 Timing

| Fase | Waktu | Sinkron? |
|------|-------|----------|
| Validate + Idempotency | < 5ms | ✅ Sync (fire-and-forget) |
| Build Payload (DB read) | < 50ms | ✅ Sync (fire-and-forget) |
| Channel Dispatch (API call) | 200ms - 5s | ❌ Async (internal promise) |
| Total blocking time | < 55ms | ✅ Aman untuk business transaction |

---

## 8. Channel Strategy

### 8.1 Architecture

```
                       ┌─────────────────────┐
                       │  NotificationPayload │
                       │  (structured data)   │
                       └──────────┬──────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
           ┌────────────┐ ┌────────────┐ ┌────────────┐
           │EmailChannel│ │WA Channel  │ │Push Channel│
           │            │ │(future)    │ │(future)    │
           └────────────┘ └────────────┘ └────────────┘
```

### 8.2 Channel Interface

Setiap channel mengimplementasikan interface yang sama:

```typescript
interface NotificationChannel {
  channelId: "email" | "whatsapp" | "push";
  send(payload: NotificationPayload, recipient: RecipientInfo): Promise<ChannelResult>;
}
```

Dengan `ChannelResult`:

```typescript
interface ChannelResult {
  success: boolean;
  channelId: string;
  messageId?: string;     // ID dari provider (e.g. SendGrid message ID)
  error?: string;
  timestamp: string;
}
```

### 8.3 Channel Selection Logic

```
NotificationEngine.notify(event, orderId) {
  1. Build NotificationPayload
  2. Determine channel priority:
     - If customer has WA number → WA (if available)
     - If customer has email → Email
     - If both → try both
  3. For each channel → call channel.send(payload, recipient)
}
```

### 8.4 Adding New Channel

Untuk menambah channel baru:

1. Buat class implement `NotificationChannel`
2. Daftarkan di channel registry
3. Selesai — tidak ada perubahan di Notification Engine

---

## 9. Payload Strategy

### 9.1 Single Payload for All Channels

Semua channel menerima `NotificationPayload` yang sama.  
Masing-masing channel melakukan formatting sesuai medium.

```typescript
interface NotificationPayload {
  // Event info
  event: string;                  // "order.confirmed", "payment.success"
  orderId: string;
  timestamp: string;

  // Customer
  customer: {
    name: string;
    email: string | null;
    phone: string | null;
  };

  // Order
  order: {
    orderId: string;
    totalAmount: number;
    subtotal: number;
    shippingFee: number;
    createdAt: string;
    shippingAddress: string;
  };

  // Items
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;

  // Optional — tergantung event
  payment?: {
    method: string | null;
    transactionId: string | null;
    paidAt: string | null;
  };
  shipment?: {
    waybillId: string | null;
    courier: string | null;
    courierType: string | null;
    trackingUrl: string | null;
  };
  cancellation?: {
    reason: string | null;
  };
}
```

### 9.2 Payload Builder

Setiap event type memiliki payload builder sendiri:

| Event | Builder Logic |
|-------|--------------|
| `payment.success` | `BasePayload` + `payment.method`, `payment.transactionId`, `payment.paidAt` |
| `payment.failed` | `BasePayload` (no extras) |
| `payment.expired` | `BasePayload` (no extras) |
| `order.confirmed` | `BasePayload` + items list |
| `order.waybill_created` | `BasePayload` + `shipment.waybillId`, `shipment.courier` |
| `order.shipped` | `BasePayload` + `shipment.waybillId`, `shipment.courier`, `shipment.trackingUrl` |
| `order.completed` | `BasePayload` (no extras) |
| `order.cancelled` | `BasePayload` + `cancellation.reason` |

### 9.3 Format Separation

Channel bertanggung jawab untuk:

| Channel | Format |
|---------|--------|
| **Email** | HTML template + plain text fallback |
| **WhatsApp** | Template string dengan placeholder (sesuai aturan WhatsApp Business API) |
| **Push** | Title + body string (future) |

Format logic ada di channel, bukan di engine.

---

## 10. Architecture Decisions

### AD-009 — Notification Must Never Block Business Transaction

**Status:** ACCEPTED

**Keputusan:**
Notification Engine beroperasi secara *fire-and-forget* dari perspektif publisher. Publisher tidak pernah `await` hasil pengiriman notifikasi.

**Konsekuensi:**
- Publisher (Payment, Fulfillment, Shipment, Admin) tetap responsif.
- Gagal kirim notifikasi tidak memengaruhi status order, payment, atau fulfillment.
- Notification Engine bertanggung jawab atas retry dan logging sendiri.
- Jika ada kebutuhan notifikasi guaranteed delivery, queue tambahan diperlukan di masa depan.

**Serverless Runtime Constraint:**

Pada runtime serverless (Next.js/Vercel), fire-and-forget memiliki keterbatasan:
- Proses serverless dapat dihentikan segera setelah response dikirim ke client.
- Background task (Promise tanpa `await`) mungkin tidak sempat dieksekusi sebelum runtime di-terminate.
- Jika proses dihentikan sebelum channel dispatch selesai, notifikasi akan hilang.

**Mitigasi untuk MVP:**
- Tahap sinkron (Validate + Idempotency + Build Payload) tetap dijalankan dalam event loop.
- Tahap async (Channel Dispatch) dipisah dengan Promise — namun tetap berisiko di serverless.
- Untuk MVP, risiko ini diterima. Notifikasi yang hilang karena serverless termination dianggap sebagai *best-effort delivery*.

**Evolusi ke Production:**
- Untuk guaranteed delivery, Notification Engine dapat berevolusi menjadi queue-based worker tanpa mengubah kontrak dengan publisher.
- Queue (pgmq, Redis BullMQ, atau SQS) menyediakan retry mekanik, persistence, dan isolation dari runtime serverless.
- Publisher tetap tidak mengetahui perubahan ini — kontrak `notify(event, orderId)` tetap sama.

---

### AD-010 — Pluggable Channel via Interface

**Status:** ACCEPTED

**Keputusan:**
Channel notifikasi diakses melalui interface `NotificationChannel`. Engine tidak mengetahui implementasi spesifik channel.

**Konsekuensi:**
- Menambah channel (Email, WhatsApp, Push, SMS) cukup dengan implementasi interface baru.
- Channel dapat diubah, diganti, atau ditambahkan tanpa perubahan di Notification Engine.
- Testing lebih mudah karena channel bisa di-mock.

---

### AD-011 — Single Structured Payload

**Status:** ACCEPTED

**Keputusan:**
Semua channel menerima `NotificationPayload` yang sama dalam format terstruktur. Formatting untuk medium spesifik dilakukan di channel masing-masing.

**Konsekuensi:**
- Template tidak perlu di-copy untuk setiap channel.
- Data konsisten antar channel (e.g., format rupiah, format tanggal).
- Channel baru langsung bisa menggunakan payload yang sudah ada.
- Payload bisa disimpan di log untuk audit.

---

### AD-012 — Notification Engine MUST Guarantee Idempotency

**Status:** ACCEPTED

**Business Decision:**
Notification Engine menjamin bahwa event duplikat tidak menghasilkan pengiriman notifikasi ganda untuk channel yang sama.

**Mengapa:**
- Payment callback Midtrans dapat dikirim lebih dari satu kali untuk event yang sama.
- Fulfillment transition (admin action) dapat dipicu ulang.
- Kesalahan jaringan dapat menyebabkan retry dari publisher.

**Konsekuensi:**
- Payment callback duplikat tidak double-notify.
- Retry manual dari admin tidak double-notify.
- Event yang sama dikirim 2x oleh publisher tetap menghasilkan 1 notifikasi per channel.

**Implementation Decision (tidak mengikat):**
Idempotency key adalah `(event + orderId + channelId)`. Beberapa alternatif media penyimpanan:

| Media | Kelebihan | Kekurangan |
|-------|-----------|------------|
| Database (tabel terpisah) | Persistent, queryable, audit trail | Tambahan write per notifikasi |
| Cache (Redis / in-memory) | Latency rendah | Tidak persistent, data hilang saat restart |
| Queue metadata | Melekat pada job | Hanya berguna jika queue sudah ada |

Pemilihan media penyimpanan adalah *implementation detail* dan tidak memengaruhi kontrak arsitektur.

---

### AD-013 — Publisher Owns Event Timing

**Status:** ACCEPTED

**Keputusan:**
Publisher adalah satu-satunya pihak yang menentukan kapan event bisnis terjadi. Notification Engine tidak boleh melakukan polling database, mengecek status order, atau mencari perubahan sendiri.

**Konsekuensi:**
- Payment tetap menjadi pemilik Payment Event — Notification Engine tidak boleh membaca tabel orders untuk mencari payment baru.
- Fulfillment tetap menjadi pemilik Fulfillment Event — Notification Engine tidak boleh membaca tabel orders untuk mencari status fulfillment baru.
- Shipment tetap menjadi pemilik Shipment Event — Notification Engine tidak boleh membaca tabel shipments untuk mencari perubahan.
- Notification Engine hanya bertindak sebagai *subscriber* — menunggu event dari publisher, tidak menjemput sendiri.

**Implementasi:**
Setiap domain yang sudah ada (Payment, Fulfillment, Shipment) menyisipkan satu baris kode setelah transaksi selesai:

```
// Owner domain menentukan event timing:
updateStatus()          // business transaction
auditLog()              // audit trail
notificationEngine.notify(event, orderId)  // fire notification
```

Tidak ada scheduler, cron job, atau polling loop di Notification Engine.

---

## 11. Failure Strategy

### 11.1 Failure Classification

| Failure Type | Contoh | Dampak ke Publisher |
|-------------|--------|-------------------|
| **Payload build failure** | Order tidak ditemukan di DB | Log + discard. Publisher tidak terpengaruh. |
| **Channel send failure** | Email API timeout | Retry 2x, jika gagal → log failure. Publisher tidak terpengaruh. |
| **Channel unavailable** | SMTP server down | Log failure. No retry (akan gagal lagi). Publisher tidak terpengaruh. |
| **Invalid recipient** | Email format salah | Log failure + discard (retry tidak akan membantu). |

### 11.2 Retry Policy

| Skenario | Retry | Interval | After Retry |
|----------|-------|----------|-------------|
| Email API timeout | 2x | 1s, 3s | Log failure, discard |
| Email API 5xx | 2x | 1s, 3s | Log failure, discard |
| Email API 4xx (bad request) | 0 | — | Log failure, discard (will never succeed) |
| WhatsApp API timeout | 2x | 1s, 3s | Log failure, discard (future) |
| Invalid phone/email | 0 | — | Log failure, discard |

### 11.3 What DOES NOT Happen

| Tidak Akan Terjadi | Alasan |
|--------------------|--------|
| ❌ Publisher menerima error | Notification engine menangkap semua error internal |
| ❌ Business transaction rollback | Tidak ada hubungan antara notifikasi dan transaksi |
| ❌ Order status berubah | Notification Engine read-only |
| ❌ Data inconsistency | Notification Engine tidak menulis ke domain lain |
| ❌ Infinite retry | Maksimal 2 retry, lalu discard |

### 11.4 What DOES Happen

| Akan Terjadi | Untuk |
|-------------|-------|
| ✅ Log success notification | Audit trail |
| ✅ Log failed notification | Monitoring |
| ✅ Discard after retry exhausted | Mencegah blocking |

---

## 12. Sequence Diagram

### 12.1 Payment Success

```
Customer              Midtrans           OrderService          NotificationEngine       EmailChannel
   │                     │                    │                       │                    │
   │  (payment)          │                    │                       │                    │
   │────────────────────►│                    │                       │                    │
   │                     │  callback POST     │                       │                    │
   │                     │───────────────────►│                       │                    │
   │                     │                    │                       │                    │
   │                     │              ┌─────┴─────┐                 │                    │
   │                     │              │ Validate   │                 │                    │
   │                     │              │ Signature  │                 │                    │
   │                     │              │ Amount     │                 │                    │
   │                     │              │ Transition │                 │                    │
   │                     │              └─────┬─────┘                 │                    │
   │                     │                    │                       │                    │
   │                     │         ┌──────────▼──────────┐            │                    │
   │                     │         │ updatePaymentByOrder │            │                    │
   │                     │         │   (status → PAID)    │            │                    │
   │                     │         └──────────┬──────────┘            │                    │
   │                     │                    │                       │                    │
   │                     │         ┌──────────▼──────────┐            │                    │
   │                     │         │ Auto-cancel jika     │            │                    │
   │                     │         │ FAILED/EXPIRED      │            │                    │
   │                     │         └──────────┬──────────┘            │                    │
   │                     │                    │                       │                    │
   │                     │         ┌──────────▼──────────┐            │                    │
   │                     │         │ AuditLogService     │            │                    │
   │                     │         │ (STATUS_CHANGED)    │            │                    │
   │                     │         └──────────┬──────────┘            │                    │
   │                     │                    │                       │                    │
   │                     │                    │  notify("payment.success", orderId)          │
   │                     │                    │──────────────────────►│                    │
   │                     │                    │  (fire-and-forget)    │                    │
   │                     │                    │                       │                    │
   │                     │              (transaction continues)       │                    │
   │                     │                    │                       │                    │
   │                     │                    │                       │ fetchOrderDetail() │
   │                     │                    │                       │──────────────────►│
   │                     │                    │                       │   (async)         │
   │                     │                    │                       │◄──────────────────│
   │                     │                    │                       │                    │
   │                     │                    │                       │ Build Payload     │
   │                     │                    │                       │                    │
   │                     │                    │                       │ send(payload)     │
   │                     │                    │                       │──────────────────►│
   │                     │                    │                       │                    │
   │                     │                    │                       │              Send Email
   │                     │                    │                       │              "Pembayaran
   │                     │                    │                       │               Berhasil"
   │                     │                    │                       │                    │
   │                     │                    │                       │◄──────────────────│
   │                     │                    │                       │  { success: true } │
   │                     │                    │                       │                    │
   │                     │                    │                       │ Log notification  │
   │                     │                    │                       │                    │
```

### 12.2 Admin Confirm

```
Admin               ActionsRoute         FulfillmentService      InventoryService    NotificationEngine
 │                      │                       │                     │                    │
 │  POST confirm        │                       │                     │                    │
 │─────────────────────►│                       │                     │                    │
 │                      │  process(orderId)     │                     │                    │
 │                      │──────────────────────►│                     │                    │
 │                      │                       │                     │                    │
 │                      │              ┌────────▼────────┐            │                    │
 │                      │              │ ValidateTransition│           │                    │
 │                      │              └────────┬────────┘            │                    │
 │                      │                       │                     │                    │
 │                      │              ┌────────▼────────┐            │                    │
 │                      │              │ deductOrderStock│            │                    │
 │                      │              │────────────────►│            │                    │
 │                      │              │◄────────────────│            │                    │
 │                      │              └────────┬────────┘            │                    │
 │                      │                       │                     │                    │
 │                      │              ┌────────▼────────┐            │                    │
 │                      │              │ updateFulfillment│           │                    │
 │                      │              │ (status: confirmed)│         │                    │
 │                      │              └────────┬────────┘            │                    │
 │                      │                       │                     │                    │
 │                      │              ┌────────▼────────┐            │                    │
 │                      │              │ AuditLogService  │            │                    │
 │                      │              │ (ORDER_CONFIRMED)│            │                    │
 │                      │              └────────┬────────┘            │                    │
 │                      │                       │                     │                    │
 │                      │                       │ notify("order.confirmed", orderId)        │
 │                      │                       │──────────────────────────────────────────►│
 │                      │                       │  (fire-and-forget)                        │
 │                      │                       │                     │                    │
 │                      │              return { success: true }                             │
 │                      │◄──────────────────────│                     │                    │
 │                      │                       │                     │                    │
 │  Response            │                       │                     │                    │
 │◄─────────────────────│                       │                     │                    │
 │                      │                       │                     │                    │
 │                      │                       │                     │          (async)    │
 │                      │                       │                     │          send email │
 │                      │                       │                     │          "Pesanan   │
 │                      │                       │                     │          Dikonfirmasi"│
```

### 12.3 Shipment Flow (Waybill → Shipped → Delivered)

```
Biteship           Webhook           ShipmentService    FulfillmentService     NotificationEngine
   │                  │                    │                    │                    │
   │  (picking_up)    │                    │                    │                    │
   │─────────────────►│  handleWebhook()  │                    │                    │
   │                  │──────────────────►│                    │                    │
   │                  │                    │ markAsPickedUp()  │                    │
   │                  │                    │──────────────────►│                    │
   │                  │                    │                    │ (transition)      │
   │                  │                    │                    │ notify("order.    │
   │                  │                    │                    │  waybill_created")│
   │                  │                    │                    │──────────────────►│
   │                  │                    │                    │  (fire-and-forget)│
   │                  │                    │                    │                    │
   │  (dropping_off)  │                    │                    │                    │
   │─────────────────►│  handleWebhook()  │                    │                    │
   │                  │──────────────────►│ ship()             │                    │
   │                  │                    │──────────────────►│                    │
   │                  │                    │                    │ (transition)      │
   │                  │                    │                    │ notify("order.    │
   │                  │                    │                    │  shipped")        │
   │                  │                    │                    │──────────────────►│
   │                  │                    │                    │  (fire-and-forget)│
   │                  │                    │                    │                    │
   │  (delivered)     │                    │                    │                    │
   │─────────────────►│  handleWebhook()  │                    │                    │
   │                  │──────────────────►│ complete()         │                    │
   │                  │                    │──────────────────►│                    │
   │                  │                    │                    │ (transition)      │
   │                  │                    │                    │ notify("order.    │
   │                  │                    │                    │  completed")      │
   │                  │                    │                    │──────────────────►│
   │                  │                    │                    │  (fire-and-forget)│
```

---

## 13. Dependency

### 13.1 What Notification Domain Depends On

| Dependency | Type | Digunakan Untuk |
|-----------|------|----------------|
| `OrderRepository.findDetailByOrderId()` | Internal | Membangun payload (order, items, customer data) |
| `AuditLogService.log*` | Internal | Mencatat notification sent/failed ke audit log |
| `Supabase` (via repository) | Internal | Menyimpan notification log |
| Email API (SendGrid / Resend / SMTP) | **External** | Mengirim email |
| WhatsApp API (Fonnte / WABox / Twilio) | **External** | Mengirim WA (future) |

### 13.2 What Notification Domain Does NOT Access

| Domain | Tidak Boleh Diakses | Alasan |
|--------|-------------------|--------|
| `InventoryService` | ❌ Tidak boleh | Inventory adalah domain terpisah. Tidak ada notifikasi inventory ke customer. |
| `InventoryRepository` | ❌ Tidak boleh | Alasan sama. |
| `PaymentRepository` | ❌ Tidak boleh | Gunakan `OrderRepository` yang sudah mencakup data payment. |
| `FulfillmentService` | ❌ Tidak boleh | Notification tidak boleh mengubah status fulfillment. |
| `ShipmentService` | ❌ Tidak boleh | Notification tidak boleh membuat shipment. |
| `OrderService` | ❌ Tidak boleh | Notification tidak boleh mengubah order. |

### 13.3 Dependency Rule

Notification Engine **hanya membaca data** dari `OrderRepository.findDetailByOrderId()`.

Tidak ada write ke domain lain.

---

## 14. Open Questions

### 14.1 Infrastructure

| # | Question | Options | Recommendation |
|---|----------|---------|---------------|
| Q1 | **Email provider?** | Resend, SendGrid, SES, SMTP | Resend (free tier 100/day, simple API) untuk MVP |
| Q2 | **WA provider?** | Fonnte, WABox, Twilio, WA Business API | Ditunda ke sprint berikutnya |
| Q3 | **Queue untuk retry?** | pgmq (Supabase), Redis BullMQ, in-process | In-process retry untuk MVP. pgmq jika reliability needed. |

### 14.2 Idempotency

| # | Question | Options |
|---|----------|---------|
| Q4 | **Storage untuk idempotency key?** | Tabel `notification_logs` di Supabase, atau field di audit log | Tabel terpisah lebih aman |
| Q5 | **Tabel notification_logs schema?** | Perlu dirancang di implementasi | — |

### 14.3 Configuration

| # | Question | Notes |
|---|----------|-------|
| Q6 | **Sender name/email?** | "D'Jaemo Jamur Krispi" <noreply@...> — perlu domain email |
| Q7 | **Toko name untuk WA?** | "D'Jaemo Jamur Krispi" — perlu nomor WA business |
| Q8 | **Logo toko untuk email?** | Perlu URL logo yang bisa di-include di template HTML |

### 14.4 Business Rules

| # | Question | Notes |
|---|----------|-------|
| Q9 | **Apakah perlu kirim ke semua channel?** | Jika customer punya WA dan Email, kirim ke keduanya? Atau prioritaskan satu? |
| Q10 | **Apakah order tanpa customer_email tetap dikirimi WA?** | Jika hanya punya nomor WA, kirim WA. Tapi WA channel belum ada. |
| Q11 | **Format rupiah?** | "Rp150.000" — perlu utility formatting yang konsisten. |

---

## Appendices

### A. Event → Channel Matrix

| Event | Email | WhatsApp | Keterangan |
|-------|-------|----------|-----------|
| `payment.success` | ✅ | 🔜 | Konfirmasi pembayaran berhasil |
| `payment.failed` | ✅ | 🔜 | Pembayaran gagal |
| `payment.expired` | ✅ | 🔜 | Pembayaran kadaluarsa |
| `order.confirmed` | ✅ | 🔜 | Pesanan dikonfirmasi |
| `order.waybill_created` | ✅ | 🔜 | Resi terbit |
| `order.shipped` | ✅ | 🔜 | Dalam perjalanan |
| `order.completed` | ✅ | 🔜 | Pesanan selesai |
| `order.cancelled` | ✅ | 🔜 | Pesanan dibatalkan |

✅ = MVP (Sprint 12)  
🔜 = Future sprint

### B. File Structure (Referensi Implementasi)

```
lib/
  notifications/
    notification-engine.ts      # Entry point, event handler
    payload-builder.ts          # Build NotificationPayload dari OrderDetailRow
    types.ts                    # Shared interfaces
    channels/
      email.channel.ts          # EmailChannel implements NotificationChannel
      whatsapp.channel.ts       # (future)
    templates/
      email/
        payment-success.html
        order-confirmed.html
        waybill-created.html
        order-shipped.html
        order-completed.html
        order-cancelled.html
        payment-failed.html
        payment-expired.html
```

### C. AD Index

| AD | Title | Sprint | Status |
|----|-------|--------|--------|
| AD-007 | Inventory Rollback Boundary | 11 | ACCEPTED |
| AD-009 | Notification Must Never Block Business Transaction | 12 | ACCEPTED (this RFC) |
| AD-010 | Pluggable Channel via Interface | 12 | ACCEPTED (this RFC) |
| AD-011 | Single Structured Payload | 12 | ACCEPTED (this RFC) |
| AD-012 | Notification Engine MUST Guarantee Idempotency | 12 | ACCEPTED (this RFC) |
| AD-013 | Publisher Owns Event Timing | 12 | ACCEPTED (this RFC) |

---

**Document Version:** 1.1  
**Sprint:** 12 — PR-2R1  
**Status:** APPROVED — Ready for Implementation
