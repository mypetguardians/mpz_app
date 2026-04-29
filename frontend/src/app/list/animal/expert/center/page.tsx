"use client";

import { Loading } from "@/components/common/Loading";
import { Suspense } from "react";
import { CenterTab } from "../_components/CenterTab";
import { ListLayout } from "../_components/ListLayout";

export default function CenterPage() {
  return (
    <Suspense fallback={<Loading fullScreen size="sm" />}>
      <ListLayout>
        <CenterTab />
      </ListLayout>
    </Suspense>
  );
}
