"use client";

import { useEffect } from "react";

export const useOutsideClick = <T extends HTMLElement>(
  ref: React.RefObject<T>,
  handler: (event: MouseEvent) => void,
  active: boolean
) => {
  useEffect(() => {
    if (!active) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }
      if (ref.current && !ref.current.contains(target)) {
        const portalRoot = document.querySelector(
          ".z-50.border.shadow-xl.rounded-xl"
        );
        if (portalRoot && portalRoot.contains(target)) {
          return;
        }
        handler(event);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [active, handler, ref]);
};
