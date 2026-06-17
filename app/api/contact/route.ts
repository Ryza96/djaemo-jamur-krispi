import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const { data, error } = await supabase.from("contacts").insert([
      {
        name,
        email,
        phone: phone || null,
        message,
      },
    ]).select();

    if (error) {
      console.error("Supabase insert contact error:", error);
      const isMissingTable = typeof error.message === "string" && error.message.includes("Could not find the table");
      return NextResponse.json(
        {
          error: isMissingTable
            ? "Gagal menyimpan pesan: tabel kontak belum dibuat di Supabase. Jalankan SQL di database/schema.sql dan restart server."
            : `Gagal menyimpan pesan: ${error.message || JSON.stringify(error)}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
