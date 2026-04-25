import type { Metadata } from "next";
import CommunityPostClient from "./_components/CommunityPostClient";

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
    const res = await fetch(`${API_URL}posts/all/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return {};

    const data = await res.json();
    const post = data.post;
    if (!post) return {};

    const title = post.title || "커뮤니티 게시글";
    const contentPreview = post.content
      ? post.content.length > 100
        ? post.content.substring(0, 100).replace(/\n/g, " ") + "..."
        : post.content.replace(/\n/g, " ")
      : "마펫쯔 커뮤니티에서 반려동물 이야기를 나눠보세요";

    const imageUrl =
      data.images?.[0]?.image_url || "https://mpz.kr/img/op-image.png";

    return {
      title,
      description: contentPreview,
      alternates: {
        canonical: `/community/${id}`,
      },
      openGraph: {
        title: `${title} | 마펫쯔`,
        description: contentPreview,
        images: [{ url: imageUrl, width: 800, height: 800, alt: title }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | 마펫쯔`,
        description: contentPreview,
        images: [imageUrl],
      },
    };
  } catch {
    return {};
  }
}

export default async function CommunityPostPage() {
  return <CommunityPostClient />;
}
