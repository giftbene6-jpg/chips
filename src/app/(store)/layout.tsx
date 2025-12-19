import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SanityLive } from "@/sanity/lib/live";
import { CartProvider } from "@/context/CartProvider";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "IFYBEST - Premium Luxury Store",
  description: "Exquisite and sophisticated e-commerce experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <ClerkProvider dynamic>
          <CartProvider>
            <main>
              <Header/>
              {children}
            </main>
            <SanityLive />
            <Footer />
          </CartProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
