export type UploadErrorCode =
  | 'FILE_TOO_LARGE'
  | 'INVALID_FORMAT'
  | 'MAX_TOTAL_SIZE'
  | 'MAX_IMAGES'
  | 'STORAGE_UPLOAD_FAILED'
  | 'STORAGE_PERMISSION_DENIED'
  | 'PUBLIC_URL_FAILED'
  | 'DATABASE_FAILED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export type FileUploadStatusItem = {
  id: string;
  fileName: string;
  status: 'pending' | 'uploading' | 'success' | 'failed';
  errorCode?: UploadErrorCode;
  errorMessage?: string;
};

export type UploadSummary = {
  total: number;
  success: number;
  failed: number;
};

export type UploadError = {
  code: UploadErrorCode;
  userMessage: string;
  detail?: unknown;
};

const ERROR_MESSAGES: Record<UploadErrorCode, string> = {
  FILE_TOO_LARGE: 'Ukuran file melebihi batas maksimal 2 MB.',
  INVALID_FORMAT: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.',
  MAX_TOTAL_SIZE: 'Total ukuran gambar melebihi batas 10 MB.',
  MAX_IMAGES: 'Maksimal 5 gambar per produk.',
  STORAGE_UPLOAD_FAILED: 'Gagal mengunggah gambar ke penyimpanan.',
  STORAGE_PERMISSION_DENIED: 'Izin akses penyimpanan ditolak.',
  PUBLIC_URL_FAILED: 'Gagal mendapatkan tautan publik gambar.',
  DATABASE_FAILED: 'Gagal menyimpan data ke database.',
  NETWORK_ERROR: 'Koneksi jaringan terputus. Periksa koneksi Anda.',
  UNKNOWN_ERROR: 'Terjadi kesalahan yang tidak diketahui.',
};

const STORAGE_ERROR_KEYWORDS: Array<{ keyword: string; code: UploadErrorCode }> = [
  { keyword: 'row-level security', code: 'STORAGE_PERMISSION_DENIED' },
  { keyword: 'permission denied', code: 'STORAGE_PERMISSION_DENIED' },
  { keyword: 'signature verification failed', code: 'STORAGE_PERMISSION_DENIED' },
  { keyword: 'the resource already exists', code: 'STORAGE_UPLOAD_FAILED' },
  { keyword: 'not found', code: 'STORAGE_UPLOAD_FAILED' },
];

export function classifyUploadError(err: unknown): UploadError {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return { code: 'NETWORK_ERROR', userMessage: ERROR_MESSAGES.NETWORK_ERROR, detail: err };
  }

  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  for (const { keyword, code } of STORAGE_ERROR_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { code, userMessage: ERROR_MESSAGES[code], detail: err };
    }
  }

  return { code: 'STORAGE_UPLOAD_FAILED', userMessage: ERROR_MESSAGES.STORAGE_UPLOAD_FAILED, detail: err };
}

export function getUploadSummary(statuses: FileUploadStatusItem[]): UploadSummary {
  return {
    total: statuses.length,
    success: statuses.filter((s) => s.status === 'success').length,
    failed: statuses.filter((s) => s.status === 'failed').length,
  };
}

export function fileUploadStatusLabel(status: FileUploadStatusItem['status']): string {
  switch (status) {
    case 'pending':
      return 'Menunggu';
    case 'uploading':
      return 'Mengunggah...';
    case 'success':
      return 'Berhasil';
    case 'failed':
      return 'Gagal';
  }
}
