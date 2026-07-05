# Checkout Flow Audit

**Task ID:** SPR-04-002A  
**Title:** Checkout Flow Audit  
**Risk:** LOW  
**Scope:** Analysis only  
**Date:** 2026-07-03

## 1. Complete Checkout Flow from Cart to Success Page

1. Customer adds products to cart through product UI components.
2. `CartProvider` stores cart items in React state and persists them to `localStorage` under `djaemo-cart`.
3. Customer opens `/cart`.
4. Cart page displays cart rows, subtotal, and a legacy flat-rate shipping estimate using `/api/shipping`.
5. Customer clicks `Lanjutkan Pembayaran` and navigates to `/checkout`.
6. `/checkout` checks that cart items exist through `useCart`.
7. `CheckoutProvider` initializes customer, shipping, courier, fee, voucher, submitting, and error state.
8. Customer fills buyer information through checkout form components.
9. Customer fills structured shipping address.
10. `ShippingSelector` waits for address completeness and cart items, then fetches available courier rates.
11. `getRates` calls `/api/biteship-rates`.
12. Customer selects a shipping rate.
13. Checkout state stores selected courier, service, and shipping fee.
14. Customer submits the checkout form.
15. `CheckoutForm` validates customer info, shipping address, non-empty cart, and selected shipping fee.
16. `CheckoutForm` sends `POST /api/payment/create`.
17. Payment API validates request shape with Zod.
18. `OrderService.createDraft` creates or updates customer data, creates an unpaid order, inserts order items, and writes an audit log.
19. `createSnapTransaction` sends transaction payload to Midtrans Snap.
20. `OrderService.confirmPayment` marks the order as pending and stores the Snap token as `transaction_id`.
21. API returns `orderId`, Snap token, redirect URL, and total amount.
22. Browser stores `djaemo-last-order` in `localStorage`.
23. Browser redirects customer to Midtrans Snap.
24. Midtrans sends payment notification to `POST /api/payment/callback`.
25. `OrderService.processCallback` verifies signature, validates gross amount, maps Midtrans status, updates order payment status, and writes audit logs.
26. Midtrans redirects customer back to `/checkout/success?order_id=...`.
27. Success page loads order details through `GET /api/orders/[id]`.
28. Success page displays payment status, buyer info, order items, totals, shipping service, and next steps.
29. Success page clears cart if URL or stored order payment status maps to success.

## 2. Every API Involved

- `POST /api/shipping`
  - Used by `/cart` only.
  - Calculates legacy flat-rate shipping from free-text address and service.

- `POST /api/biteship-rates`
  - Used by checkout shipping selector.
  - Calls Biteship rate API using origin/destination coordinates, cart items, and courier list.

- `POST /api/payment/create`
  - Main checkout submission endpoint.
  - Creates draft order, creates Midtrans Snap transaction, and moves payment status to pending.

- `POST /api/payment/callback`
  - Main Midtrans callback endpoint.
  - Processes payment notification and updates payment status.

- `GET /api/orders/[id]`
  - Used by checkout success page.
  - Reads order detail by internal UUID or public `order_id`.

- `PUT /api/orders/[id]`
  - Present in the same route file.
  - Not part of normal customer checkout success flow, but can update payment status, payment method, and notes.

- Address lookup APIs used by checkout address UI:
  - `GET /api/address/provinces`
  - `GET /api/address/regencies`
  - `GET /api/address/districts`
  - `GET /api/address/villages`

- Legacy or adjacent APIs observed:
  - `POST /api/payment`
  - `POST /api/orders/[id]/callback`
  - These are not the primary checkout path but remain relevant risk points because they overlap payment/order responsibilities.

## 3. Every Service Involved

- `OrderService`
  - `createDraft`
  - `confirmPayment`
  - `processCallback`

- `AuditLogService`
  - `logPaymentEvent`
  - Used for order creation, Snap creation, retries, callback invalid/skipped/status-changed, and rollback events.

- Payment services:
  - `createSnapTransaction`
  - `verifyMidtransSignature`
  - `mapMidtransStatus`
  - `combineAddress`

- Shipping services:
  - `getRates`
  - `mapBiteshipRates`

- Address provider:
  - `getProvinces`
  - `getRegencies`
  - `getDistricts`
  - `getVillages`

- Legacy cart shipping utility:
  - `calculateFlatRateShipping`
  - `parseDestinationFromAddress`

