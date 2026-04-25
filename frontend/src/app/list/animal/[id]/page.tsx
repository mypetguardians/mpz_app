import type { Metadata } from "next";
import AnimalDetailClient from "./_components/AnimalDetailClient";

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.mpz.kr/v1/";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${API_URL}animals/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return {};

    const animal = await res.json();
    const breed = animal.breed || "유기동물";
    const name = animal.name || "";
    const ageMonths = animal.age || 0;
    const ageText =
      ageMonths < 12
        ? `${ageMonths}개월`
        : `${Math.floor(ageMonths / 12)}살 추정`;
    const title = name ? `${name} (${breed})` : breed;
    const description = `${breed} · ${ageText} · ${animal.is_female ? "암컷" : "수컷"} — 마펫쯔에서 만나보세요`;

    const imageUrl =
      animal.animal_images?.[0]?.image_url || "https://mpz.kr/img/op-image.png";

    return {
      title,
      description,
      alternates: {
        canonical: `/list/animal/${id}`,
      },
      openGraph: {
        title: `${title} | 마펫쯔`,
        description,
        images: [{ url: imageUrl, width: 800, height: 800, alt: title }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | 마펫쯔`,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    return {};
  }
}

async function getAnimalData(id: string) {
  try {
    const res = await fetch(`${API_URL}animals/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function AnimalDetailPage({ params }: PageProps) {
  const { id } = await params;
  const animal = await getAnimalData(id);

  const jsonLd = animal
    ? {
        "@context": "https://schema.org",
        "@type": "Thing",
        name: animal.name || animal.breed || "유기동물",
        description: `${animal.breed || "유기동물"} · ${animal.age < 12 ? `${animal.age}개월` : `${Math.floor(animal.age / 12)}살 추정`} · ${animal.is_female ? "암컷" : "수컷"}`,
        image: animal.animal_images?.[0]?.image_url,
        url: `https://mpz.kr/list/animal/${id}`,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <AnimalDetailClient id={id} />
    </>
  );
}
