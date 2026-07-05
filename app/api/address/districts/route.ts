import { NextRequest, NextResponse } from "next/server";
import { getDistricts } from "@/lib/services/address/provider";

export async function GET(request: NextRequest) {
  const regencyId = request.nextUrl.searchParams.get("regencyId");
  if (!regencyId) {
    return NextResponse.json(
      { error: "regencyId is required" },
      { status: 400 },
    );
  }
  const districts = getDistricts(regencyId);
  return NextResponse.json(districts);
}
