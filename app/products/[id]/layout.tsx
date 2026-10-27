import type { Metadata } from "next";
import { apiClient } from "@/lib/api/client";
import { DEBUG_API } from "@/lib/utils/debugApi";
import { isUUID, extractIdFromSlug } from "@/lib/utils/productUrl";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id: identifier } = await params;
    const isSlug = !isUUID(identifier);
    
    let product = null;

    if (isSlug) {
      try {
        product = await apiClient.getProductBySlug(identifier);
      } catch (err) {
        const fallbackId = extractIdFromSlug(identifier);
        if (fallbackId) {
          product = await apiClient.getProductById(fallbackId);
        } else {
          throw err;
        }
      }
    } else {
      product = await apiClient.getProductById(identifier);
    }
    
    if (!product) {
      return {
        title: "Sản phẩm không tồn tại",
      };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pickleballshop.com";
    // Use slug URL for SEO, fallback to ID if slug not available
    const productSlug = product.slug || identifier;
    const productUrl = `${siteUrl}/products/${productSlug}`;
    const imageUrl = product.primaryImageUrl || `${siteUrl}/img/logopickleball.png`;
    const price = product.hasVariants && product.variants && product.variants.length > 0
      ? Math.min(...product.variants.map(v => v.price))
      : product.price;
    const originalPrice = product.hasVariants && product.variants && product.variants.length > 0
      ? product.variants[0].originalPrice || null
      : product.originalPrice;

    const description = product.description 
      ? `${product.description.substring(0, 160)}...`
      : `Mua ${product.name} chính hãng tại IKA Sport. Giá tốt nhất, giao hàng toàn quốc.`;

    return {
      title: `${product.name} - IKA Sport`,
      description,
      keywords: [
        product.name || "",
        product.brand || "",
        product.productType || "",
        "pickleball",
        "vợt pickleball",
        "mua pickleball",
      ].filter(Boolean),
      openGraph: {
        title: `${product.name} - IKA Sport`,
        description,
        url: productUrl,
        siteName: "IKA Sport",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: product.name || "Sản phẩm Pickleball",
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.name} - IKA Sport`,
        description,
        images: [imageUrl],
      },
      alternates: {
        canonical: productUrl,
      },
      other: {
        "product:price:amount": price.toString(),
        "product:price:currency": "VND",
        ...(originalPrice && {
          "product:original_price:amount": originalPrice.toString(),
          "product:original_price:currency": "VND",
        }),
        "product:availability": product.stockQuantity > 0 ? "in stock" : "out of stock",
        "product:condition": "new",
        "product:brand": product.brand || "IKA Sport",
      },
    };
  } catch (error) {
    if (DEBUG_API) {
      console.error("Error generating product metadata:", error);
    }
    return {
      title: "Sản phẩm",
    };
  }
}

export default function ProductDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

