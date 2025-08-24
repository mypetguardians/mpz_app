"use client";

import Link from "next/link";
import Image from "next/image";

import { Bell } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/IconButton";
import { TopBar } from "@/components/common/TopBar";

interface HomeHeaderProps {
  isLoggedIn: boolean;
}

export function HomeHeader({ isLoggedIn }: HomeHeaderProps) {
  return (
    <TopBar
      variant="primary"
      left={
        <Link href="/">
          <Image src="/illust/logo.svg" alt="logo" width={71} height={38} />
        </Link>
      }
      right={
        isLoggedIn ? (
          <Link href="/notifications">
            <IconButton
              icon={({ size }) => <Bell size={size} weight="bold" />}
              size="iconM"
            />
          </Link>
        ) : (
          <Link href="/login">
            <div className="flex items-center gap-2 cursor-pointer">
              <button>로그인</button>
            </div>
          </Link>
        )
      }
    />
  );
}
