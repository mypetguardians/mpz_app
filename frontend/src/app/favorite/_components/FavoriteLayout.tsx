"use client";

import { usePathname } from "next/navigation";
import { Bell } from "@phosphor-icons/react";
import Link from "next/link";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { TabButton } from "@/components/ui/TabButton";
import { NavBar } from "@/components/common/NavBar";

interface FavoriteLayoutProps {
  children: React.ReactNode;
}

export function FavoriteLayout({ children }: FavoriteLayoutProps) {
  const pathname = usePathname();

  // 현재 경로에서 활성 탭 결정
  const activeTab = pathname.includes("/center") ? "center" : "animal";

  const tabs = [
    { label: "동물", value: "animal", href: "/favorite/animal" },
    { label: "보호센터", value: "center", href: "/favorite/center" },
  ];

  return (
    <Container className="min-h-screen pb-20">
      <TopBar
        variant="variant4"
        left={<h4>찜</h4>}
        right={
          <Link href="/notifications">
            <IconButton
              icon={({ size }) => <Bell size={size} weight="bold" />}
              size="iconM"
            />
          </Link>
        }
      />

      {/* 탭 버튼 */}
      <div className="mb-4">
        <TabButton
          value={activeTab}
          tabs={tabs}
          variant="variant3"
          useLinks={true}
        />
      </div>

      {/* 메인 콘텐츠 */}
      {children}

      <NavBar />
    </Container>
  );
}
