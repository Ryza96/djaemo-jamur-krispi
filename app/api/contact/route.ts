import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { escapeHtml } from "@/lib/utils";
import { getClientIdentifier } from "@/lib/services/admin-login-rate-limit.service";
import {
  isContactRateLimited,
  recordContactAttempt,
} from "@/lib/services/contact-rate-limit.service";

const RESEND_API_URL = "https://api.resend.com/emails";
const CONTACT_EMAIL = "nguntaljamor@gmail.com";

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MAX_PHONE_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 2000;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validationErrors(input: {
  name: string;
  email: string;
  phone: string;
  message: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!input.name) {
    errors.name = "Nama wajib diisi.";
  } else if (input.name.length > MAX_NAME_LENGTH) {
    errors.name = `Nama maksimal ${MAX_NAME_LENGTH} karakter.`;
  }

  if (!input.email) {
    errors.email = "Email wajib diisi.";
  } else if (input.email.length > MAX_EMAIL_LENGTH) {
    errors.email = `Email maksimal ${MAX_EMAIL_LENGTH} karakter.`;
  } else if (!isValidEmail(input.email)) {
    errors.email = "Format email tidak valid.";
  }

  if (input.phone && input.phone.length > MAX_PHONE_LENGTH) {
    errors.phone = `Telepon maksimal ${MAX_PHONE_LENGTH} karakter.`;
  }

  if (!input.message) {
    errors.message = "Pesan wajib diisi.";
  } else if (input.message.length > MAX_MESSAGE_LENGTH) {
    errors.message = `Pesan maksimal ${MAX_MESSAGE_LENGTH} karakter.`;
  }

  return errors;
}

async function sendContactEmail(name: string, email: string, phone: string | null, message: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[Contact] RESEND_API_KEY not set, skipping email");
    return;
  }
  // Escape every user-controlled value for the HTML context. The DB
  // stores the raw input; escaping applies only to the HTML rendering.
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone || "-");
  const safeMessage = escapeHtml(message);
  const safeSubject = escapeHtml(name);

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1a472a;border-bottom:2px solid #1a472a;padding-bottom:8px">Pesan Baru dari Form Kontak</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px 0;font-weight:bold;width:140px">Nama</td><td style="padding:8px 0">${safeName}</td></tr>
        <tr><td style="padding:8px 0;font-weight:bold">Email</td><td style="padding:8px 0"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
        <tr><td style="padding:8px 0;font-weight:bold">Telepon</td><td style="padding:8px 0">${safePhone}</td></tr>
        <tr><td style="padding:8px 0;font-weight:bold;vertical-align:top">Pesan</td><td style="padding:8px 0;white-space:pre-wrap">${safeMessage}</td></tr>
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
      from: "hello@mail.djaemo.com",
      to: [CONTACT_EMAIL],
      subject: `Pesan Baru dari Form Kontak - ${safeSubject}`,
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
  // 1. Resolve client IP and enforce rate limit BEFORE processing
  //    anything (validation, DB insert, email send).
  const identifier = getClientIdentifier(request);

  if (await isContactRateLimited(identifier)) {
    return NextResponse.json(
      { error: "Terlalu banyak pengiriman pesan. Coba lagi dalam beberapa saat." },
      { status: 429 },
    );
  }

  // 2. Record this attempt (regardless of outcome) so a failed
  //    validation still consumes the quota (anti-bypass).
  await recordContactAttempt(identifier);

  // 3. Parse and validate input.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body tidak valid." },
      { status: 400 },
    );
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  const phone = typeof raw.phone === "string" ? raw.phone.trim() : "";
  const message = typeof raw.message === "string" ? raw.message.trim() : "";

  const errors = validationErrors({ name, email, phone, message });
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Data tidak valid.", fields: errors }, { status: 400 });
  }

  // 4. Persist the raw input (unescaped) to the contacts table.
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

  // 5. Send the notification email (fire-and-forget).
  sendContactEmail(name, email, phone || null, message).catch((err) => {
    console.error("Failed to send contact email:", err);
  });

  return NextResponse.json({ success: true, data });
}
