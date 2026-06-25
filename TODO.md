# TODO

## Produk - perbaikan error Supabase schema cache saat PUT
- [x] Review `app/api/products/route.ts` (GET/POST/PUT/DELETE)
- [ ] Implement PUT 2 tahap: update whitelist kolom products, lalu sinkronisasi tabel anak `product_images` (delete by product_id, insert objects {product_id, image_url})
- [ ] Pastikan `PUT` tidak mengirim field gambar ke `.update()` products
- [x] Jalankan build/lint / uji ulang update produk dari UI


