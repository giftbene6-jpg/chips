"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Order = {
  _id: string;
  orderNumber: string;
  status: string;
  totalPrice: number;
  amountDiscount: number;
  orderDate: string;
  currency?: string;
  promoCode?: string;
  paystackReference?: string;
  paystackTransactionId?: string;
  products: Array<{
    quantity: number;
    price: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    product: { _id: string; name: string; price: number; currency: string; image?: any } | null;
  }>;
  customerName?: string;
  email?: string;
};

export default function OrderDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(id)}`);
        const data = await res.json();
        setOrder(data.order || null);
      } catch (err) {
        console.error("Failed to fetch order", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  if (loading) return <div className="p-4">Loading…</div>;

  if (!order) return (
    <div className="max-w-4xl mx-auto p-4">
      <p>Order not found.</p>
      <Link href="/orders"><button className="bg-blue-600 text-white px-4 py-2 rounded">Back to Orders</button></Link>
    </div>
  );

  const subtotal = (order.totalPrice || 0) + (order.amountDiscount || 0);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Order Details</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-gray-600 text-sm">Order Number</p>
            <p className="text-lg font-bold text-gray-800">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Order Date</p>
            <p className="text-lg font-bold text-gray-800">{new Date(order.orderDate).toLocaleDateString()}</p>
          </div>
        </div>

        {order.paystackReference && (
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <p className="text-gray-600 text-sm">Paystack Reference</p>
            <p className="font-mono text-sm">{order.paystackReference}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-gray-600 text-sm">Status</p>
            <p className="font-semibold text-lg capitalize">{order.status}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Customer</p>
            <p>{order.customerName || order.email}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 text-sm font-semibold mb-3">Items Purchased</p>
          <div className="border rounded p-4 space-y-2">
            {order.products.map((p, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-gray-800">{p.product ? p.product.name : "Product"} × {p.quantity}</span>
                <span className="font-semibold">{p.price * p.quantity} {p.product?.currency || "NGN"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold">{subtotal} {order.currency || "NGN"}</span>
          </div>
          {order.promoCode && (
            <div className="flex justify-between mb-2 text-green-600">
              <span>Promo Code: <span className="font-semibold">{order.promoCode}</span></span>
            </div>
          )}
          {order.amountDiscount > 0 && (
            <div className="flex justify-between mb-2 text-green-600">
              <span>Discount Applied</span>
              <span className="font-semibold">-{order.amountDiscount} {order.currency || "NGN"}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between text-lg">
            <span className="font-bold">Total Amount</span>
            <span className="font-bold text-xl">{order.totalPrice} {order.currency || "NGN"}</span>
          </div>
        </div>

        <Link href="/orders">
          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Back to Orders</button>
        </Link>
      </div>
    </div>
  );
}
