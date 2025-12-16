"use client";

import React, { useState } from "react";
import Image from "next/image";
import { imageUrl } from "@/lib/imageUrl";
import { Product } from "../../sanity.types";

interface ProductImageGalleryProps {
  product: Product;
}

interface MediaItem {
  type: 'image' | 'video';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  asset: any;
  alt?: string;
}


const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ product }) => {
  const [selectedImage, setSelectedImage] = useState(product.image);
  const [selectedType, setSelectedType] = useState<'image' | 'video'>('image');

  // Combine main image with gallery items
  const mainImageItem = product.image ? { type: 'image' as const, asset: product.image } : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const galleryItems = (product as any).gallery || [];
  
  // Create array of all media items (main image + gallery)
  const allMediaItems = [
    ...(mainImageItem ? [mainImageItem] : []),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...galleryItems.map((item: any) => {
      // Check if it's an image or video based on the asset type
      if (item && '_type' in item) {
        return {
          type: item._type === 'image' ? 'image' as const : 'video' as const,
          asset: item,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          alt: (item as any).alt
        };
      }
      return null;
    }).filter(Boolean)
  ] as MediaItem[];

  // Fill remaining slots with placeholders if less than 4 items
  const totalSlots = 4;
  const emptySlots = Math.max(0, totalSlots - allMediaItems.length);

  const handleMediaClick = (item: MediaItem) => {
    if (item.type === 'image') {
      setSelectedImage(item.asset);
      setSelectedType('image');
    } else {
      setSelectedImage(item.asset);
      setSelectedType('video');
    }
  };

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails - Vertical on desktop, horizontal on mobile */}
      <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:w-24 md:h-[500px] scrollbar-hide">
        {allMediaItems.map((item: MediaItem, index) => (
          <button
            key={index}
            onClick={() => handleMediaClick(item)}
            className={`relative w-20 h-20 flex-shrink-0 border-2 rounded-md overflow-hidden ${
              selectedImage === item.asset ? "border-blue-500" : "border-transparent hover:border-gray-300"
            } transition-colors`}
          >
            {item.type === 'image' && item.asset && (
              <Image
                src={imageUrl(item.asset).url()}
                alt={item.alt || `Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            )}
            {item.type === 'video' && item.asset && (
              <div className="relative w-full h-full bg-gray-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            )}
          </button>
        ))}
        {/* Empty slot placeholders */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div 
            key={`placeholder-${i}`} 
            className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-400 flex-shrink-0 border-2 border-dashed border-gray-300"
          >
            Slot {allMediaItems.length + i + 1}
          </div>
        ))}
      </div>

      {/* Main Display Area */}
      <div className="relative flex-1 aspect-square md:aspect-auto md:h-[500px] overflow-hidden rounded-lg bg-gray-50">
        {selectedType === 'image' && selectedImage && (
          <Image
            src={imageUrl(selectedImage).url()}
            alt={product.name ?? "Product image"}
            fill
            className="object-contain transition-transform duration-300 hover:scale-105"
          />
        )}
        {selectedType === 'video' && selectedImage && (
          <video
            controls
            className="w-full h-full object-contain"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            src={(selectedImage as any).asset?.url}
          >
            Your browser does not support the video tag.
          </video>
        )}
        {product.stock != null && product.stock <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <span className="text-white font-bold text-lg">Out of Stock</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProductImageGallery;
