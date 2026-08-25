import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const RESEND_API_URL = "https://api.resend.com/emails";
const CONTACT_EMAIL = "nguntaljamor@gmail.com";

async function sendContactEmail(name: string, email: string, phone: string | null, message: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[Contact] RESEND_API_KEY not set, skipping email");
    return;
  }
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1a472a;border-bottom:2px solid #1a472a;padding-bottom:8px">Pesan Baru dari Form Kontak</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px 0;font-weight:bold;width:140px">Nama</td><td style="padding:8px 0">${name}</td></tr>
        <tr><td style="padding:8px 0;font-weight:bold">Email</td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td style="padding:8px 0;font-weight:bold">Telepon</td><td style="padding:8px 0">${phone || "-"}</td></tr>
        <tr><td style="padding:8px 0;font-weight:bold;vertical-align:top">Pesan</td><td style="padding:8px 0;white-space:pre-wrap">${message}</td></tr>
      </table>
      <p style="font-size:12px;color:#999;margin-top:24px">Dikirim melalui form kontak di djaemojamurkrispi.com</p>
    </div>
  `;

  const text = `Pesan Baru dari Form Kontak\n\nNama: ${name}\nEmail: ${email}\nTelepon: ${phone || "-"}\nPesan:\n${message}\n\n---\nDikirim melalui form kontak di djaemojamurkrispi.com`;

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "onboarding@resend.dev",
      to: [CONTACT_EMAIL],
      subject: `Pesan Baru dari Form Kontak - ${name}`,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    console.error("[Contact] Resend email error:", response.status, body?.message || body?.error || "Unknown error");
  }
}

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

    sendContactEmail(name, email, phone || null, message).catch((err) => {
      console.error("Failed to send contact email:", err);
    });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
