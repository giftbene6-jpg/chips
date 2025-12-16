"use client";

import React from "react";
import { useCart } from "@/context/CartProvider";
import Image from "next/image";
import { imageUrl } from "@/lib/imageUrl";
import { useUser, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, totalItems, totalPrice, clearCart } = useCart();
  const { isSignedIn } = useUser();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Basket</h1>

      {items.length === 0 ? (
        <div className="py-12 text-center text-gray-600">
          Your basket is empty
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ul className="space-y-4">
              {items.map((it) => (
                <li key={it.product._id} className="flex items-start space-x-3 bg-white p-4 rounded shadow-sm">
                  <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative">
                    {it.product.image && (
                      <Image
                        src={imageUrl(it.product.image).url()}
                        alt={it.product.name || "Product image"}
                        width={80}
                        height={80}
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{it.product.name}</div>
                        <div className="text-sm text-gray-500">₦{(it.product.price ?? 0).toLocaleString("en-NG")}</div>
                        <div className="text-sm text-gray-700">Subtotal: ₦{((it.product.price ?? 0) * it.quantity).toLocaleString("en-NG")}</div>
                      </div>
                      <button onClick={() => removeFromCart(it.product._id)} className="text-red-500">🗑</button>
                    </div>

                    <div className="mt-2 flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(it.product._id, it.quantity - 1)}
                        className="px-2 py-1 border rounded"
                      >
                        -
                      </button>
                      <div className="px-3">{it.quantity}</div>
                      <button
                        onClick={() => updateQuantity(it.product._id, it.quantity + 1)}
                        className="px-2 py-1 border rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <aside className="bg-white p-4 rounded shadow-sm">
            <h4 className="font-semibold">Order Summary</h4>
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-600">Items ({totalItems})</span>
              <span className="font-medium">₦{totalPrice.toLocaleString("en-NG")}</span>
            </div>

            <div className="mt-4">
              {!isSignedIn ? (
                <div className="space-y-2">
                  <SignInButton mode="redirect">
                    <button className="w-full py-2 bg-blue-600 text-white rounded">Sign in to Checkout</button>
                  </SignInButton>
                  <button onClick={clearCart} className="w-full py-2 text-sm text-gray-600">Clear Basket</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/checkout">
                    <button className="w-full py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded font-semibold hover:shadow-lg transition">
                      Proceed to Checkout
                    </button>
                  </Link>
                  <button onClick={clearCart} className="w-full py-2 text-sm text-gray-600">Clear Basket</button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
