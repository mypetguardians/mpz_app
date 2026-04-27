import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "커뮤니티",
  description:
    "반려동물 입양 후기, 일상 이야기를 나눠보세요. 마펫쯔 커뮤니티에서 다른 보호자들과 소통해요.",
  alternates: {
    canonical: "/community",
  },
  openGraph: {
    title: "커뮤니티",
    description:
      "반려동물 입양 후기, 일상 이야기를 나눠보세요. 마펫쯔 커뮤니티에서 다른 보호자들과 소통해요.",
  },
};

export default function CommunityLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
