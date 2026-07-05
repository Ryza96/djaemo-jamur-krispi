import { UPLOAD } from '@/lib/constants/upload';

export interface ValidationError {
  code: string;
  message: string;
}

export function validateImageFile(file: File): ValidationError | null {
  if (!UPLOAD.ALLOWED_FORMATS.includes(file.type)) {
    return {
      code: 'INVALID_FORMAT',
      message: `Format file tidak didukung: ${file.type || file.name}. Gunakan jpg, jpeg, png, atau webp.`,
    };
  }
  if (file.size > UPLOAD.MAX_FILE_SIZE) {
    return {
      code: 'FILE_TOO_LARGE',
      message: `Ukuran file ${file.name} melebihi 2 MB.`,
    };
  }
  return null;
}

export function validateFileCount(count: number): ValidationError | null {
  if (count > UPLOAD.MAX_IMAGES) {
    return {
      code: 'MAX_IMAGES',
      message: `Maksimal ${UPLOAD.MAX_IMAGES} gambar.`,
    };
  }
  return null;
}

export function validateTotalSize(files: File[]): ValidationError | null {
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  if (totalBytes > UPLOAD.MAX_TOTAL_SIZE) {
    return {
      code: 'MAX_TOTAL_SIZE',
      message: 'Total ukuran gambar melebihi 10 MB.',
    };
  }
  return null;
}
