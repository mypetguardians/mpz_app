"use client";

import React from "react";
import { Container } from "./Container";
import { TopBar } from "./TopBar";
import { NavBar } from "./NavBar";

interface PageLayoutProps {
  children: React.ReactNode;
  topBar?: React.ReactNode;
  showNavBar?: boolean;
  className?: string;
}

/**
 * 공통 페이지 레이아웃.
 * TopBar(fixed) 아래 콘텐츠가 가려지지 않도록 자동 여백 처리.
 *
 * 사용법:
 * <PageLayout topBar={<TopBar left={...} />}>
 *   <div>콘텐츠</div>
 * </PageLayout>
 */
export function PageLayout({
  children,
  topBar,
  showNavBar = false,
  className,
}: PageLayoutProps) {
  return (
    <Container className={className}>
      {topBar}
      {children}
      {showNavBar && <NavBar />}
    </Container>
  );
}
