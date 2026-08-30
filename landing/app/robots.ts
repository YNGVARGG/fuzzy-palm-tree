import type { MetadataRoute } from "next"

// TODO (utilisateur) : remplacer par le vrai domaine du site.
const SITE_URL = "https://standard-ia.fr"

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
