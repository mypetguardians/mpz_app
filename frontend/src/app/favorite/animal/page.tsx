"use client";

import { Loading } from "@/components/common/Loading";
import { Suspense } from "react";
import { AnimalTab } from "../_components/AnimalTab";
import { FavoriteLayout } from "../_components/FavoriteLayout";

export default function FavoriteAnimalPage() {
  return (
    <Suspense fallback={<Loading fullScreen size="sm" />}>
      <FavoriteLayout>
        <AnimalTab />
      </FavoriteLayout>
    </Suspense>
  );
}
