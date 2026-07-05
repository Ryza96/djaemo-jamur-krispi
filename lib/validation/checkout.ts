import { z } from "zod";

export const customerInfoSchema = z.object({
  name: z
    .string()
    .min(1, "Nama lengkap wajib diisi")
    .max(100, "Nama maksimal 100 karakter"),
  whatsapp: z
    .string()
    .min(1, "Nomor WhatsApp wajib diisi")
    .regex(
      /^(\+62|62|0)8[1-9][0-9]{6,12}$/,
      "Nomor WhatsApp tidak valid",
    ),
  email: z
    .string()
    .max(100, "Email maksimal 100 karakter")
    .refine(
      (val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Format email tidak valid",
    ),
  notes: z.string().max(500, "Catatan maksimal 500 karakter"),
});

export const shippingAddressSchema = z.object({
  street: z
    .string()
    .min(1, "Alamat jalan wajib diisi")
    .max(200, "Alamat maksimal 200 karakter"),
  kelurahan: z
    .string()
    .min(1, "Kelurahan wajib diisi")
    .max(100, "Kelurahan maksimal 100 karakter"),
  kecamatan: z
    .string()
    .min(1, "Kecamatan wajib diisi")
    .max(100, "Kecamatan maksimal 100 karakter"),
  city: z
    .string()
    .min(1, "Kota wajib diisi")
    .max(100, "Kota maksimal 100 karakter"),
  province: z
    .string()
    .min(1, "Provinsi wajib diisi")
    .max(100, "Provinsi maksimal 100 karakter"),
  postalCode: z
    .string()
    .min(1, "Kode pos wajib diisi")
    .regex(/^[0-9]{5}$/, "Kode pos harus 5 digit angka"),
  areaId: z.string().default(""),
  districtName: z.string().default(""),
  latitude: z.number().default(0),
  longitude: z.number().default(0),
});

export type CustomerInfoInput = z.infer<typeof customerInfoSchema>;
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
