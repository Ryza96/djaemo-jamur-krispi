"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

export function ContactForm() {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      showToast("Lengkapi nama, email, dan pesan.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Terjadi kesalahan");

      showToast("Pesan berhasil dikirim. Terima kasih!", "success");
      setName("");
      setMessage("");
    } catch (err: any) {
      console.error("Contact submit error:", err);
      showToast(err.message || "Gagal mengirim pesan", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-foreground">Nama</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm outline-none focus:border-teal-deep focus:ring-2 focus:ring-teal-deep/20"
            placeholder="Nama lengkap"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="mt-1 w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm outline-none focus:border-teal-deep focus:ring-2 focus:ring-teal-deep/20"
            placeholder="email@example.com"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-foreground">Telepon / WhatsApp</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm outline-none focus:border-teal-deep focus:ring-2 focus:ring-teal-deep/20"
          placeholder="0812xxxxxxxx"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-foreground">Pesan</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="mt-1 w-full resize-none rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm outline-none focus:border-teal-deep focus:ring-2 focus:ring-teal-deep/20"
          placeholder="Tulis pesan Anda..."
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-teal-deep transition-transform hover:bg-gold-bright hover:scale-[1.02] disabled:opacity-60"
        >
          {loading ? "Mengirim..." : "Kirim Pesan"}
        </button>
        <button
          type="button"
          onClick={() => {
            setName("");
            setEmail("");
            setPhone("");
            setMessage("");
          }}
          className="text-sm text-muted underline-offset-2 hover:underline"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
