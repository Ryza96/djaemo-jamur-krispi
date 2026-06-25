import { NextResponse } from 'next/server';

const BITESHIP_RATES_URL = 'https://api.biteship.com/v1/rates/couriers';
const API_TIMEOUT_MS = 10000;

export const POST = async (request: Request) => {
  try {
    const body = await request.json();

    const {
      origin_latitude,
      origin_longitude,
      destination_latitude,
      destination_longitude,
      weight,
      items,
      couriers,
    } = body;

    const missingFields: string[] = [];
    if (typeof origin_latitude !== 'number') missingFields.push('origin_latitude');
    if (typeof origin_longitude !== 'number') missingFields.push('origin_longitude');
    if (typeof destination_latitude !== 'number') missingFields.push('destination_latitude');
    if (typeof destination_longitude !== 'number') missingFields.push('destination_longitude');
    if (typeof weight !== 'number' || Number.isNaN(weight) || weight <= 0) missingFields.push('weight');
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
    }));

    const payload = {
      origin: {
        latitude: origin_latitude,
        longitude: origin_longitude,
      },
      destination: {
        latitude: destination_latitude,
        longitude: destination_longitude,
      },
      weight,
      items: normalizedItems,
      couriers: courierList.join(','),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(BITESHIP_RATES_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer biteship_test.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoidGVzdEFQSSIsInVzZXJJZCI6IjZhMzdhMzZiNjg4MTdlNzNkYTgxODM0NiIsImlhdCI6MTc4MjE5NTU5N30.E9CmyRZbxsY2ACKLt4BUCxg0vowtXnwajb5IkbRSI-c',
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

    const rates =
      responseData?.rates || responseData?.results || responseData?.data || responseData;

    if (!Array.isArray(rates)) {
      return NextResponse.json(
        { error: 'Unexpected response format from Biteship sandbox.', raw: responseData },
        { status: 502 }
      );
    }

    const cleanedRates = rates.map((rate: any) => ({
      courier: rate.courier_company || rate.courier || rate.courier_name || null,
      service: rate.service || rate.name || rate.courier_service || null,
      price:
        typeof rate.price === 'number'
          ? rate.price
          : Number(rate.price ?? rate.cost ?? rate.amount ?? null),
      etd: rate.etd || rate.estimated_delivery_time || rate.lead_time || null,
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
