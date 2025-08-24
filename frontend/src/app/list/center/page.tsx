"use client";

import { Suspense } from "react";
import { CenterTab } from "../_components/CenterTab";
import { ListLayout } from "../_components/ListLayout";

export default function CenterPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <ListLayout>
        <CenterTab />
      </ListLayout>
    </Suspense>
  );
}
