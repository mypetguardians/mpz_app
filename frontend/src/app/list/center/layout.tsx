import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "동물 보호센터",
  description:
    "전국 동물 보호센터 정보를 한눈에 확인하세요. 보호센터 위치, 연락처, 보호 동물 현황을 제공해요.",
  alternates: {
    canonical: "/list/center",
  },
  openGraph: {
    title: "동물 보호센터 | 마펫쯔",
    description:
      "전국 동물 보호센터 정보를 한눈에 확인하세요. 보호센터 위치, 연락처, 보호 동물 현황을 제공해요.",
  },
};

export default function CenterListLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
