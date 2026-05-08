import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/welcome", "/dashboard", "/admin", "/profile", "/links", "/payouts", "/agreements", "/catalog", "/offers"],
      },
    ],
    sitemap: "https://momfluence.app/sitemap.xml",
  };
}
