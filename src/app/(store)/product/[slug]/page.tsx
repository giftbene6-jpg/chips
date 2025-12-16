import { getProductBySlug } from "@/sanity/lib/products/getProductBySlug";
// import Image from "next/image";
import { notFound } from "next/navigation";

import ProductImageGallery from "@/components/ProductImageGallery";
import AddToBasketButton from "@/components/AddToBasketButton";

async function Page ({
  params,
}: { 
  params: Promise<{
     slug: string;
    }>;
  }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if(!product) {
    console.log("product: ", product)
    return notFound();
  }
  const isOutOfStock = product.stock != null && product.stock <= 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ProductImageGallery product={product} />
        
        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            <div className="text-xl font-semibold mb-4">
              ₦{(product.price ?? 0).toLocaleString("en-NG")}
            </div>

            <div className="mb-6">
                <AddToBasketButton product={product} disabled={isOutOfStock} />
            </div>


            
            <div className="mt-6">{product.description}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page