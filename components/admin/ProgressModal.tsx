"use client";

import type { FileUploadStatusItem, UploadSummary } from "@/lib/errors/upload-errors";
import { getUploadSummary } from "@/lib/errors/upload-errors";

export type PipelineStatus = 'WAITING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

export type PipelineStep = {
  id: number;
  label: string;
  status: PipelineStatus;
  error?: string;
};

function StatusIcon({ status }: { status: PipelineStatus }) {
  if (status === 'SUCCESS') {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
        ✓
      </div>
    );
  }
  if (status === 'FAILED') {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
        ✕
      </div>
    );
  }
  if (status === 'RUNNING') {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
        <span className="inline-block animate-spin">⟳</span>
      </div>
    );
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-400">
      {null}
    </div>
  );
}

function FileRow({ item }: { item: FileUploadStatusItem }) {
  const statusIcon = () => {
    switch (item.status) {
      case 'success':
        return <span className="text-emerald-600">✓</span>;
      case 'failed':
        return <span className="text-red-600">✕</span>;
      case 'uploading':
        return <span className="inline-block animate-spin text-blue-600">⟳</span>;
      default:
        return <span className="text-slate-300">○</span>;
    }
  };
  const statusColor = () => {
    switch (item.status) {
      case 'success':
        return 'text-emerald-700';
      case 'failed':
        return 'text-red-700';
      case 'uploading':
        return 'text-blue-700';
      default:
        return 'text-slate-400';
    }
  };
  return (
    <div className="rounded-lg bg-white/60 px-3 py-1.5">
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-sm">{statusIcon()}</span>
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">{item.fileName}</span>
        <span className={`shrink-0 text-xs ${statusColor()}`}>
          {item.status === 'failed' ? 'Gagal' : item.status === 'uploading' ? 'Mengunggah...' : item.status === 'success' ? 'Berhasil' : 'Menunggu'}
        </span>
      </div>
      {item.status === 'failed' && item.errorMessage && (
        <p className="mt-0.5 pl-7 text-xs text-red-600">{item.errorMessage}</p>
      )}
    </div>
  );
}

function UploadSummaryRow({ summary }: { summary: UploadSummary }) {
  if (summary.total === 0) return null;
  const parts: string[] = [`${summary.total} gambar dipilih`];
  if (summary.success > 0) parts.push(`${summary.success} berhasil`);
  if (summary.failed > 0) parts.push(`${summary.failed} gagal`);
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
      {parts.join(' — ')}
    </div>
  );
}

export default function ProgressModal({
  steps,
  error,
  isOpen,
  fileStatuses,
}: {
  steps: PipelineStep[];
  error: string | null;
  isOpen: boolean;
  fileStatuses: FileUploadStatusItem[];
}) {
  if (!isOpen) return null;

  const summary = getUploadSummary(fileStatuses);
  const step2Status = steps.find((s) => s.id === 2)?.status || 'WAITING';
  const showFileList = step2Status !== 'WAITING' && fileStatuses.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Menyimpan Produk</h2>
        <p className="mb-5 text-sm text-slate-500">Memproses data produk...</p>

        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.id}>
              <div className="flex items-center gap-3">
                <StatusIcon status={step.status} />
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      step.status === 'FAILED'
                        ? 'text-red-700'
                        : 'text-slate-800'
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.status === 'FAILED' && step.error && (
                    <p className="mt-0.5 text-xs text-red-600">{step.error}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 text-xs font-medium ${
                    step.status === 'RUNNING'
                      ? 'text-blue-600'
                      : step.status === 'SUCCESS'
                        ? 'text-emerald-600'
                        : step.status === 'FAILED'
                          ? 'text-red-600'
                          : 'text-slate-300'
                  }`}
                >
                  {step.status === 'WAITING'
                    ? 'Menunggu'
                    : step.status === 'RUNNING'
                      ? 'Berjalan'
                      : step.status === 'SUCCESS'
                        ? 'Berhasil'
                        : 'Gagal'}
                </span>
              </div>
              {step.id === 2 && showFileList && (
                <div className="ml-10 mt-2 space-y-1">
                  {fileStatuses.map((fs) => (
                    <FileRow key={fs.id} item={fs} />
                  ))}
                  <UploadSummaryRow summary={summary} />
                </div>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">Proses gagal</p>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