## 4. Every Repository Involved

- `OrderRepository`
  - Checks duplicate order IDs.
  - Inserts orders.
  - Inserts order items.
  - Deletes draft order if item insertion fails.
  - Updates payment status by internal ID or `order_id`.
  - Reads order detail for success page/admin workflows.

- `CustomerRepository`
  - Upserts customer by email.

- `AuditLogRepository`
  - Inserts audit log rows.

- `ProductRepository`
  - Used by product/catalog/detail pages.
  - Not used during payment creation to validate checkout item prices.

## 5. Every Database Table Involved

- `customers`
  - Upserted during draft order creation.
  - Stores name, email, phone, and address.

- `orders`
  - Inserted during checkout.
  - Stores order ID, customer ID, subtotal, shipping fee, total amount, destination, shipping service, courier fields, customer phone, shipping address, notes, payment status, fulfillment status, transaction ID, payment method, and timestamps.

- `order_items`
  - Inserted after order creation.
  - Stores product ID, product name, price, quantity, subtotal, and weight-related columns from migrations.

- `audit_logs`
  - Receives payment and fulfillment event records.

- `products`
  - Source table for catalog/product pages.
  - Should be the source of truth for price and weight, but is not currently checked during checkout payment creation.

- `product_images`
  - Used by product repository for catalog/detail display.
  - Not directly involved in checkout submission.

## 6. Payment Flow

1. Checkout form builds an order ID with `buildOrderId`.
2. Browser sends customer info, shipping address, selected courier/service/fee, cart items, and subtotal to `/api/payment/create`.
3. API validates shape using local Zod schema.
4. `OrderService.createDraft` checks duplicate order ID.
5. Customer is upserted by email.
6. Order is inserted with `payment_status = unpaid` and `fulfillment_status = new`.
7. Order items are inserted.
8. Audit log records `order.created`.
9. `createSnapTransaction` builds Midtrans payload with `gross_amount = subtotal + shippingFee`.
10. Midtrans Snap transaction is created.
11. `OrderService.confirmPayment` updates order payment status to `pending` and stores Snap token.
12. Audit log records `snap.created`.
13. Customer is redirected to Midtrans.
14. Midtrans callback posts to `/api/payment/callback`.
15. Callback validates required fields.
16. `verifyMidtransSignature` verifies HMAC-SHA512 signature.
17. Callback compares Midtrans gross amount with stored order total.
18. Callback maps Midtrans status to internal payment status.
19. Callback enforces payment status transitions.
20. Order payment status is updated.
21. Audit log records payment state outcome.

## 7. Shipping Flow

There are two shipping flows:

### Cart Flat-Rate Estimate

1. Customer enters a free-text address on `/cart`.
2. Cart page calls `POST /api/shipping`.
3. API parses destination from address text.
4. API calculates flat-rate shipping.
5. Cart page displays estimated destination and fee.

This estimate is not carried into the checkout flow.

### Checkout Biteship Rate Selection

1. Customer fills structured address on `/checkout`.
2. `ShippingSelector` waits for province, city, kecamatan, and kelurahan.
3. `getRates` determines destination coordinates from latitude/longitude if present or from city fallback map.
4. `getRates` derives item weight from product weight text, defaulting to 100.
5. `getRates` calls `POST /api/biteship-rates`.
6. API validates coordinates, items, and couriers.
7. API calls Biteship rates endpoint.
8. API maps Biteship response into simplified rate objects.
9. Customer selects one rate.
10. Checkout state stores courier, service, and fee.
11. Payment creation stores selected courier/service/fee on the order.

## 8. Current Weaknesses

- Server trusts client-submitted product prices, subtotal, and shipping fee.
- Product repository is not used during checkout to verify product existence, price, or weight.
- No inventory or stock validation.
- Order creation is not atomic across customer, order, order items, and audit log writes.
- Customer upsert by email can overwrite name, phone, and address without preserving order-specific customer history except copied order fields.
- Checkout payment route logs full request body and Midtrans payload details.
- Legacy `/cart` shipping estimate differs from checkout Biteship shipping flow.
- Checkout `CreatePaymentRequest` type omits `areaId`, `latitude`, `longitude`, and `districtName`, even though checkout state has them.
- `OrderRepository.insert` does not persist `postal_code` or `destination_area_id` even though later shipping migrations include those columns.
- Payment create schema only requires `postalCode` to be non-empty, while client validation requires five digits.
- Biteship rate city fallback covers only selected cities.
- Success page relies on public `GET /api/orders/[id]` and exposes order details by order ID.
- `PUT /api/orders/[id]` exists without being part of the customer checkout flow and can mutate order payment fields.
- Legacy payment/callback endpoints remain present and may confuse operational ownership.

