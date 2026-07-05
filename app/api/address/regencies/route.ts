import { NextRequest, NextResponse } from "next/server";
import { getRegencies } from "@/lib/services/address/provider";

export async function GET(request: NextRequest) {
  const provinceId = request.nextUrl.searchParams.get("provinceId");
  if (!provinceId) {
    return NextResponse.json(
      { error: "provinceId is required" },
      { status: 400 },
    );
  }
  const regencies = getRegencies(provinceId);
  return NextResponse.json(regencies);
}
