import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const BASE_URL = "https://mpz.kr";
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.mpz.kr/v1/";
const IS_PROD = process.env.NEXT_PUBLIC_API_BASE_URL?.includes("api.mpz.kr") ?? true;

interface SitemapItem {
  id: string;
  updatedAt: string;
}

async function fetchAllAnimals(): Promise<SitemapItem[]> {
  try {
    const items: SitemapItem[] = [];
    let page = 1;
    const pageSize = 100;

    while (true) {
      const res = await fetch(
        `${API_URL}animals?page=${page}&page_size=${pageSize}&protection_status=보호중`,
        { next: { revalidate: 86400 } }
      );
      if (!res.ok) break;

      const data = await res.json();
      const animals = data.data || data.results || [];
      if (animals.length === 0) break;

      for (const animal of animals) {
        if (animal.id) {
          items.push({
            id: animal.id,
            updatedAt: animal.updated_at || animal.created_at || "",
          });
        }
      }

      if (animals.length < pageSize) break;
      page++;
    }

    return items;
  } catch {
    return [];
  }
}

async function fetchAllCenters(): Promise<SitemapItem[]> {
  try {
    const items: SitemapItem[] = [];
    let page = 1;
    const pageSize = 100;

    while (true) {
      const res = await fetch(
        `${API_URL}centers?page=${page}&page_size=${pageSize}`,
        { next: { revalidate: 86400 } }
      );
      if (!res.ok) break;

      const data = await res.json();
      const centers = data.data || data.results || [];
      if (centers.length === 0) break;

      for (const center of centers) {
        if (center.id) {
          items.push({
            id: center.id,
            updatedAt: center.updated_at || center.created_at || "",
          });
        }
      }

      if (centers.length < pageSize) break;
      page++;
    }

    return items;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // dev 환경에서는 빈 sitemap 반환 (SEO 차단)
  if (!IS_PROD) return [];

  const [animals, centers] = await Promise.all([
    fetchAllAnimals(),
    fetchAllCenters(),
  ]);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/list/animal`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/list/center`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/matching`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/event/centers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/community`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.6,
    },
  ];

  const animalPages: MetadataRoute.Sitemap = animals.map((item) => ({
    url: `${BASE_URL}/list/animal/${item.id}`,
    lastModified: item.updatedAt ? new Date(item.updatedAt) : now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const centerPages: MetadataRoute.Sitemap = centers.map((item) => ({
    url: `${BASE_URL}/list/center/${item.id}`,
    lastModified: item.updatedAt ? new Date(item.updatedAt) : now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...animalPages, ...centerPages];
}
