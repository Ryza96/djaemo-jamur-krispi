# Backend Integration Setup Guide

## Overview
Backend ini mengintegrasikan:
- **Supabase (PostgreSQL)** untuk database
- **Midtrans** untuk payment gateway (Sandbox Mode)
- **Flat Rate Shipping** untuk biaya pengiriman tetap
- Complete API routes untuk order management

---

## 1. Setup Supabase Database

### Step 1: Buat Akun Supabase
1. Kunjungi https://supabase.com
2. Sign up dengan email Anda
3. Buat project baru

### Step 2: Setup Database
1. Di Supabase dashboard, buka **SQL Editor**
2. Buat query baru dan copy-paste konten dari `database/schema.sql`
3. Jalankan query untuk membuat tables

### Step 3: Dapatkan Credentials
1. Buka **Settings → API**
2. Copy nilai berikut ke `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` → Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` → service_role key

---

## 2. Setup Midtrans (Sandbox Mode)

### Step 1: Daftar di Midtrans
1. Kunjungi https://dashboard.midtrans.com/register
2. Daftar akun baru
3. Verifikasi email

### Step 2: Dapatkan API Keys
1. Login ke Midtrans Dashboard
2. Buka **Settings → Access Keys**
3. Di tab **Sandbox**, copy:
   - `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` → Client Key (Sandbox)
   - `MIDTRANS_SERVER_KEY` → Server Key (Sandbox)

### Step 3: Setup Callback URL
1. Di Midtrans Dashboard, buka **Settings → Configuration**
2. Finish Redirect URLs:
   - `http://localhost:3000/checkout/success`
3. Unfinish Redirect URLs:
   - `http://localhost:3000/checkout`

---

## 3. Setup Environment Variables

1. Copy `.env.local.example` ke `.env.local`
2. Isi semua values yang diperlukan:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Midtrans (Sandbox)
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your-client-key
MIDTRANS_SERVER_KEY=your-server-key

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Shipping (Flat Rate)
SHIPPING_RATE_JAKARTA=15000
SHIPPING_RATE_BANDUNG=17000
SHIPPING_RATE_SURABAYA=19000
SHIPPING_RATE_LUAR_JAWA=25000
```

---

## 4. Install Dependencies

```bash
npm install
```

Packages yang ditambahkan:
- `@supabase/supabase-js` - Supabase client
- `midtrans-client` - Midtrans SDK

---

## 5. API Endpoints

### Shipping Cost
```
POST /api/shipping
Body: {
  "address": "Jl. Sudirman, Jakarta",
  "service": "Reguler|Express|Economy"
}
Response: {
  "destination": "Jakarta",
  "service": "Reguler",
  "shippingFee": 15000
}
```

### Create Payment
```
POST /api/payment
Body: {
  "orderId": "DJ-123456-produk-1-2",
  "items": [
    {
      "product": {
        "id": "produk-1",
        "name": "Jamur Krispi",
        "price": 25000
      },
      "quantity": 2
    }
  ],
  "subtotal": 50000,
  "shippingFee": 15000,
  "customerName": "John Doe",
  "customerPhone": "0812345678",
  "customerEmail": "john@example.com",
  "customerAddress": "Jl. Sudirman, Jakarta",
  "destination": "Jakarta",
  "shippingService": "Reguler"
}
Response: {
  "success": true,
  "order_id": "DJ-123456-produk-1-2",
  "transaction_id": "1234567-1234567",
  "redirect_url": "https://app.midtrans.com/snap/v2/redirection/...",
  "total_amount": 65000
}
```

### Get Order
```
GET /api/orders/[orderId]
Response: {
  "success": true,
  "data": {
    "id": "uuid",
    "order_id": "DJ-123456",
    "customer": {...},
    "order_items": [...],
    "status": "paid|pending|failed",
    "total_amount": 65000,
    ...
  }
}
```

### Update Order
```
PUT /api/orders/[orderId]
Body: {
  "status": "paid|pending|failed|shipped|delivered",
  "payment_method": "credit_card",
  "notes": "Optional notes"
}
```

### Midtrans Callback
```
POST /api/orders/[orderId]/callback
(Automatically called by Midtrans when payment status changes)
```

---

## 6. Database Schema

### customers
- `id` (BIGSERIAL PRIMARY KEY)
- `email` (VARCHAR UNIQUE)
- `name` (VARCHAR)
- `phone` (VARCHAR)
- `address` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### orders
- `id` (UUID PRIMARY KEY)
- `order_id` (VARCHAR UNIQUE) - Human readable ID like "DJ-123456"
- `customer_id` (BIGINT FK)
- `transaction_id` (VARCHAR) - Midtrans transaction ID
- `qr_code_url` (TEXT)
- `subtotal` (BIGINT)
- `shipping_fee` (BIGINT)
- `total_amount` (BIGINT)
- `destination` (VARCHAR)
- `shipping_service` (VARCHAR)
- `status` (VARCHAR) - pending, paid, failed, shipped, delivered
- `payment_method` (VARCHAR)
- `notes` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### order_items
- `id` (BIGSERIAL PRIMARY KEY)
- `order_id` (UUID FK)
- `product_id` (VARCHAR)
- `product_name` (VARCHAR)
- `price` (BIGINT)
- `quantity` (INTEGER)
- `subtotal` (BIGINT)
- `created_at` (TIMESTAMP)

---

## 7. Testing

### Test Payment Flow (Local)
1. Start dev server: `npm run dev`
2. Kunjungi checkout page
3. Masukkan data customer
4. Klik bayar
5. Akan redirect ke Midtrans payment page
6. Di Sandbox Midtrans, gunakan test card:
   - **Card Number**: 4811 1111 1111 1114
   - **Expiry**: 12/25
   - **CVV**: 123
7. Verify payment berhasil di database

---

## 8. Common Issues

### "Missing Supabase environment variables"
- Pastikan `.env.local` sudah dibuat dan terisi lengkap
- Restart dev server setelah edit `.env.local`

### "Missing Midtrans environment variables"
- Verify API keys sudah dicopy dengan benar (tanpa extra spaces)
- Pastikan keys dari **Sandbox** mode, bukan Production

### Callback tidak masuk
- Verify `NEXT_PUBLIC_SITE_URL` sesuai dengan environment
- Check Midtrans Dashboard untuk failed callback attempts
- Pastikan signature verification sukses

---

## 9. Production Deployment

Sebelum go to production:
1. Switch Midtrans ke **Production mode**
2. Update API keys ke production keys
3. Setup Supabase production project
4. Update callback URLs di Midtrans
5. Set `NEXT_PUBLIC_SITE_URL` ke domain produksi
6. Review security settings

---

## Support Resources

- Supabase Docs: https://supabase.com/docs
- Midtrans Docs: https://docs.midtrans.com
- Midtrans Sandbox: https://app.sandbox.midtrans.com
