import { NextResponse } from "next/server";

const RAJA_ONGKIR_API_URL = process.env.RAJA_ONGKIR_API_URL;
const RAJA_ONGKIR_API_KEY = process.env.RAJA_ONGKIR_API_KEY;
const RAJA_ONGKIR_ORIGIN = process.env.RAJA_ONGKIR_ORIGIN;
const RAJA_ONGKIR_COURIER = process.env.RAJA_ONGKIR_COURIER || "jne";

export async function calculateRajaOngkirCost(weight: number, destination: string) {
  if (!RAJA_ONGKIR_API_URL || !RAJA_ONGKIR_API_KEY || !RAJA_ONGKIR_ORIGIN) {
    throw new Error("Raja Ongkir configuration belum lengkap.");
  }

  const body = {
    origin: RAJA_ONGKIR_ORIGIN,
    destination,
    weight,
    courier: RAJA_ONGKIR_COURIER,
  };

  const params = new URLSearchParams();
  params.append("origin", String(body.origin));
  params.append("destination", String(body.destination));
  params.append("weight", String(body.weight));
  params.append("courier", String(body.courier));

  const response = await fetch(RAJA_ONGKIR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      key: RAJA_ONGKIR_API_KEY,
    },
    body: params,
  });

  const data = await response.json();

  if (!response.ok || !data.rajaongkir) {
    throw new Error(data.description || "Gagal memanggil Raja Ongkir.");
  }

  const results = data.rajaongkir.results?.[0]?.costs;
  const cost = Array.isArray(results) && results[0]?.cost?.[0]?.value;

  if (typeof cost !== "number") {
    throw new Error("Respons Raja Ongkir tidak sesuai.");
  }

  return cost;
}
