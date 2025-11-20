import { ProductGridSkeleton } from "@/components/shared/ProductSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-10 w-48 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar skeleton */}
        <aside className="lg:col-span-1">
          <div className="space-y-4 p-4 border border-emerald-100 rounded-lg bg-white/95">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </aside>
        {/* Products grid skeleton */}
        <div className="lg:col-span-3">
          <Skeleton className="h-5 w-48 mb-4" />
          <ProductGridSkeleton count={12} />
        </div>
      </div>
    </div>
  );
}

