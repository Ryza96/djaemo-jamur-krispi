import crypto from "crypto";

export function verifyMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}): boolean {
  const { orderId, statusCode, grossAmount, signatureKey } = params;

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    return false;
  }

  const hash = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");

  return hash === signatureKey;
}
