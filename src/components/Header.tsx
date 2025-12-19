"use client"

import { ClerkLoaded, SignedIn, SignInButton, UserButton, useUser } from "@clerk/nextjs"
import Link from "next/link";
import { useCart } from "@/context/CartProvider";
import { PackageIcon, TrolleyIcon, SearchIcon } from "@sanity/icons";





function Header() {
/**
TO KNOW IF USER IS LOGGED IN
 */
  const {user} = useUser();
  const { totalItems } = useCart();


  return (
    <header className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-[#D4AF37]/20 px-8 py-5 flex flex-wrap justify-between items-center transition-all duration-500">
      {/* Brand Section */}
      <Link 
        href="/"
        className="text-4xl font-serif tracking-widest lux-gradient-text hover:scale-105 transition-all duration-500 mx-auto sm:mx-0 font-medium"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        IFYBEST
      </Link>

      {/* Search Bar */}
      <form action="/search" method="GET" className="w-full sm:w-auto sm:flex-1 sm:mx-12 mt-5 sm:mt-0">
        <div className="relative group">
          <input 
            name="query" 
            type="text" 
            placeholder="Search our collection..." 
            className="w-full bg-[#FDFCFA] border border-[#D4AF37]/10 px-6 py-3 rounded-none text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 transition-all duration-500 tracking-wide italic" 
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors">
            <SearchIcon className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Navigation & User Area */}
      <div className="flex items-center space-x-8 mt-5 sm:mt-0">
        <Link
          href="/basket"
          className="relative flex items-center space-x-2 text-gray-800 hover:text-[#D4AF37] transition-all duration-500"
        >
          <div className="relative">
            <TrolleyIcon className="w-6 h-6"/>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#D4AF37] text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-xs font-medium tracking-[0.2em] uppercase hidden sm:block">Basket</span>
        </Link>

        {/* user area */}
        <ClerkLoaded>
          <SignedIn>
            <Link href="/orders" className="flex items-center space-x-2 text-gray-800 hover:text-[#D4AF37] transition-all duration-500">
              <PackageIcon className="w-6 h-6"/>
              <span className="text-xs font-medium tracking-[0.2em] uppercase hidden sm:block">Orders</span>
            </Link>
          </SignedIn>

          {user ? (
            <div className="flex items-center space-x-4 border-l border-[#D4AF37]/10 pl-8">
              <UserButton appearance={{ 
                elements: { 
                  userButtonAvatarBox: "w-10 h-10 border border-[#D4AF37]/20 p-0.5" 
                } 
              }} />
            </div>
          ) : (
            <div className="border-l border-[#D4AF37]/10 pl-8">
              <SignInButton mode="modal">
                <button className="classic-button !py-2.5 !px-8 !text-[10px]">Sign In</button>
              </SignInButton>
            </div>
          )}
        </ClerkLoaded>
      </div>
    </header>
  );
}

export default Header