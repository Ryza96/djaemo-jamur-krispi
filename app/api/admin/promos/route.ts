import { NextResponse } from "next/server";
import { PromoService } from "@/lib/services/promo.service";
import { requireAdmin } from "@/lib/services/admin-auth.service";

type PromoErrorType =
  | "validation"
  | "business_rule"
  | "not_found"
  | "database"
  | "unexpected";

function isDatabaseError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const err = error as Record<string, unknown>;
  return (
    typeof err.code === "string" &&
    typeof err.message === "string" &&
    typeof err.details === "string"
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as Record<string, unknown>).message);
  }
  return "Unknown error";
}

function getDatabaseDetails(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.details === "string" && err.details) return err.details;
  }
  return getErrorMessage(error);
}

function classifyServiceError(errorMsg: string): PromoErrorType {
  const lower = errorMsg.toLowerCase();
  if (lower.includes("tidak ditemukan")) return "not_found";
  if (
    lower.includes("sudah memiliki") ||
    lower.includes("berlaku pada rentang waktu")
  )
    return "business_rule";
  return "validation";
}

function getHttpStatus(type: PromoErrorType): number {
  switch (type) {
    case "validation":
    case "business_rule":
      return 400;
    case "not_found":
      return 404;
    case "database":
    case "unexpected":
      return 500;
  }
}

function validateCreatePromoPayload(body: unknown): string | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return "Payload harus berupa object";
  }

  const obj = body as Record<string, unknown>;

  if (!("name" in obj) || typeof obj.name !== "string") {
    return "Nama promo harus diisi";
  }

  if (!("start_date" in obj) || typeof obj.start_date !== "string") {
    return "Tanggal mulai harus diisi";
  }

  if (!("end_date" in obj) || typeof obj.end_date !== "string") {
    return "Tanggal berakhir harus diisi";
  }

  if (!("products" in obj) || !Array.isArray(obj.products)) {
    return "Produk harus berupa array";
  }

  const products = obj.products as unknown[];
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    if (typeof product !== "object" || product === null) {
      return `Produk ke-${i + 1} harus berupa object`;
    }
    const p = product as Record<string, unknown>;
    if (!("product_id" in p) || typeof p.product_id !== "string") {
      return `Produk ke-${i + 1} harus memiliki product_id`;
    }
    if (!("promo_price" in p) || typeof p.promo_price !== "number") {
      return `Produk ke-${i + 1} harus memiliki promo_price`;
    }
  }

  return null;
}

export async function GET() {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const promos = await PromoService.getAllPromos();
    return NextResponse.json({ success: true, data: promos });
  } catch (error) {
    console.error("GET /api/admin/promos error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data promo" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const body = await request.json();

    const payloadError = validateCreatePromoPayload(body);
    if (payloadError) {
      return NextResponse.json({ error: payloadError }, { status: 400 });
    }

    const result = await PromoService.createPromo(body);

    if (!result.success) {
      const errorType = classifyServiceError(result.error || "");
      return NextResponse.json(
        { error: result.error },
        { status: getHttpStatus(errorType) }
      );
    }

    return NextResponse.json(
      { success: true, data: { promo_id: result.promo_id } },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/promos error:", error);

    if (isDatabaseError(error)) {
      return NextResponse.json(
        { error: "Database Error", details: getDatabaseDetails(error) },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Unexpected Error", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
