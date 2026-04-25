import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { KakaoProvider } from "@/components/providers/KakaoProvider";
import { SocketProvider } from "@/components/providers/SocketProvider";
import KakaoMapScript from "@/components/common/KakaoMapScript";
import DaumPostcodeScript from "@/components/common/DaumPostcodeScript";
import { AppUrlHandler } from "@/components/common/AppUrlHandler";
import "./globals.css";
import { SafeAreaLayout } from "@/components/layouts/SafeAreaLayout";

// Pretendard Variable (CDN) — globals.css에서 @import
const fontConfig = { className: "font-sans" };

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://mpz.kr"),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "마펫쯔",
    template: "%s | 마펫쯔",
  },
  description:
    "유기견 입양은 마펫쯔! 전국 보호센터 유기동물 정보와 입양 절차를 한눈에 확인하세요.",
  keywords: [
    "마펫쯔",
    "유기동물",
    "유기견",
    "유기견 입양",
    "유기동물 입양",
    "강아지 입양",
    "반려동물 입양",
    "동물보호",
    "입양",
    "반려동물",
    "보호소",
    "동물보호센터",
    "강아지 훈련",
    "반려견 훈련",
    "강아지학교",
    "동물병원",
    "반려동물 관리",
  ],
  authors: [{ name: "마펫쯔" }],
  creator: "마펫쯔",
  publisher: "마펫쯔",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://mpz.kr",
    siteName: "마펫쯔",
    title: {
      default: "마펫쯔",
      template: "%s | 마펫쯔",
    },
    description:
      "유기견 입양은 마펫쯔! 전국 보호센터 유기동물 정보와 입양 절차를 한눈에 확인하세요.",
    images: [
      {
        url: "https://mpz.kr/img/op-image.png",
        width: 1200,
        height: 630,
        alt: "마펫쯔 - 반려동물 입양 플랫폼",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "마펫쯔",
      template: "%s | 마펫쯔",
    },
    description:
      "유기견 입양은 마펫쯔! 전국 보호센터 유기동물 정보와 입양 절차를 한눈에 확인하세요.",
    images: ["https://mpz.kr/img/op-image.png"],
    creator: "@mapetz_official",
  },
  verification: {
    google: "et4yYQxLZeD6XseRIZDMLB75vhxgbDnHPvKRTFKZQ9Q",
    other: {
      "naver-site-verification": "e7e171419ca7383b5ba6e5ed44a9b726fbbc2cea",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/img/op-image.png",
    shortcut: "/img/op-image.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "마펫쯔",
              url: "https://mpz.kr",
              logo: "https://mpz.kr/img/op-image.png",
              description:
                "유기견 입양은 마펫쯔! 전국 보호센터 유기동물 정보와 입양 절차를 한눈에 확인하세요.",
              sameAs: [],
            }),
          }}
        />
      </head>
      <body
        className={`${fontConfig.className} bg-wh max-w-[420px] mx-auto shadow-md `}
      >
        <QueryProvider>
          <AuthProvider>
            <KakaoProvider>
              <SocketProvider>
                <AppUrlHandler />
                <KakaoMapScript />
                <DaumPostcodeScript />
                <SafeAreaLayout>{children}</SafeAreaLayout>
              </SocketProvider>
            </KakaoProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
