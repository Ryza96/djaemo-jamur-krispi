import type {
  StockValidationResult,
  StockInfo,
  DeductStockParams,
  RestoreStockParams,
  StockMovementInput,
  ValidateOrderStockResult,
  DeductOrderStockResult,
  RestoreOrderStockResult,
  StockMovement,
  MovementQueryOptions,
  AdjustStockParams,
  CheckoutStockItem,
} from "./types";

/**
 * Repository layer for reading and writing product stock.
 * Operates directly on products.stock via atomic RPC functions.
 *
 * All state-changing methods accept a single params object
 * to support audit trail, ledger, and future idempotency.
 */
export interface IInventoryRepository {
  getStock(productId: string): Promise<StockInfo>;

  validateStock(
    productId: string,
    quantity: number,
  ): Promise<StockValidationResult>;

  deductStock(params: DeductStockParams): Promise<number>;

  restoreStock(params: RestoreStockParams): Promise<number>;

  adjustStock(params: AdjustStockParams): Promise<void>;
}

/**
 * Repository layer for stock movement ledger.
 * All writes are immutable inserts — no updates or deletes.
 */
export interface IStockMovementRepository {
  insert(movement: StockMovementInput): Promise<StockMovement>;

  findByProduct(
    productId: string,
    opts?: MovementQueryOptions,
  ): Promise<StockMovement[]>;

  findByOrder(orderId: string): Promise<StockMovement[]>;

  findRecent(limit?: number): Promise<StockMovement[]>;
}

/**
 * Domain service for inventory operations.
 * Orchestrates validation, deduction, restoration, and audit logging.
 * Called by FulfillmentService (order lifecycle) and Admin UI (manual adjust).
 *
 * ── resumeOrderStock — naming analysis ──────────────────────────
 *
 * Current name: "resumeOrderStock"
 * Problem:     "resume" is a Fulfillment concern (resuming a cancelled order).
 *              Inventory domain only deducts and restores stock; it does not
 *              "resume" anything.
 *
 * Options:
 *
 * 1. REMOVE from contract (recommended)
 *    - Callers use deductOrderStock(orderId) and pass reason via context.
 *    - Pro: Clean domain boundary, no method to misuse.
 *    - Con: Service cannot distinguish initial vs resume deduct in
 *           audit logs without examining the order status internally.
 *    - Mitigation: The MOVEMENT_REASON enum includes RESUME_FULFILLMENT,
 *                  so the service can determine the reason from the
 *                  order context and pass it to the repository.
 *
 * 2. RENAME to "reapplyOrderStock" or "confirmRestoredOrder"
 *    - Pro: Still inventory-centric verbiage.
 *    - Con: Same boundary blur, different label.
 *
 * 3. KEEP as-is
 *    - Pro: Explicit, no caller confusion.
 *    - Con: Violates domain-boundary principle; inventory now knows
 *           about "resuming".
 *
 * Decision: KEPT for now — removal can happen when FulfillmentService
 *           is implemented and we confirm the caller pattern.
 * ────────────────────────────────────────────────────────────────
 */
export interface IInventoryService {
  validateOrderStock(orderId: string): Promise<ValidateOrderStockResult>;

  validateCheckoutStock(
    items: CheckoutStockItem[],
  ): Promise<ValidateOrderStockResult>;

  deductOrderStock(orderId: string): Promise<DeductOrderStockResult>;

  restoreOrderStock(orderId: string): Promise<RestoreOrderStockResult>;

  resumeOrderStock(orderId: string): Promise<DeductOrderStockResult>;

  adjustProductStock(params: AdjustStockParams): Promise<void>;

  getStock(productId: string): Promise<StockInfo>;
}
