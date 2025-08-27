"use client";

import { Suspense } from "react";
import { AnimalTab } from "../_components/AnimalTab";
import { ListLayout } from "../_components/ListLayout";

export default function AnimalPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <ListLayout>
        <AnimalTab />
      </ListLayout>
    </Suspense>
  );
}
