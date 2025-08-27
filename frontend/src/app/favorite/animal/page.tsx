"use client";

import { Suspense } from "react";
import { AnimalTab } from "../_components/AnimalTab";
import { FavoriteLayout } from "../_components/FavoriteLayout";

export default function FavoriteAnimalPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <FavoriteLayout>
        <AnimalTab />
      </FavoriteLayout>
    </Suspense>
  );
}
