import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "입양 가능한 유기동물",
  description:
    "전국 보호센터의 입양 가능한 유기동물을 확인하세요. 강아지, 고양이 등 새 가족을 찾는 아이들이 기다리고 있어요.",
  alternates: {
    canonical: "/list/animal",
  },
  openGraph: {
    title: "입양 가능한 유기��물",
    description:
      "전국 보호센터의 입양 가능한 유기동물을 확인하세요. 새 가족을 찾는 아이들이 기다리고 있어요.",
  },
};

export default function AnimalListLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
