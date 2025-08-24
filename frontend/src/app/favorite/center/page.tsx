"use client";

import { Suspense } from "react";
import { CenterTab } from "../_components/CenterTab";
import { FavoriteLayout } from "../_components/FavoriteLayout";

export default function FavoriteCenterPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <FavoriteLayout>
        <CenterTab />
      </FavoriteLayout>
    </Suspense>
  );
}
