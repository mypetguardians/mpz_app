import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { KakaoProvider } from "@/components/providers/KakaoProvider";
import { SocketProvider } from "@/components/providers/SocketProvider";
import KakaoMapScript from "@/components/common/KakaoMapScript";
import DaumPostcodeScript from "@/components/common/DaumPostcodeScript";
import "./globals.css";

// 시스템 폰트 사용
const inter = { className: "font-sans" };

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
    default: "마펫쯔",
    template: "%s | 마펫쯔",
  },
  description:
    "전국 유기동물 보호센터 정보와 입양 절차를 한눈에 확인하기! 반려동물 입양 플랫폼",
  keywords: [
    "마펫쯔",
    "유기동물",
    "동물보호",
    "입양",
    "반려동물",
    "보호소",
    "동물병원",
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
    url: "https://mapetz.com",
    siteName: "마펫쯔",
    title: {
      default: "마펫쯔",
      template: "%s | 마펫쯔",
    },
    description:
      "전국 유기동물 보호센터 정보와 입양 절차를 한눈에 확인하기! 반려동물 입양 플랫폼",
    images: [
      {
        url: "/og-image.jpg",
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
      "전국 유기동물 보호센터 정보와 입양 절차를 한눈에 확인하기! 반려동물 입양 플랫폼",
    images: ["/og-image.jpg"],
    creator: "@mapetz_official",
  },
  verification: {
    google: "google-site-verification-code",
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
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <KakaoProvider>
              <SocketProvider>
                <KakaoMapScript />
                <DaumPostcodeScript />
                {children}
              </SocketProvider>
            </KakaoProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
