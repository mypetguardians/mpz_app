import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { KakaoProvider } from "@/components/providers/KakaoProvider";
import { SocketProvider } from "@/components/providers/SocketProvider";
import KakaoMapScript from "@/components/common/KakaoMapScript";
import DaumPostcodeScript from "@/components/common/DaumPostcodeScript";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "마펫즈",
    template: "%s | 마펫즈",
  },
  description:
    "전국 유기동물 보호센터 정보와 입양 절차를 한눈에 확인하기! 반려동물 입양 플랫폼",
  keywords: [
    "유기동물",
    "반려동물 입양",
    "강아지 입양",
    "고양이 입양",
    "동물보호센터",
    "펫 매칭",
    "AI 반려동물 추천",
    "마펫즈",
  ],
  authors: [{ name: "마펫즈" }],
  creator: "마펫즈",
  publisher: "마펫즈",
  metadataBase: new URL(
    "https://mpz.kr"
  ),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    title: "마펫즈",
    description:
      "전국 유기동물 보호센터 정보와 입양 절차를 한눈에 확인하기! 반려동물 입양 플랫폼",
    siteName: "마펫즈",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "마펫즈",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "마펫즈",
    description:
      "전국 유기동물 보호센터 정보와 입양 절차를 한눈에 확인하기! 반려동물 입양 플랫폼",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
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
  verification: {
    // Google Search Console 인증 코드 (추후 추가)
    // google: 'your-google-verification-code',
    // Naver Search Advisor 인증 코드 (추후 추가)
    // other: {
    //   'naver-site-verification': 'your-naver-verification-code',
    // },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${inter.className} min-h-screen bg-dg`}>
        <DaumPostcodeScript />
        <KakaoProvider />
        <KakaoMapScript />
        <QueryProvider>
          <AuthProvider>
            <SocketProvider>{children}</SocketProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
