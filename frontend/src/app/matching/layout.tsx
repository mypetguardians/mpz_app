import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "나와 맞는 반려동물 찾기",
  description:
    "간단한 질문으로 나에게 딱 맞는 반려동물을 찾아보세요. 마펫쯔의 매칭 서비스가 도와드려요.",
  alternates: {
    canonical: "/matching",
  },
  openGraph: {
    title: "나와 맞는 반려동물 찾기",
    description:
      "간단한 질문으로 나에게 딱 맞는 반려동물을 찾아보세요. 마펫쯔의 매칭 서비스가 도와드려요.",
  },
};

export default function MatchingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
