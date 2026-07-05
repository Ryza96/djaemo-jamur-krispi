export const UPLOAD = {
  ALLOWED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as readonly string[],
  MAX_FILE_SIZE: 2 * 1024 * 1024,      // 2 MB per file
  MAX_TOTAL_SIZE: 10 * 1024 * 1024,    // 10 MB total
  MAX_IMAGES: 5,
  STORAGE_BUCKET: 'product-images',
} as const;
