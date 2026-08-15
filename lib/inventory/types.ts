export const MOVEMENT_REASON = {
  ORDER_CONFIRM: "order_confirm",
  ORDER_CANCEL: "order_cancel",
  DEDUCT_ROLLBACK: "deduct_rollback",
  RESUME_FULFILLMENT: "resume_fulfillment",
  MANUAL_ADJUST: "manual_adjust",
  CORRECTION: "correction",
} as const;

export type MovementReason =
  (typeof MOVEMENT_REASON)[keyof typeof MOVEMENT_REASON];

export const DOMAIN_EVENTS = {
  STOCK_DEDUCTED: "inventory.stock_deducted",
  STOCK_RESTORED: "inventory.stock_restored",
  STOCK_ADJUSTED: "inventory.stock_adjusted",
  STOCK_INSUFFICIENT: "inventory.stock_insufficient",
  LOW_STOCK_DETECTED: "inventory.low_stock_detected",
} as const;

export type InventoryEvent =
  (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS];

export interface StockValidationResult {
  available: boolean;
  currentStock: number;
}

export interface StockInfo {
  productId: string;
  currentStock: number;
  updatedAt: string;
}

export interface DeductStockParams {
  productId: string;
  quantity: number;
  reason: MovementReason;
  referenceId?: string;
  actor?: string;
  /** @future reserved for idempotency */
  idempotencyKey?: string;
  /** @future reserved for cross-domain correlation */
  correlationId?: string;
  /** @future reserved for extensible metadata */
  metadata?: Record<string, unknown>;
}

export interface RestoreStockParams {
  productId: string;
  quantity: number;
  reason: MovementReason;
  referenceId?: string;
  actor?: string;
  /** @future reserved for idempotency */
  idempotencyKey?: string;
  /** @future reserved for cross-domain correlation */
  correlationId?: string;
  /** @future reserved for extensible metadata */
  metadata?: Record<string, unknown>;
}

export interface CheckoutStockItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface OrderStockItem {
  productId: string;
  productName: string;
  requested: number;
  available: number;
  sufficient: boolean;
}

export interface ValidateOrderStockResult {
  valid: boolean;
  items: OrderStockItem[];
}

export interface DeductOrderStockItem {
  productId: string;
  productName: string;
  deducted: number;
  newStock: number;
}

export interface DeductOrderStockResult {
  success: boolean;
  items: DeductOrderStockItem[];
  message?: string;
}

export interface RestoreOrderStockItem {
  productId: string;
  productName: string;
  restored: number;
  newStock: number;
}

export interface RestoreOrderStockResult {
  success: boolean;
  items: RestoreOrderStockItem[];
  message?: string;
}

export interface AdjustStockParams {
  productId: string;
  delta: number;
  reason: MovementReason;
  adminId?: string;
  notes?: string;
  referenceId?: string;
  actor?: string;
  /** @future reserved for idempotency */
  idempotencyKey?: string;
  /** @future reserved for cross-domain correlation */
  correlationId?: string;
  /** @future reserved for extensible metadata */
  metadata?: Record<string, unknown>;
}

export interface StockMovementInput {
  productId: string;
  orderId: string | null;
  delta: number;
  previousStock: number;
  newStock: number;
  reason: MovementReason;
  createdBy: string;
  /** @future reserved for idempotency */
  idempotencyKey?: string;
  /** @future reserved for cross-domain correlation */
  correlationId?: string;
  /** @future reserved for extensible metadata */
  metadata?: Record<string, unknown>;
}

export interface StockMovement {
  id: string;
  productId: string;
  orderId: string | null;
  delta: number;
  previousStock: number;
  newStock: number;
  reason: MovementReason;
  createdBy: string;
  createdAt: string;
}

export interface MovementQueryOptions {
  limit?: number;
  offset?: number;
  from?: string;
  to?: string;
}

/**
 * ── Future Extension ─────────────────────────────────────────
 *
 * All mutation params interfaces (DeductStockParams,
 * RestoreStockParams, AdjustStockParams, StockMovementInput)
 * already carry optional fields for:
 *
 *   - idempotencyKey  — enables safe retry / deduplication
 *   - correlationId   — cross-domain trace (e.g. Fulfillment → Inventory)
 *   - metadata        — arbitrary payload for extensibility
 *
 * These fields are OPTIONAL now. Implementations MUST tolerate
 * their absence. Once the infra layer is ready, consumers can
 * start populating them without contract changes.
 */
