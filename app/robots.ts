import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pickleballshop.com";
  
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/account/",
          "/api/",
          "/checkout/",
          "/payments/",
          "/cart",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

