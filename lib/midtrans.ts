import midtransClient from "midtrans-client";

// Support both CJS and ESM default export shapes
const Midtrans: any = (midtransClient && (midtransClient as any).Snap)
  ? midtransClient
  : (midtransClient as any)?.default ?? midtransClient;

const serverKey = (process.env.MIDTRANS_SERVER_KEY || "").trim();
const clientKey = (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "").trim();

if (!serverKey || !clientKey) {
  throw new Error(
    "Missing Midtrans environment variables. Set MIDTRANS_SERVER_KEY and NEXT_PUBLIC_MIDTRANS_CLIENT_KEY"
  );
}

const isProduction = process.env.NODE_ENV === "production";

// Snap API for creating payment transactions
export const snap = new Midtrans.Snap({
  isProduction,
  serverKey,
  clientKey,
});

// Core API for transaction status checks
export const core = new Midtrans.CoreApi({
  isProduction,
  serverKey,
});
