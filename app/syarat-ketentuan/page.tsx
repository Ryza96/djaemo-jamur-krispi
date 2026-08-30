import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/sections/Section";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: `Syarat & ketentuan pemesanan di ${SITE.name}.`,
};

const sections = [
  {
    heading: "1. Tentang Kami",
    body: [
      `${SITE.name} adalah usaha perorangan yang menjual produk camilan jamur krispi secara online.`,
    ],
  },
  {
    heading: "2. Pemesanan",
    body: [
      "• Pesanan dianggap sah setelah pembayaran berhasil diverifikasi melalui Midtrans.",
      "• Anda bertanggung jawab memastikan data pesanan (nama, alamat, nomor kontak) yang Anda masukkan sudah benar. Kami tidak bertanggung jawab atas keterlambatan atau kegagalan pengiriman akibat data yang tidak akurat.",
    ],
  },
  {
    heading: "3. Harga dan Pembayaran",
    body: [
      "• Harga produk tertera dalam Rupiah dan sudah termasuk PPN bila berlaku, belum termasuk ongkos kirim.",
      "• Pembayaran diproses melalui Midtrans. Kami tidak menyimpan detail kartu atau metode pembayaran Anda.",
    ],
  },
  {
    heading: "4. Pengiriman",
    body: [
      "• Pengiriman ditangani melalui mitra kurir via Biteship. Estimasi waktu kirim yang ditampilkan bersifat perkiraan, bukan jaminan.",
      "• Nomor resi akan tersedia di halaman lacak pesanan setelah paket diserahkan ke kurir.",
    ],
  },
  {
    heading: "5. Kebijakan Retur & Pengembalian Dana",
    body: [
      "Karena produk kami adalah makanan, kami tidak menerima retur dengan alasan perubahan pikiran atau selera pribadi, demi menjaga kebersihan dan keamanan pangan.",
      "Kami menerima keluhan dan akan memproses penggantian atau pengembalian dana untuk kondisi berikut, dengan bukti foto/video yang dikirim melalui kontak kami maksimal 2x24 jam setelah barang diterima:",
      "• Produk rusak/cacat saat diterima",
      "• Produk yang dikirim salah dari yang dipesan",
      "• Produk hilang atau tidak sampai sesuai bukti pelacakan",
      "Pengembalian dana (jika disetujui) diproses melalui Midtrans ke metode pembayaran asal Anda, dalam waktu kerja yang wajar setelah klaim disetujui.",
    ],
  },
  {
    heading: "6. Pembatasan Tanggung Jawab",
    body: [
      "Kami berupaya menjaga kualitas produk dan layanan, namun tidak bertanggung jawab atas kerugian tidak langsung akibat keterlambatan pihak ketiga (kurir, penyedia pembayaran) di luar kendali kami.",
    ],
  },
  {
    heading: "7. Perubahan Syarat & Ketentuan",
    body: [
      "Kami dapat memperbarui syarat ini sewaktu-waktu. Versi terbaru akan selalu tersedia di halaman ini.",
    ],
  },
];

export default function SyaratKetentuanPage() {
  return (
    <Section>
      <PageHeader
        title="Syarat & Ketentuan"
        description="Terakhir diperbarui: 30 Agustus 2026"
      />

      <div className="mx-auto max-w-3xl space-y-8">
        <p className="text-base leading-8 text-foreground/85">
          Dengan melakukan pemesanan di djaemojamurkrispi.com, Anda menyetujui
          syarat dan ketentuan berikut.
        </p>

        {sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="text-xl font-bold text-primary">
              {section.heading}
            </h2>
            <div className="space-y-2 leading-7 text-foreground/85">
              {section.body.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </section>
        ))}

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-primary">8. Hubungi Kami</h2>
          <div className="leading-7 text-foreground/85">
            <p>{SITE.name} (Usaha Perorangan)</p>
            <p>{SITE.address}</p>
            <p>
              Email:{" "}
              <a
                href={`mailto:${SITE.email}`}
                className="text-primary hover:underline"
              >
                {SITE.email}
              </a>
            </p>
            <p>
              WhatsApp:{" "}
              <a
                href={`https://wa.me/62${SITE.phone.replace(/\D/g, "").replace(/^0/, "")}`}
                className="text-primary hover:underline"
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
