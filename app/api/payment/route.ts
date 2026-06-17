import { NextResponse } from "next/server";
import { snap } from "@/lib/midtrans";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
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
  } = body;

  if (
    !orderId ||
    !Array.isArray(items) ||
    typeof subtotal !== "number" ||
    typeof shippingFee !== "number" ||
    !customerName ||
    !customerPhone ||
    !customerEmail ||
    !customerAddress
  ) {
    return NextResponse.json({ error: "Data pembayaran tidak valid." }, { status: 400 });
  }

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
        status: "pending",
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

    const payloadAmount = itemDetails.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    console.log("Midtrans payment debug", {
      orderId,
      subtotal,
      shippingFee,
      totalAmount,
      payloadAmount,
      itemDetailsCount: itemDetails.length,
      midtransServerKeySet: Boolean(process.env.MIDTRANS_SERVER_KEY),
      midtransClientKeySet: Boolean(process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY),
    });

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

    console.log("Midtrans payload", JSON.stringify(midtransPayload, null, 2));

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

