import type { MetadataRoute } from "next"

export const dynamic = "force-static"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://standard-ia-dental.yonathanhenokg.chatgpt.site"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ]
}

