"use client";

import { Loading } from "@/components/common/Loading";
import { Suspense } from "react";
import { AnimalTab } from "../_components/AnimalTab";
import { ListLayout } from "../_components/ListLayout";

export default function AnimalPage() {
  return (
    <Suspense fallback={<Loading fullScreen size="sm" />}>
      <ListLayout>
        <AnimalTab />
      </ListLayout>
    </Suspense>
  );
}
