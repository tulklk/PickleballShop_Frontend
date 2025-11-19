"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/shared/ProductGrid";
import { useFeaturedProducts, useCategories } from "@/lib/api/hooks";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Welcome to PickleBall Shop
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Discover premium PickleBall equipment, paddles, balls, and accessories
          for players of all skill levels.
        </p>
        <Link href="/products">
          <Button size="lg">Shop Now</Button>
        </Link>
      </section>

      {/* Featured Products */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Featured Products</h2>
        <FeaturedProducts />
      </section>

      {/* Categories Section */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Shop by Category</h2>
        <CategoriesGrid />
      </section>
    </div>
  );
}

function FeaturedProducts() {
  const { data: products, isLoading } = useFeaturedProducts(8);

  if (isLoading) {
    return <div className="text-center py-8">Loading featured products...</div>;
  }

  if (!products || products.length === 0) {
    return <div className="text-center py-8">No featured products available.</div>;
  }

  return <ProductGrid products={products} />;
}

function CategoriesGrid() {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return <div className="text-center py-8">Loading categories...</div>;
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/products?categoryId=${category.id}`}
          className="group"
        >
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h3 className="font-semibold text-lg mb-2 group-hover:text-primary">
              {category.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {category.productCount} products
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

