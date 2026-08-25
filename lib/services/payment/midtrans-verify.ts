import { core } from "@/lib/midtrans";

/**
 * Re-verifies against the Midtrans Core API that a transaction is genuinely
 * settled/captured right now.
 *
 * Used as defense-in-depth before recovering an order that our DB marked
 * terminal (EXPIRED/FAILED) but for which Midtrans reports payment: the
 * webhook signature proves the notification came from Midtrans, while this
 * check ensures the transaction's CURRENT state is settlement (guards
 * against stale/replayed notifications).
 */
export async function isTransactionSettledAtMidtrans(
  orderId: string,
): Promise<boolean> {
  try {
    const status = await core.transaction.status(orderId);
    const transactionStatus = String(
      status?.transaction_status ?? "",
    ).toLowerCase();
    const fraudStatus = String(status?.fraud_status ?? "accept").toLowerCase();

    if (!["settlement", "capture"].includes(transactionStatus)) {
      return false;
    }

    // A challenged/denied fraud status means funds are not safely captured.
    return fraudStatus === "accept";
  } catch {
    // Unknown transaction / API failure: never recover on uncertainty.
    return false;
  }
}
