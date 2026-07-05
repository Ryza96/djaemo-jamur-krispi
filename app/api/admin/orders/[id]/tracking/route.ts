import { NextResponse, NextRequest } from "next/server";
import { TrackingService } from "@/lib/services/shipping/tracking.service";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const result = await TrackingService.fetchAndPersist(id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Error fetching tracking:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengambil tracking." },
      { status: 500 },
    );
  }
}
