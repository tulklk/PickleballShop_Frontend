import { MetadataRoute } from "next";

type ProductItem = {
  id: string;
  slug: string | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pickleballshop.com";
  const apiBaseUrl =
    (process.env.NEXT_PUBLIC_API_BASE_URL || "https://pickleballshop-backend.fly.dev").replace(/\/$/, "");
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Dynamic product pages - use slug for SEO-friendly URLs
  try {
    const allItems: ProductItem[] = [];
    let totalPages = 1;
    for (let page = 1; page <= Math.min(totalPages, 30); page++) {
      const response = await fetch(`${apiBaseUrl}/api/Products?Page=${page}&PageSize=100`, {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        if (page === 1) return staticPages;
        break;
      }
      const pageData = (await response.json()) as { items?: ProductItem[]; totalPages?: number };
      allItems.push(...(pageData?.items || []));
      totalPages = pageData?.totalPages || 1;
    }
    const productsData = { items: allItems };
    const productPages: MetadataRoute.Sitemap = (productsData?.items || []).map((product) => {
      // Use slug if available, fallback to ID
      const productSlug = product.slug || product.id;
      return {
        url: `${baseUrl}/products/${productSlug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      };
    });

    return [...staticPages, ...productPages];
  } catch {
    return staticPages;
  }
}

