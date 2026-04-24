import { MetadataRoute } from "next";

const BASE_URL = "https://mpz.kr";
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.mpz.kr/v1/";
const IS_PROD = process.env.NEXT_PUBLIC_API_BASE_URL?.includes("api.mpz.kr") ?? true;

async function fetchAllAnimals(): Promise<string[]> {
  try {
    const ids: string[] = [];
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
        if (animal.id) ids.push(animal.id);
      }

      if (animals.length < pageSize) break;
      page++;
    }

    return ids;
  } catch {
    return [];
  }
}

async function fetchAllCenters(): Promise<string[]> {
  try {
    const ids: string[] = [];
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
        if (center.id) ids.push(center.id);
      }

      if (centers.length < pageSize) break;
      page++;
    }

    return ids;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // dev 환경에서는 빈 sitemap 반환 (SEO 차단)
  if (!IS_PROD) return [];

  const [animalIds, centerIds] = await Promise.all([
    fetchAllAnimals(),
    fetchAllCenters(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/list/animal`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/list/center`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/matching`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/event/centers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/community`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
  ];

  const animalPages: MetadataRoute.Sitemap = animalIds.map((id) => ({
    url: `${BASE_URL}/list/animal/${id}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const centerPages: MetadataRoute.Sitemap = centerIds.map((id) => ({
    url: `${BASE_URL}/list/center/${id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...animalPages, ...centerPages];
}
