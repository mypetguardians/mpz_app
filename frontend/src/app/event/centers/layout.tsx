import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "이벤트 참여 센터",
  description:
    "마펫쯔 이벤트에 참여 중인 보호센터를 확인하세요. 특별 입양 행사와 할인 혜택 정보를 만나보세요.",
  alternates: {
    canonical: "/event/centers",
  },
  openGraph: {
    title: "이벤트 참여 센터 | 마펫쯔",
    description:
      "마펫쯔 이벤트에 참여 중인 보호센터를 확인하세요. 특별 입양 행사와 할인 혜택 정보를 만나보세요.",
  },
};

export default function EventCentersLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
