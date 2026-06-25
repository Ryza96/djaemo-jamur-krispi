# TODO - Fix 500 PUT /api/products (price string to int + safer image sync)

- [x] A) Review and patch `app/admin/dashboard/page.tsx` → update `handleSaveProduct` to sanitize `formData.price` from formatted Rupiah string to integer (regex).

- [x] B) Patch `app/api/products/route.ts` → update `PUT` to sanitize `price` as integer before update.
- [x] C) Patch `PUT` backend to update `products` first, then sync images to `product_images` by `product_id` (ordered, transactional/clean approach).

- [ ] D) Run `npm run lint` and `npm run build`.
- [ ] E) Manual test: Edit product in admin dashboard, save, verify no 500 and images sync correctly.