## 9. Missing Validations

- Server-side product ID existence check.
- Server-side product price recalculation.
- Server-side subtotal recalculation.
- Server-side shipping fee verification against selected courier/service/rate.
- Server-side item weight validation from database.
- Server-side stock/inventory validation.
- Server-side quantity maximum per item/order.
- Server-side duplicate item consolidation or rejection.
- Server-side postal code regex in `/api/payment/create`.
- Server-side phone format validation in `/api/payment/create`.
- Server-side email policy alignment between client and server; client allows empty email but payment API requires valid email.
- Validation that selected courier/service is one of the Biteship rates returned for the address/items.
- Validation that order total matches sum of persisted order items plus shipping.
- Validation that `NEXT_PUBLIC_SITE_URL` exists before building Midtrans finish URL.
- Validation that payment callback transaction belongs to expected Midtrans environment.

## 10. Missing Business Rules

- Product availability and active/inactive product status.
- Inventory reservation before payment.
- Inventory decrement after paid callback.
- Maximum purchasable quantity.
- Minimum order amount.
- Shipping coverage rules for unsupported destinations.
- Free shipping or voucher rules.
- Voucher application and validation.
- Order expiration/cancellation when payment expires.
- Customer notification after order creation/payment success.
- Order confirmation number policy.
- Repeat customer identity rules.
- Fraud handling when Midtrans returns challenge/deny/refund states.
- Refund and cancellation workflow.
- Manual payment recovery workflow.

## 11. Potential Bugs

- Cart page displays a flat-rate shipping estimate, but checkout requires a separate Biteship selection; customers may see different shipping fees.
- `shippingAddressSchema` client allows email to be empty, but `/api/payment/create` rejects empty email.
- Checkout state includes `areaId`, but payment API schema drops it; later shipment creation may lack destination area ID.
- `postal_code` column exists in migrations, but current order insertion does not persist it directly.
- `OrderService.createDraft` deletes the order if item insertion fails, but does not roll back customer upsert.
- Audit log insert failures are swallowed, so order state can change without audit trail.
- Snap creation retry can create ambiguity if Midtrans creates a transaction but the response fails.
- Success page clears cart only when it can map status to success; delayed callbacks may leave cart uncleared for pending flows.
- Success page reads order by URL order ID; if order ID is predictable or shared, order details can be exposed.
- `mapMidtransStatus` maps unknown statuses to pending, which may hide unexpected provider states.
- `refund` and `partial_refund` map to paid, which may be misleading for future refund workflows.
- `GET /api/orders/[id]` and `PUT /api/orders/[id]` use direct Supabase access instead of the repository/service pattern.
- Legacy callback route may update status outside the main callback state machine.

## 12. Recommended Implementation Order

1. Recalculate product prices, subtotal, item subtotal, shipping fee, and total on the server.
2. Use `ProductRepository` or a dedicated checkout pricing service during payment creation.
3. Persist required structured shipping fields, especially postal code and Biteship area ID.
4. Align client and server validation schemas for email, phone, postal code, address, items, and shipping.
5. Replace multi-step order creation with an atomic database transaction or Supabase RPC.
6. Remove or lock down legacy duplicate payment/order endpoints after Tech Lead approval.
7. Protect customer order detail/mutation endpoints and remove public mutation access.
8. Unify cart shipping estimate and checkout shipping selection to avoid fee mismatch.
9. Add inventory/product availability business rules.
10. Add automated integration tests for checkout creation, Midtrans callback, failed Snap creation, and success page order loading.

## Audit Conclusion

The checkout flow is functionally complete for an MVP: cart items can be submitted, shipping rates can be selected, orders can be stored, Midtrans Snap can be created, callbacks can update payment status, and the success page can show order details. The main production blockers are not missing screens; they are missing server-side business validation, incomplete structured shipping persistence, non-atomic order writes, legacy endpoint overlap, and public order mutation/read exposure.
