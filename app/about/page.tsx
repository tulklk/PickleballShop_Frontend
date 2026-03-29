import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description: "Giới thiệu IKA Sport — cửa hàng pickleball chính hãng tại Việt Nam.",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Giới thiệu IKA Sport</h1>
      <p className="mb-6 text-muted-foreground">
        IKA Sport chuyên cung cấp vợt, giày, bóng và phụ kiện pickleball chính hãng, giao hàng toàn
        quốc. Trang giới thiệu chi tiết đang được hoàn thiện.
      </p>
      <Link href="/" className="font-medium text-primary hover:underline">
        Về trang chủ
      </Link>
    </div>
  );
}
