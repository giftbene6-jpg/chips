import { NextResponse } from "next/server";
import { verifyPaystackTransaction, mockTransactions } from "@/lib/paystack";
import { createOrder } from "@/lib/sanity/order";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get("reference");

    if (!reference) return NextResponse.json({ error: "reference required" }, { status: 400 });

    // If mock tx exists, return simulated success and create order in Sanity
    if (mockTransactions[reference]) {
      const tx = mockTransactions[reference];
      const items = Array.isArray(tx.metadata?.cartItems) ? tx.metadata.cartItems : (Array.isArray(tx.metadata?.items) ? tx.metadata.items : []);

      // Create order in Sanity
      try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const products = items.map((it: any) => ({
            productId: it.id,
            name: it.name,
            price: it.price,
            quantity: it.quantity || 1,
            image: it.image,
          }));

          await createOrder({
            orderNumber: reference,
            paystackReference: reference,
            paystackTransactionId: `MOCK-${reference}`,
            paystackCustomerId: (tx.metadata?.paystackCustomerId as string) || (tx.metadata?.clerkUserId as string) || "",
            clerkUserId: (tx.metadata?.userId as string) || (tx.metadata?.clerkUserId as string) || "mock-user",
            customerName: (tx.metadata?.userName as string) || (tx.metadata?.customerName as string) || "Mock Customer",
            email: tx.email,
            promoCode: (tx.metadata?.promoCode as string) || null,
            products,
            totalPrice: (tx.amount || 0) / 100,
            currency: "NGN",
            amountDiscount: (tx.metadata?.discount as number) || 0,
            status: tx.status === "success" ? "paid" : "pending",
            metadata: tx.metadata,
          });
      } catch (err) {
        console.error("Failed to create mock order in Sanity", err);
      }

      return NextResponse.json({
        orderNumber: reference,
        email: tx.email,
        amount: (tx.amount || 0) / 100,
        items,
        reference,
        status: tx.status === "success" ? "success" : "pending",
      });
    }

    const verification = await verifyPaystackTransaction(reference);
    if (!verification.status) return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });

    const { data } = verification;
    const orderNumber = reference;
    const email = data.customer?.email || "";
    const amount = (data.amount || 0) / 100;
    const meta = data.metadata || {};
    
    // Parse items
    let items = [];
    if (Array.isArray(meta.cartItems)) {
        items = meta.cartItems;
    } else if (typeof meta.cartItems === "string") {
        try { items = JSON.parse(meta.cartItems); } catch { /* empty */ }
    } else if (Array.isArray(meta.items)) {
        items = meta.items;
    }

    // If payment succeeded, create an order in Sanity (idempotent)
    try {
      if (data.status === "success") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const products = items.map((it: any) => ({
            productId: it.id,
            name: it.name,
            price: it.price,
            quantity: it.quantity || 1,
            image: it.image,
          }));

          await createOrder({
            orderNumber: reference,
            paystackReference: reference,
            paystackTransactionId: data.id?.toString() || data.reference || `PS-${reference}`,
            paystackCustomerId: data.customer?.id?.toString() || "",
            clerkUserId: meta.userId || meta.clerkUserId || "",
            customerName: meta.userName || meta.customerName || data.customer?.email || "",
            email: email || "no-email@example.com",
            promoCode: meta.promoCode || null,
            products,
            totalPrice: amount,
            currency: "NGN",
            amountDiscount: meta.discount || 0,
            status: "paid",
            metadata: meta,
          });
      }
    } catch (err) {
      console.error("Failed to create order in Sanity after verification", err);
    }

    return NextResponse.json({ orderNumber, email, amount, items, reference, status: data.status });
  } catch (err) {
    console.error("Verify error", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
