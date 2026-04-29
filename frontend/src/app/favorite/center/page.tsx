"use client";

import { Loading } from "@/components/common/Loading";
import { Suspense } from "react";
import { CenterTab } from "../_components/CenterTab";
import { FavoriteLayout } from "../_components/FavoriteLayout";

export default function FavoriteCenterPage() {
  return (
    <Suspense fallback={<Loading fullScreen size="sm" />}>
      <FavoriteLayout>
        <CenterTab />
      </FavoriteLayout>
    </Suspense>
  );
}
