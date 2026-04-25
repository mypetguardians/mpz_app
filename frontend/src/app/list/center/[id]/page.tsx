import type { Metadata } from "next";
import CenterDetailClient from "./_components/CenterDetailClient";

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
    const res = await fetch(`${API_URL}centers/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return {};

    const center = await res.json();
    const name = center.name || "보호센터";
    const region = center.region || "";
    const description = center.description
      ? `${center.description.slice(0, 100)}${center.description.length > 100 ? "..." : ""}`
      : `${name} — 마펫쯔에서 보호센터 정보를 확인하세요`;
    const title = region ? `${name} (${region})` : name;
    const imageUrl = center.image_url || "https://mpz.kr/img/op-image.png";

    return {
      title,
      description,
      alternates: {
        canonical: `/list/center/${id}`,
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

async function getCenterData(id: string) {
  try {
    const res = await fetch(`${API_URL}centers/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function CenterDetailPage({ params }: PageProps) {
  const { id } = await params;
  const center = await getCenterData(id);

  const jsonLd = center
    ? {
        "@context": "https://schema.org",
        "@type": "AnimalShelter",
        name: center.name,
        description: center.description,
        image: center.image_url,
        url: `https://mpz.kr/list/center/${id}`,
        address: center.location
          ? {
              "@type": "PostalAddress",
              addressLocality: center.region,
              streetAddress: center.location,
            }
          : undefined,
        telephone: center.phone_number,
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
      <CenterDetailClient id={id} />
    </>
  );
}
