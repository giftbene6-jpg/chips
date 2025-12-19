import { NextResponse } from "next/server";
import { backendClient } from "@/sanity/lib/backendClient";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const clerkUserId = url.searchParams.get("clerkUserId");

    if (!clerkUserId) return NextResponse.json({ error: "clerkUserId required" }, { status: 400 });

    const query = `*[_type == "order" && clerkUserId == $id] | order(orderDate desc) {
      _id,
      orderNumber,
      status,
      totalPrice,
      amountDiscount,
      orderDate,
      customerName,
      email,
      promoCode,
      paystackReference,
      paystackTransactionId,
      products[]{
        quantity,
        productId,
        name,
        price,
        image,
        product->{_id, name, price, currency, image}
      }
    }`;

    const orders = await backendClient.fetch(query, { id: clerkUserId });

    return NextResponse.json({ orders });
  } catch (err) {
    // Add detailed error logging to debug the issue
    console.error("Error fetching orders:", err);
    // Add more detailed error logging to identify the root cause
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
