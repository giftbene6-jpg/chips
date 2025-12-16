import { backendClient } from "@/sanity/lib/backendClient";

export interface OrderData {
  orderNumber: string;
  paystackReference: string;
  paystackTransactionId: string;
  paystackCustomerId: string;
  clerkUserId: string;
  customerName: string;
  email: string;
  promoCode: string | null;
  products: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    image?: any;
  }[];
  totalPrice: number;
  currency: string;
  amountDiscount: number;
  status: string;
  orderDate?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
}

export async function createOrder(orderData: OrderData) {
  const { paystackReference } = orderData;

  // Idempotency check
  const existingOrder = await backendClient.fetch(
    `*[_type == "order" && paystackReference == $ref][0]`,
    { ref: paystackReference }
  );

  if (existingOrder) {
    console.log(`Order with reference ${paystackReference} already exists.`);
    return existingOrder._id;
  }

  const orderDoc = {
    _type: "order",
    orderNumber: orderData.orderNumber,
    paystackReference: orderData.paystackReference,
    paystackTransactionId: orderData.paystackTransactionId,
    paystackCustomerId: orderData.paystackCustomerId,
    clerkUserId: orderData.clerkUserId,
    customerName: orderData.customerName,
    email: orderData.email,
    promoCode: orderData.promoCode,
    products: orderData.products.map((p) => ({
      _key: p.productId,
      product: { _type: "reference", _ref: p.productId },
      quantity: p.quantity,
      price: p.price,
    })),
    totalPrice: orderData.totalPrice,
    currency: orderData.currency,
    amountDiscount: orderData.amountDiscount,
    status: orderData.status,
    orderDate: orderData.orderDate || new Date().toISOString(),
    metadata: orderData.metadata ? JSON.stringify(orderData.metadata) : undefined,
  };

  const createdOrder = await backendClient.create(orderDoc);
  console.log(`Created order ${createdOrder._id} for reference ${paystackReference}`);
  return createdOrder._id;
}
