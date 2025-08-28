import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";
import { Container } from "./Container";
import { HouseSimple, Dog, Chats, Heart, User } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

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
        "flex flex-col gap-0.5 items-center justify-center w-full h-14 cursor-pointer",
        active ? "text-dg" : "text-lg"
      )}
      onClick={onClick}
    >
      {iconWithColor}
      <h6
        className={cn(
          "text-sm font-medium cursor-pointer",
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

  // 현재 경로에 따라 active 탭 결정
  const getActiveTab = () => {
    if (pathname === "/") return "home";
    if (pathname.startsWith("/list/animal")) return "list";
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
        url = "/favorite/animal";
        break;
      case "my":
        url = isAuthenticated ? (isCenter ? "/centerpage" : "/my") : "/login";
        break;
    }
    router.push(url);
  };

  return (
    <nav
      className="
      fixed bottom-0 left-0 w-full
      z-50
      bg-transparent
    "
      style={{ pointerEvents: "auto" }}
    >
      <Container className="bg-wh border-t border-gray-200 rounded-t-xl">
        <div className="flex justify-between px-2">
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
      </Container>
    </nav>
  );
}

export { NavBar };
