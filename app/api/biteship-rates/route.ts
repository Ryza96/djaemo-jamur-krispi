import { NextResponse } from 'next/server';

const BITESHIP_RATES_URL = 'https://api.biteship.com/v1/rates/couriers';
const API_TIMEOUT_MS = 10000;

const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY;

export const POST = async (request: Request) => {
  if (!BITESHIP_API_KEY) {
    return NextResponse.json(
      { error: "Biteship API key tidak dikonfigurasi." },
      { status: 500 }
    );
  }
  try {
    const body = await request.json();

    const {
      origin_latitude,
      origin_longitude,
      destination_latitude,
      destination_longitude,
      items,
      couriers,
    } = body;

    const missingFields: string[] = [];
    if (typeof origin_latitude !== 'number') missingFields.push('origin_latitude');
    if (typeof origin_longitude !== 'number') missingFields.push('origin_longitude');
    if (typeof destination_latitude !== 'number') missingFields.push('destination_latitude');
    if (typeof destination_longitude !== 'number') missingFields.push('destination_longitude');
    if (!Array.isArray(items) || items.length === 0) missingFields.push('items');
    if (typeof couriers !== 'string' || !couriers.trim()) missingFields.push('couriers');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing or invalid fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const courierList = couriers
      .split(',')
      .map((code: string) => code.trim())
      .filter(Boolean);

    if (courierList.length === 0) {
      return NextResponse.json(
        { error: 'couriers must contain at least one courier code.' },
        { status: 400 }
      );
    }

    const normalizedItems = items.map((item: any) => ({
      name: String(item.name || 'item'),
      quantity: Number(item.quantity ?? 1),
      value: Number(item.value ?? 0),
      weight: Number(item.weight ?? 0),
    }));

    const payload: Record<string, unknown> = {
      origin_latitude,
      origin_longitude,
      destination_latitude,
      destination_longitude,
      items: normalizedItems,
      couriers: courierList.join(','),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(BITESHIP_RATES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${BITESHIP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();

    let responseData: any = null;

    if (responseText) {
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = null;
      }
    }

    if (!response.ok) {
      const apiError =
        responseData?.message ||
        responseData?.error ||
        responseData?.errors?.[0] ||
        responseText ||
        `Biteship sandbox returned status ${response.status}`;

      return NextResponse.json(
        { error: apiError },
        { status: response.status }
      );
    }

    const pricing = responseData?.pricing;

    if (!Array.isArray(pricing)) {
      return NextResponse.json(
        { error: 'Unexpected response format from Biteship sandbox.', raw: responseData },
        { status: 502 }
      );
    }

    const cleanedRates = pricing.map((item: any) => ({
      courier: item.courier_code || item.courier || item.company || null,
      service: item.courier_service_name || item.courier_service_code || item.service || null,
      price:
        typeof item.price === 'number'
          ? item.price
          : Number(item.price ?? item.shipping_fee ?? 0),
      etd: item.duration || item.shipment_duration_range || null,
    }));

    return NextResponse.json({ success: true, rates: cleanedRates });
  } catch (error: any) {
    const message =
      error?.name === 'AbortError'
        ? 'Request timeout saat menghubungi Biteship sandbox.'
        : error?.message || 'Terjadi kesalahan internal server.';

    return NextResponse.json(
      { error: message },
      { status: error?.name === 'AbortError' ? 504 : 500 }
    );
  }
};
