import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/sections/Section";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: `Kebijakan privasi ${SITE.name} — bagaimana kami mengumpulkan, menggunakan, dan melindungi data Anda.`,
};

const sections = [
  {
    heading: "1. Data yang Kami Kumpulkan",
    body: [
      "Saat checkout:",
      "• Nama lengkap, nomor WhatsApp, email (opsional)",
      "• Alamat pengiriman lengkap (jalan, provinsi, kota, kecamatan, kelurahan, kode pos)",
      "• Catatan pesanan (opsional)",
      "Saat menghubungi kami melalui form kontak:",
      "• Nama, email, nomor telepon (opsional), isi pesan",
      "Data teknis otomatis:",
      "• Alamat IP (untuk mencegah spam pada form kontak)",
      "• Data keranjang belanja dan status pesanan, disimpan sementara di perangkat Anda (localStorage browser) untuk kenyamanan berbelanja",
    ],
  },
  {
    heading: "2. Untuk Apa Data Digunakan",
    body: [
      "• Memproses dan mengirim pesanan Anda",
      "• Menghubungi Anda terkait status pesanan atau pertanyaan yang Anda ajukan",
      "• Mencegah penyalahgunaan/spam pada form kontak dan sistem pemesanan",
      "• Meningkatkan layanan kami",
    ],
    note: "Kami tidak menjual atau menyewakan data Anda ke pihak lain untuk tujuan pemasaran.",
  },
  {
    heading: "3. Pihak Ketiga yang Memproses Data Anda",
    body: [
      "Untuk menjalankan layanan, kami bekerja sama dengan:",
      "• Midtrans — pemrosesan pembayaran",
      "• Biteship — kalkulasi ongkos kirim dan pelacakan pengiriman",
      "• Resend — pengiriman email notifikasi",
      "• Supabase — penyimpanan data dan gambar produk",
    ],
    note: "Data Anda dibagikan ke pihak-pihak ini hanya sebatas yang diperlukan untuk memproses pesanan Anda (misalnya alamat pengiriman ke Biteship, detail pembayaran ke Midtrans).",
  },
  {
    heading: "4. Keamanan Data",
    body: [
      "Kami menerapkan langkah keamanan wajar untuk melindungi data Anda, termasuk pembatasan akses data pelanggan hanya untuk sistem yang memang membutuhkannya, dan tidak menampilkan data pribadi Anda ke publik melalui halaman pelacakan pesanan kecuali Anda mengakses melalui tautan pesanan Anda sendiri.",
    ],
  },
  {
    heading: "5. Hak Anda",
    body: [
      "Anda berhak meminta kami untuk:",
      "• Memberi tahu data apa saja yang kami simpan tentang Anda",
      "• Memperbaiki data yang tidak akurat",
      "• Menghapus data Anda (dengan catatan: data transaksi mungkin perlu disimpan untuk kepentingan pembukuan sesuai ketentuan yang berlaku)",
    ],
    note: "Hubungi kami melalui kontak di bagian bawah halaman ini untuk permintaan tersebut.",
  },
  {
    heading: "6. Penyimpanan Data",
    body: [
      "Data pesanan disimpan selama diperlukan untuk keperluan layanan pelanggan dan kewajiban pembukuan. Data form kontak yang hanya berupa log IP untuk mencegah spam dihapus otomatis secara berkala.",
    ],
  },
  {
    heading: "7. Perubahan Kebijakan",
    body: [
      "Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan akan tercermin melalui tanggal \"Terakhir diperbarui\" di atas.",
    ],
  },
];

export default function KebijakanPrivasiPage() {
  return (
    <Section>
      <PageHeader
        title="Kebijakan Privasi"
        description={`Terakhir diperbarui: 30 Agustus 2026`}
      />

      <div className="mx-auto max-w-3xl space-y-8">
        <p className="text-base leading-8 text-foreground/85">
          {SITE.name} (&quot;kami&quot;) adalah usaha perorangan yang menghormati
          privasi pelanggan. Kebijakan ini menjelaskan bagaimana kami
          mengumpulkan, menggunakan, dan melindungi data Anda saat berbelanja di
          djaemojamurkrispi.com.
        </p>

        {sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="text-xl font-bold text-ink">
              {section.heading}
            </h2>
            <div className="space-y-2 leading-7 text-foreground/85">
              {section.body.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              {section.note && (
                <p className="text-foreground/85">{section.note}</p>
              )}
            </div>
          </section>
        ))}

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-ink">8. Hubungi Kami</h2>
          <div className="leading-7 text-foreground/85">
            <p>{SITE.name} (Usaha Perorangan)</p>
            <p>{SITE.address}</p>
            <p>
              Email:{" "}
              <a
                href={`mailto:${SITE.email}`}
                className="text-ink hover:underline"
              >
                {SITE.email}
              </a>
            </p>
            <p>
              WhatsApp:{" "}
              <a
                href={`https://wa.me/62${SITE.phone.replace(/\D/g, "").replace(/^0/, "")}`}
                className="text-ink hover:underline"
              >
                0812-3904-7565
              </a>
            </p>
          </div>
        </section>
      </div>
    </Section>
  );
}
