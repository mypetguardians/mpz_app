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

export const metadata: Metadata = {
  title: "마펫즈",
  description: "컴팩트한 유기동물 입양",
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
