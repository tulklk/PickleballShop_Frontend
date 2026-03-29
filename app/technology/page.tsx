import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Công nghệ sản phẩm",
  description: "Công nghệ sản phẩm pickleball tại IKA Sport.",
};

export default function TechnologyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Công nghệ sản phẩm</h1>
      <p className="mb-6 text-muted-foreground">
        Nội dung đang được cập nhật. Xem thêm sản phẩm và tin tức trên cửa hàng.
      </p>
      <Link href="/products" className="font-medium text-primary hover:underline">
        Xem sản phẩm
      </Link>
    </div>
  );
}
