import type { MetadataRoute } from "next"

// TODO (utilisateur) : remplacer par le vrai domaine du site.
const SITE_URL = "https://standard-ia.fr"

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
