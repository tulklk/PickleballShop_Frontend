import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chính sách nhượng quyền",
  description: "Thông tin nhượng quyền IKA Sport — nội dung đang được cập nhật.",
};

export default function FranchisePage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Chính sách nhượng quyền</h1>
      <p className="mb-6 text-muted-foreground">
        Trang đang được cập nhật. Vui lòng liên hệ hotline{" "}
        <a href="tel:+84824010188" className="font-medium text-primary underline">
          0824.01.01.88
        </a>{" "}
        để được tư vấn.
      </p>
      <Link href="/" className="font-medium text-primary hover:underline">
        Về trang chủ
      </Link>
    </div>
  );
}
