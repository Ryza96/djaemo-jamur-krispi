import { NextResponse } from "next/server";
import { getProvinces } from "@/lib/services/address/provider";

export const dynamic = "force-static";

export async function GET() {
  const provinces = getProvinces();
  return NextResponse.json(provinces);
}
