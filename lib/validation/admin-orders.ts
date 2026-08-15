import { z } from "zod";
import { FULFILLMENT_STATUS } from "@/lib/services/payment/types";

const validFulfillmentStatuses = Object.values(FULFILLMENT_STATUS) as [string, ...string[]];

export const paginatedOrdersSchema = z.object({
  search: z.string().optional(),
  payment_status: z.string().optional(),
  fulfillment_status: z.enum(validFulfillmentStatuses).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const adminActionSchema = z.object({
  action: z.enum(["confirm", "pack", "ship", "complete", "cancel"]),
  waybill_id: z.string().optional(),
  cancellation_reason: z.string().optional(),
});

export const adminNotesSchema = z.object({
  admin_notes: z
    .string()
    .min(10, "Catatan minimal 10 karakter")
    .max(2000, "Catatan maksimal 2000 karakter"),
});

export const restockSchema = z.object({
  quantity: z
    .number()
    .int("Jumlah harus bilangan bulat")
    .min(1, "Jumlah minimal 1")
    .max(100000, "Jumlah terlalu besar"),
});
