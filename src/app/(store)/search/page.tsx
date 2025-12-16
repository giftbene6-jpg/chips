
import ProductsView from "@/components/ProductsView";
import { searchProductsByName } from "@/sanity/lib/products/searchProductsByName";
import { getAllCategories } from "@/sanity/lib/products/getAllCategories";




async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    query?: string;
    category?: string;
  }>;
}) {
  const { query, category } = await searchParams;
  const products = await searchProductsByName(query, category);
  const categories = await getAllCategories();

  return (
    <div className="flex flex-col items-center justify-top min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-4xl">
        <h1 className="text-2xl font-bold mb-4">Search results for {query}</h1>
        {products.length === 0 ? (
          <div className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">No products found</h2>
            <p className="text-gray-600">Try different keywords or select another category.</p>
          </div>
        ) : (
          <ProductsView products={products} categories={categories} />
        )}
      </div>
    </div>
  );
  
}

export default  Page;

