export type {
  IInventoryRepository,
  IStockMovementRepository,
  IInventoryService,
} from "./contracts";

export type {
  StockValidationResult,
  StockInfo,
  DeductStockParams,
  RestoreStockParams,
  OrderStockItem,
  ValidateOrderStockResult,
  DeductOrderStockItem,
  DeductOrderStockResult,
  RestoreOrderStockItem,
  RestoreOrderStockResult,
  AdjustStockParams,
  StockMovementInput,
  StockMovement,
  MovementQueryOptions,
  MovementReason,
  InventoryEvent,
} from "./types";

export {
  MOVEMENT_REASON,
  DOMAIN_EVENTS,
} from "./types";
