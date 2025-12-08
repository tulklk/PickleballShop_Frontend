import { MetadataRoute } from "next";
import { apiClient } from "@/lib/api/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pickleballshop.com";
  
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

  // Dynamic product pages
  try {
    const productsData = await apiClient.getProducts({ PageSize: 1000 });
    const productPages: MetadataRoute.Sitemap = (productsData?.items || []).map((product) => ({
      url: `${baseUrl}/products/${product.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticPages, ...productPages];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return staticPages;
  }
}

