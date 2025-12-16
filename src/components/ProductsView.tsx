
import {  Category, Product } from "../../sanity.types";
import ProductGrid from "./ProductGrid";
import { CategorySelectorComponent } from "./category-selector";
interface ProductsViewProps {
  products: Product[];
  categories: Category[];
}

const ProductsView = ({ products, categories }: ProductsViewProps) => {
  return (
  <div className="flex flex-col">
    {/*categories */}
    <div className="flex items-center justify-between w-full mb-4">
      <h2 className="text-xl font-semibold">Products</h2>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <CategorySelectorComponent categories={categories as any} />
    </div>

    {/*products */}
    <div className="flex-1">
      <div>
        <ProductGrid products={products}/>
      </div>
      <hr className="w-1/2 sm:w-3/4"/>
    </div>
  </div>
  );
};

export default ProductsView;