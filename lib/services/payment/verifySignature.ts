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

  let expected: Buffer;
  let actual: Buffer;

  try {
    expected = Buffer.from(hash, "hex");
    actual = Buffer.from(signatureKey, "hex");
  } catch {
    return false;
  }

  if (expected.length !== actual.length) return false;

  return crypto.timingSafeEqual(expected, actual);
}
