"use client";

import { Suspense } from "react";
import { useAnimalFilterOverlayStore } from "@/stores/animalFilterOverlay";
import { AnimalFilterContent } from "./page";

export function AnimalFilterOverlay() {
  const { isOpen, close } = useAnimalFilterOverlayStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] bg-black/40">
      <div className="absolute inset-0" onClick={close} aria-label="닫기" />
      <div className="fixed inset-0 bg-white overflow-auto">
        <Suspense fallback={<div>로딩 중...</div>}>
          <AnimalFilterContent />
        </Suspense>
      </div>
    </div>
  );
}
