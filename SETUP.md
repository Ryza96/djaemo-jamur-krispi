# Environment Setup Guide

Panduan lengkap untuk setup environment variables dan konfigurasi untuk project Djaemo Jamur Krispi.

## 1. Supabase Setup

### Membuat Project Supabase

1. Pergi ke [supabase.com](https://supabase.com) dan buat akun
2. Buat project baru
3. Tunggu project selesai diinisialisasi

### Ambil Credentials

Di dashboard Supabase:
- Klik **Settings** → **API**
- Copy:
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ JANGAN bagikan)

### Setup Database Schema

Buka **SQL Editor** di Supabase dan jalankan:

```sql
-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(255) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  subtotal INTEGER NOT NULL,
  shipping_fee INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  destination VARCHAR(100),
  shipping_service VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(100),
  transaction_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(255),
  product_name VARCHAR(255),
  price INTEGER,
  quantity INTEGER,
  subtotal INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

## 2. Midtrans Setup

### Daftar Midtrans

1. Pergi ke [midtrans.com](https://midtrans.com)
2. Daftar dan buat akun
3. Verifikasi email Anda

### Ambil API Keys

Di Midtrans Dashboard:
- Masuk ke **Settings** → **API Keys**
- Copy:
  - **Server Key** → `MIDTRANS_SERVER_KEY` (⚠️ JANGAN bagikan)
  - **Client Key** → `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`

### Konfigurasi Environment

```
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=YOUR_CLIENT_KEY_HERE
MIDTRANS_SERVER_KEY=YOUR_SERVER_KEY_HERE
NEXT_PUBLIC_MIDTRANS_ENV=sandbox  # ganti ke 'production' saat live
```

## 3. File .env.local

Buat file `.env.local` di root project dengan template:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Midtrans
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=Mid-client...
MIDTRANS_SERVER_KEY=Mid-server...
NEXT_PUBLIC_MIDTRANS_ENV=sandbox

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development

# Shipping (opsional, gunakan default jika tidak diset)
SHIPPING_RATE_JAKARTA=15000
SHIPPING_RATE_BANDUNG=17000
SHIPPING_RATE_SURABAYA=19000
SHIPPING_RATE_LUAR_JAWA=25000
```

## 4. Instalasi Dependencies

```bash
npm install
```

## 5. Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## ⚠️ Security Notes

### JANGAN PERNAH:
- Commit `.env.local` ke git (sudah di `.gitignore`)
- Bagikan `SUPABASE_SERVICE_ROLE_KEY`
- Bagikan `MIDTRANS_SERVER_KEY`

### Environment Variables
- Keys dengan prefix `NEXT_PUBLIC_` akan terekspos ke browser (aman)
- Keys tanpa prefix hanya ada di server-side
- Selalu gunakan `.env.local` untuk development (tidak di-commit)

## Testing Midtrans Payment

Gunakan **Sandbox Account** untuk testing:

**Test Cards:**
- Visa: `4811111111111114` (approved)
- Mastercard: `5105105105105100` (approved)
- Expired: gunakan tanggal expired di masa depan

Lihat [Midtrans Docs](https://docs.midtrans.com/en/technical-reference/sandbox-credentials) untuk credentials lengkap.

## Troubleshooting

### Error: "Missing Supabase environment variables"
- ✅ Pastikan `NEXT_PUBLIC_SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` sudah di `.env.local`
- ✅ Restart dev server setelah update `.env.local`

### Error: "Missing Midtrans environment variables"
- ✅ Pastikan `MIDTRANS_SERVER_KEY` dan `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` sudah di `.env.local`
- ✅ Tunggu sebentar jika baru update env vars

### Payment tidak bekerja di production
- ✅ Ganti `NEXT_PUBLIC_MIDTRANS_ENV=production`
- ✅ Update URLs di Midtrans Dashboard
- ✅ Gunakan production API keys (bukan sandbox)

---

Pertanyaan? Lihat:
- [Supabase Docs](https://supabase.com/docs)
- [Midtrans Docs](https://docs.midtrans.com)
