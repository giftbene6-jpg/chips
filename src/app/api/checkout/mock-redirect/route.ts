import { NextResponse } from "next/server";
import { mockTransactions } from "@/lib/paystack";
import { backendClient } from "@/sanity/lib/backendClient";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get("reference");
    if (!reference) return NextResponse.json({ error: "reference required" }, { status: 400 });

    const tx = mockTransactions[reference];
    if (!tx) return NextResponse.json({ error: "transaction not found" }, { status: 404 });

    mockTransactions[reference] = { ...tx, status: "success", paidAt: Date.now() };

    // Create order in Sanity if token present
    try {
      const items = Array.isArray(tx.metadata?.items) ? tx.metadata.items : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const products = items.map((it: any) => ({ _type: "object", product: { _type: "reference", _ref: it.id }, quantity: it.quantity || 1 }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orderDoc: any = {
        _type: "order",
        orderNumber: reference,
        paystackReference: reference,
        paystackTransactionId: `MOCK-${reference}`,
        paystackCustomerId: tx.metadata?.clerkUserId || "mock-user",
        clerkUserId: tx.metadata?.clerkUserId || "mock-user",
        customerName: tx.metadata?.customerName || "Mock Customer",
        email: tx.email,
        promoCode: tx.metadata?.promoCode || null,
        products,
        totalPrice: (tx.amount || 0) / 100,
        currency: "NGN",
        amountDiscount: tx.metadata?.discount || 0,
        status: "paid",
        orderDate: new Date().toISOString(),
      };

      if (process.env.SANITY_API_TOKEN) {
        await backendClient.create(orderDoc);
      }
    } catch (err) {
      console.error("Failed creating order in Sanity", err);
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    return NextResponse.redirect(`${base}/checkout/success?reference=${encodeURIComponent(reference)}`);
  } catch (err) {
    console.error("mock redirect error", err);
    return NextResponse.json({ error: "mock redirect failed" }, { status: 500 });
  }
}
