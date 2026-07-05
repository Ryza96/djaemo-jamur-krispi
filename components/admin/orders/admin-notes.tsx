"use client";

import { useState } from "react";
import { useAdminNotes } from "@/hooks/use-admin-notes";
import { useToast } from "@/components/ui/Toast";

interface AdminNotesProps {
  orderId: string;
  initialNotes: string | null;
  onSuccess: () => void;
}

export function AdminNotes({
  orderId,
  initialNotes,
  onSuccess,
}: AdminNotesProps) {
  const { save, saving } = useAdminNotes();
  const { showToast } = useToast();
  const [text, setText] = useState(initialNotes ?? "");

  const dirty = text !== (initialNotes ?? "");

  const handleChange = (value: string) => {
    setText(value);
  };

  const charCount = text.length;
  const underMin = charCount > 0 && charCount < 10;
  const overMax = charCount > 2000;
  const canSave =
    dirty && !saving && charCount >= 10 && charCount <= 2000;

  const handleSave = async () => {
    const result = await save(orderId, text);

    if (result.success) {
      showToast("Catatan berhasil disimpan.", "success");
      onSuccess();
    } else {
      showToast(result.error ?? "Gagal menyimpan catatan.", "error");
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
        Admin Notes
      </h2>

      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Tulis catatan internal mengenai pesanan ini..."
        rows={4}
        className="w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
      />

      <div className="mt-2 flex items-center justify-between">
        <span
          className={`text-xs ${
            overMax
              ? "text-rose-500"
              : underMin
                ? "text-amber-500"
                : "text-slate-400"
          }`}
        >
          {charCount > 0 ? `${charCount} / 2000` : ""}
          {underMin && " (min. 10 karakter)"}
          {overMax && " (maks. 2000 karakter)"}
        </span>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition-colors ${
            canSave
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "cursor-not-allowed bg-slate-200 text-slate-400"
          }`}
        >
          {saving ? "Saving..." : "Save Notes"}
        </button>
      </div>
    </div>
  );
}
