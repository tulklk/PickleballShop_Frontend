import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Liên hệ",
  description: "Liên hệ IKA Sport — hotline, email, địa chỉ.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Liên hệ</h1>
      <ul className="mb-6 space-y-3 text-muted-foreground">
        <li>
          <span className="font-medium text-foreground">Địa chỉ: </span>
          236 Mỹ Đình, Phường Mỹ Đình 2, Nam Từ Liêm, Hà Nội
        </li>
        <li>
          <span className="font-medium text-foreground">Hotline: </span>
          <a href="tel:+84824010188" className="text-primary underline">
            0824.01.01.88
          </a>
        </li>
        <li>
          <span className="font-medium text-foreground">Email: </span>
          <a href="mailto:support@ikasport.com" className="text-primary underline">
            support@ikasport.com
          </a>
        </li>
      </ul>
      <Link href="/" className="font-medium text-primary hover:underline">
        Về trang chủ
      </Link>
    </div>
  );
}
