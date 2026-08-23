-- =============================================================
-- Migration 029: Make customers.email nullable
-- =============================================================
-- Email bersifat opsional saat checkout (boleh tidak diisi).
--
-- Kolom ini memiliki constraint UNIQUE. Jika "tanpa email"
-- disimpan sebagai string kosong (''), semua customer tanpa email
-- akan bertabrakan pada satu baris yang sama karena upsert
-- ON CONFLICT (email). Di PostgreSQL, nilai NULL dianggap unik
-- satu sama lain oleh unique index, sehingga setiap customer
-- tanpa email mendapat barisnya sendiri.
--
-- Urutan penting: DROP NOT NULL harus dijalankan SEBELUM
-- konversi '' -> NULL, jika tidak UPDATE akan ditolak constraint.
--
-- Aman dijalankan ulang (idempotent).
--
-- Penyusun constraint awal: database/schema.sql (bootstrap lama):
--   email VARCHAR(255) UNIQUE NOT NULL
-- =============================================================

ALTER TABLE customers ALTER COLUMN email DROP NOT NULL;

UPDATE customers SET email = NULL WHERE email = '';
