import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { backendClient } from "@/sanity/lib/backendClient";

export async function POST(request: Request) {
  console.log("Webhook: Received request");
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature") || "";
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error("Paystack secret key is not configured.");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const hmac = createHmac("sha512", secretKey).update(rawBody).digest("hex");
    if (hmac !== signature) {
      console.warn("Invalid Paystack signature.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    if (event.event !== "charge.success") {
      return NextResponse.json({ message: "Unhandled event type" }, { status: 400 });
    }

    const reference = event.data?.reference;
    if (!reference) {
      console.error("Transaction reference is missing.");
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    const existingOrder = await backendClient.fetch(
      `*[_type == "order" && paystackReference == $ref][0]`,
      { ref: reference }
    );

    if (existingOrder) {
      console.log(`Order with reference ${reference} already exists.`);
      return NextResponse.json({ message: "Order already processed" });
    }

    const metadata = event.data?.metadata || {};
    const products = metadata.cartItems?.map((item: any) => ({
      _key: item.id,
      product: { _type: "reference", _ref: item.id },
      quantity: item.quantity,
      price: item.price,
    }));

    const order = {
      _type: "order",
      orderNumber: reference,
      paystackReference: reference,
      clerkUserId: metadata.userId,
      customerName: event.data?.customer?.email || "Unknown",
      email: event.data?.customer?.email,
      products,
      totalPrice: event.data?.amount / 100,
      currency: "NGN",
      status: "paid",
      orderDate: new Date().toISOString(),
    };

    const createdOrder = await backendClient.create(order);
    console.log(`Order created successfully: ${createdOrder._id}`);

    return NextResponse.json({ message: "Order processed successfully" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Paystack webhook endpoint" });
}
