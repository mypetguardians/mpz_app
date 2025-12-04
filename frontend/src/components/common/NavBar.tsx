import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";
import { HouseSimple, Dog, Chats, Heart, User } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { CustomModal } from "../ui/CustomModal";

interface NavbarBtnProps {
  icon: React.ReactElement<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function NavbarBtn({
  icon,
  label,
  active = false,
  onClick,
}: NavbarBtnProps) {
  const iconWithColor = React.cloneElement(icon, {
    className: cn("w-5 h-5 transition-colors", active ? "text-dg" : "text-lg"),
  });

  return (
    <div
      className={cn(
        "flex flex-col gap-1 items-center justify-center w-full h-16 bg-wh cursor-pointer",
        active ? "text-dg" : "text-lg"
      )}
      onClick={onClick}
    >
      {iconWithColor}
      <h6
        className={cn(
          "text-xs font-medium cursor-pointer leading-tight",
          active && "text-dg"
        )}
      >
        {label}
      </h6>
    </div>
  );
}

function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const isCenter =
    user?.userType === "센터관리자" || user?.userType === "센터최고관리자";
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 현재 경로에 따라 active 탭 결정
  const getActiveTab = () => {
    if (pathname === "/") return "home";
    if (
      pathname.startsWith("/list/animal") ||
      pathname.startsWith("/list/center")
    )
      return "list";
    if (pathname.startsWith("/community")) return "commmunity";
    if (
      pathname.startsWith("/favorite/animal") ||
      pathname.startsWith("/favorite/center")
    )
      return "like";
    if (pathname.startsWith(isCenter ? "/centerpage" : "/my")) return "my";
    return "home";
  };

  const handleTabClick = (
    tab: "home" | "list" | "commmunity" | "like" | "my"
  ) => {
    let url = "";
    switch (tab) {
      case "home":
        url = "/";
        break;
      case "list":
        url = "/list/animal";
        break;
      case "commmunity":
        url = "/community";
        break;
      case "like":
        if (isAuthenticated) {
          url = "/favorite/animal";
        } else {
          setShowLoginModal(true);
          return;
        }
        break;
      case "my":
        if (isAuthenticated) {
          url = isCenter ? "/centerpage" : "/my";
        } else {
          setShowLoginModal(true);
          return;
        }
        break;
    }
    router.push(url);
  };

  return (
    <nav
      className="fixed bottom-0 max-w-[420px] mx-auto left-0 right-0 z-50 w-full bg-wh pb-safe-bottom"
      style={{
        pointerEvents: "auto",
      }}
    >
      <div className="max-w-[420px] mx-auto w-full bg-wh border-t border-lg">
        <div className="flex justify-between px-4">
          <NavbarBtn
            icon={<HouseSimple weight="bold" />}
            label="홈"
            active={getActiveTab() === "home"}
            onClick={() => handleTabClick("home")}
          />
          <NavbarBtn
            icon={<Dog weight="bold" />}
            label="입양"
            active={getActiveTab() === "list"}
            onClick={() => handleTabClick("list")}
          />
          <NavbarBtn
            icon={<Chats weight="bold" />}
            label="커뮤니티"
            active={getActiveTab() === "commmunity"}
            onClick={() => handleTabClick("commmunity")}
          />
          <NavbarBtn
            icon={<Heart weight="bold" />}
            label="찜"
            active={getActiveTab() === "like"}
            onClick={() => handleTabClick("like")}
          />
          <NavbarBtn
            icon={<User weight="bold" />}
            label="마이"
            active={getActiveTab() === "my"}
            onClick={() => handleTabClick("my")}
          />
        </div>
      </div>

      <CustomModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="로그인이 필요합니다"
        description="이 기능을 사용하려면 로그인이 필요합니다."
        variant="variant2"
        ctaText="카카오톡으로 로그인하기"
        onCtaClick={() => {
          setShowLoginModal(false);
          const currentUrl =
            typeof window !== "undefined"
              ? window.location.pathname + (window.location.search || "")
              : "/my";
          router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
        }}
        subLinkText="나중에 하기"
        onSubLinkClick={() => setShowLoginModal(false)}
      />
    </nav>
  );
}

export { NavBar };
