"use client";

import { Loading } from "@/components/common/Loading";
import { Suspense, useEffect } from "react";
import { CenterTab } from "../_components/CenterTab";
import { ListLayout } from "../_components/ListLayout";

export default function CenterPage() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const ref = document.referrer;
      if (ref) {
        const url = new URL(ref);
        const sameOrigin = url.origin === window.location.origin;
        const isListPath = url.pathname.startsWith("/list");
        if (sameOrigin && !isListPath) {
          sessionStorage.setItem(
            "mpz:lastNonListPath",
            url.pathname + url.search
          );
        }
      }
    } catch {
      // noop
    }
  }, []);
  return (
    <Suspense fallback={<Loading fullScreen size="sm" />}>
      <ListLayout>
        <CenterTab />
      </ListLayout>
    </Suspense>
  );
}
