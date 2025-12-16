"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";

type Order = {
  _id: string;
  orderNumber: string;
  status: string;
  totalPrice: number;
  amountDiscount: number;
  orderDate: string;
  products: Array<{
    quantity: number;
    productId: string;
    name: string;
    price: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    image?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    product: { _id: string; name: string; price: number; currency: string; image?: any } | null;
  }>;
};

export default function OrdersPage() {
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/orders?clerkUserId=${encodeURIComponent(user.id)}`);
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center py-12">
        <h1 className="text-2xl font-bold mb-4">My Orders</h1>
        <p className="text-gray-600 mb-4">Please sign in to view your orders.</p>
        <SignInButton mode="redirect">
          <button className="bg-blue-600 text-white px-6 py-2 rounded">Sign In</button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      <div className="space-y-4">
        {loading && <p>Loading orders…</p>}
        {!loading && orders && orders.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 mb-4">You have no orders yet.</p>
            <Link href="/">
              <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Continue Shopping</button>
            </Link>
          </div>
        )}

        {!loading && orders && orders.map((order) => {
          // const subtotal = (order.totalPrice || 0) + (order.amountDiscount || 0);
          return (
            <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600">Order</p>
                  <p className="text-xl font-bold">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500">{new Date(order.orderDate).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{order.status}</p>
                  <p className="text-lg font-bold">{order.totalPrice} NGN</p>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto mt-4 pb-2">
                {order.products?.map((product) => {
                  const image = product.image || product.product?.image;
                  if (!image) return null;
                  return (
                    <div key={product.productId} className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                      <Image
                        src={urlFor(image).url()}
                        alt={product.name || "Product Image"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">Items: {order.products?.length || 0}</div>
                <div className="text-sm text-gray-600">
                  Subtotal: {order.products.reduce((acc, item) => acc + (item.price || item.product?.price || 0) * (item.quantity || 1), 0)} NGN
                </div>
              </div>

              <div className="mt-4">
                <Link href={`/orders/${encodeURIComponent(order.orderNumber)}`}>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded">View details</button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
