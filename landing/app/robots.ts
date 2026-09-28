import type { MetadataRoute } from "next"

export const dynamic = "force-static"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://standard-ia-dental.yonathanhenokg.chatgpt.site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}

