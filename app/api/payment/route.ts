import { NextResponse } from "next/server";
import { z } from "zod";
import { snap } from "@/lib/midtrans";
import { supabase } from "@/lib/supabase";

const paymentSchema = z.object({
  orderId: z.string().min(1, "orderId wajib diisi.").max(50, "orderId maksimal 50 karakter."),
  items: z
    .array(
      z.object({
        product: z.object({
          id: z.string(),
          name: z.string(),
          price: z.number(),
        }),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "Minimal satu item."),
  subtotal: z.number().nonnegative(),
  shippingFee: z.number().nonnegative(),
  customerName: z.string().min(1, "Nama wajib diisi."),
  customerPhone: z.string().min(1, "Nomor telepon wajib diisi."),
  customerEmail: z.string().email("Email tidak valid."),
  customerAddress: z.string().min(1, "Alamat wajib diisi."),
  destination: z.any().optional(),
  shippingService: z.any().optional(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body bukan JSON valid." }, { status: 400 });
  }

  const parsed = paymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data pembayaran tidak valid." },
      { status: 400 }
    );
  }

  const {
    orderId,
    items,
    subtotal,
    shippingFee,
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    destination,
    shippingService,
  } = parsed.data;

  const totalAmount = subtotal + shippingFee;

  try {
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .upsert(
        {
          email: customerEmail,
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
        },
        { onConflict: "email" }
      )
      .select()
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: "Gagal menyimpan data customer." }, { status: 500 });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_id: orderId,
        customer_id: customer.id,
        subtotal,
        shipping_fee: shippingFee,
        total_amount: totalAmount,
        destination,
        shipping_service: shippingService,
        payment_status: "pending",
      })
      .select()
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Gagal membuat order di database." }, { status: 500 });
    }

    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      return NextResponse.json({ error: "Gagal menyimpan order items." }, { status: 500 });
    }

    const itemDetails = items.map((item: any) => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
    }));

    if (shippingFee > 0) {
      itemDetails.push({
        id: "shipping",
        name: "Ongkos Kirim",
        price: shippingFee,
        quantity: 1,
      });
    }

    const midtransPayload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: totalAmount,
      },
      customer_details: {
        first_name: customerName,
        email: customerEmail,
        phone: customerPhone,
        billing_address: {
          address: customerAddress,
        },
      },
      item_details: itemDetails,
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?order_id=${orderId}`,
      },
    };

    const { token, redirect_url } = await snap.createTransaction(midtransPayload);

    await supabase
      .from("orders")
      .update({
        transaction_id: token,
      })
      .eq("id", order.id);

    return NextResponse.json({
      success: true,
      order_id: orderId,
      transaction_id: token,
      redirect_url,
      total_amount: totalAmount,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membuat transaksi pembayaran." },
      { status: 500 }
    );
  }
}

