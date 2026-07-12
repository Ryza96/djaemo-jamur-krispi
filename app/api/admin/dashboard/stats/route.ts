import { NextResponse } from "next/server";
import { DashboardRepository } from "@/lib/repositories";

export async function GET() {
  try {
    const stats = await DashboardRepository.getDashboardStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengambil data dashboard." },
      { status: 500 },
    );
  }
}
