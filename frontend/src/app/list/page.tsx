"use client";

import { Loading } from "@/components/common/Loading";
import { Suspense } from "react";
import { AnimalTab } from "./_components";

export default function ListPage() {
  return (
    <div className="min-h-screen">
      {/* 탭 네비게이션 등 서버 컴포넌트 */}
      <div className="tabs">
        <button className="tab-active">동물</button>
        <button>보호소</button>
      </div>

      <Suspense fallback={<Loading fullScreen size="sm" />}>
        <AnimalTab />
      </Suspense>

      {/* <CenterTab /> */}
    </div>
  );
}
