import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { initPaystack, mockTransactions } from "@/lib/paystack";
import { createOrder } from "@/lib/sanity/order";

export async function POST(request: Request) {
  console.log("Webhook: Received request");
  try {
    const init = initPaystack();
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature") || "";

    // Verify signature only when not in mock mode and secret exists
    if (init.mode !== "mock" && signature !== "mock-signature") {
      if (!init.secretKey) {
        console.warn("Webhook received but no Paystack secret configured");
        return NextResponse.json({ ok: false, reason: "no-secret" }, { status: 400 });
      }
      const hmac = createHmac("sha512", init.secretKey).update(rawBody).digest("hex");
      if (hmac !== signature) {
        console.warn("Invalid Paystack signature", { expected: hmac, got: signature });
        return NextResponse.json({ ok: false, reason: "invalid-signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody || "{}");
    const eventName = event.event || event.type || "";

    if (eventName === "charge.success" || eventName === "transaction.success") {
      const reference = event.data?.reference;
      if (!reference) {
        console.error("Webhook: No reference found in event data", event.data);
        return NextResponse.json({ ok: false, reason: "no-reference" }, { status: 400 });
      }

      console.log(`Webhook: Processing success event for reference: ${reference}`);

      // Mark mock tx paid if present
      if (mockTransactions[reference]) {
        mockTransactions[reference] = {
          ...mockTransactions[reference],
          status: "success",
          paidAt: Date.now(),
        };
      }

      // Create order in Sanity
      try {
        const data = event.data || {};
        const meta = data.metadata || mockTransactions[reference]?.metadata || {};
        
        console.log("Webhook: Metadata extracted:", JSON.stringify(meta, null, 2));

        // Parse items from metadata
        let items = [];
        if (Array.isArray(meta.cartItems)) {
          items = meta.cartItems;
        } else if (typeof meta.cartItems === "string") {
          try {
            items = JSON.parse(meta.cartItems);
          } catch (e) {
            console.error("Webhook: Failed to parse cartItems from metadata string", e);
          }
        } else if (Array.isArray(meta.items)) {
           // Fallback for legacy or mock
           items = meta.items;
        }

        console.log(`Webhook: Found ${items.length} items in metadata`);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const products = items.map((it: any) => ({
          productId: it.id || it.product?._id,
          name: it.name || it.product?.name,
          price: it.price || it.product?.price,
          quantity: it.quantity || 1,
          image: it.image || it.product?.image,
        }));

        const amount = (data.amount || mockTransactions[reference]?.amount || 0) / 100;
        
        // 🤖 AI ANALYSIS - Analyze the order using OpenAI
        let aiAnalysis;
        try {
          console.log("🤖 Starting AI analysis for order:", reference);
          const { analyzeOrder, requiresAdminNotification } = await import("@/lib/ai/orderAnalyzer");
          
          aiAnalysis = await analyzeOrder({
            orderNumber: reference,
            customerName: meta.userName || meta.customerName || data.customer?.email || "Customer",
            email: data.customer?.email || meta.userEmail || "no-email@example.com",
            totalPrice: amount,
            products: products.map((p: any) => ({
              name: p.name || "Unknown Product",
              price: p.price || 0,
              quantity: p.quantity || 1,
            })),
            clerkUserId: meta.userId || meta.clerkUserId,
            metadata: meta,
          });
          
          console.log("✅ AI analysis complete:", aiAnalysis);
          
          // 🚨 ADMIN NOTIFICATION - Alert admin if order requires attention
          if (requiresAdminNotification(aiAnalysis)) {
            console.log("🚨 Order requires admin notification");
            const { notifyAdmin } = await import("@/lib/notifications/adminNotifier");
            
            await notifyAdmin({
              orderNumber: reference,
              customerName: meta.userName || meta.customerName || data.customer?.email || "Customer",
              email: data.customer?.email || meta.userEmail || "no-email@example.com",
              totalPrice: amount,
              analysis: aiAnalysis,
            });
          }
          
        } catch (aiError) {
          console.error("⚠️ AI analysis failed, continuing without it:", aiError);
          // Don't fail the entire webhook if AI analysis fails
        }
        
        // Add detailed logging to debug webhook processing
        console.log("Webhook: Raw body received:", rawBody);
        console.log("Webhook: Event data:", JSON.stringify(event, null, 2));
        console.log("Webhook: Metadata:", JSON.stringify(meta, null, 2));
        console.log("Webhook: Products:", JSON.stringify(products, null, 2));
        console.log("Webhook: Amount:", amount);

        const orderId = await createOrder({
          orderNumber: reference,
          paystackReference: reference,
          paystackTransactionId: data.id?.toString() || `PAYSTACK-${reference}`,
          paystackCustomerId: data.customer?.id?.toString() || "",
          clerkUserId: meta.userId || meta.clerkUserId || "",
          customerName: meta.userName || meta.customerName || data.customer?.email || "Customer",
          email: data.customer?.email || meta.userEmail || "no-email@example.com",
          promoCode: meta.promoCode || null,
          products,
          totalPrice: amount,
          currency: "NGN",
          amountDiscount: meta.discount || 0,
          status: "paid",
          metadata: meta,
          aiAnalysis, // Include AI analysis if available
        });
        
        console.log(`Webhook: Order created successfully. ID: ${orderId}`);
        
      } catch (err) {
        console.error("Webhook: Failed creating order from webhook", err);
        // We still return 200 to Paystack so they don't retry indefinitely if it's a logic error on our side
        // But in a real app you might want to return 500 if it's a transient error
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook processing fatal error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Paystack webhook endpoint" });
}
