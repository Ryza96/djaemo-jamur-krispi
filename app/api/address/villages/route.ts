import { NextRequest, NextResponse } from "next/server";
import { getVillages } from "@/lib/services/address/provider";

export async function GET(request: NextRequest) {
  const districtId = request.nextUrl.searchParams.get("districtId");
  if (!districtId) {
    return NextResponse.json(
      { error: "districtId is required" },
      { status: 400 },
    );
  }
  const villages = getVillages(districtId);
  return NextResponse.json(villages);
}
