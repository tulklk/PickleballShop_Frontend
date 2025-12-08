import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sản phẩm Pickleball",
  description: "Khám phá bộ sưu tập vợt Pickleball, giày Pickleball, bóng và phụ kiện chính hãng tại IKA Sport. Hàng ngàn sản phẩm chất lượng cao với giá tốt nhất.",
  openGraph: {
    title: "Sản phẩm Pickleball - IKA Sport",
    description: "Khám phá bộ sưu tập vợt Pickleball, giày Pickleball, bóng và phụ kiện chính hãng.",
    type: "website",
  },
  alternates: {
    canonical: "/products",
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

