import axios from "axios";
import midtransClient from "midtrans-client";

// Support both CJS and ESM default export shapes
const Midtrans: any = (midtransClient && (midtransClient as any).Snap)
  ? midtransClient
  : (midtransClient as any)?.default ?? midtransClient;

const MIDTRANS_HTTP_TIMEOUT_MS = 15000;

// midtrans-client's internal HttpClient() builds its own axios instance via
// axios.create(), which inherits the global defaults at construction time.
// Setting an explicit timeout here guarantees slow Midtrans requests fail
// with a clear error instead of hanging until the serverless budget and
// surfacing as an opaque 502.
axios.defaults.timeout = MIDTRANS_HTTP_TIMEOUT_MS;

const serverKey = (process.env.MIDTRANS_SERVER_KEY || "").trim();
const clientKey = (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "").trim();

if (!serverKey || !clientKey) {
  throw new Error(
    "Missing Midtrans environment variables. Set MIDTRANS_SERVER_KEY and NEXT_PUBLIC_MIDTRANS_CLIENT_KEY"
  );
}

const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_ENV === "production";

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
