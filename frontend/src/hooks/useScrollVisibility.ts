import { useState, useRef, useCallback, useEffect } from "react";

/**
 * 스크롤 방향에 따라 요소를 숨기거나 보여주는 커스텀 훅.
 * 아래로 threshold(px) 이상 스크롤하면 숨기고, 위로 threshold 이상 스크롤하면 보여준다.
 * 최상단(<=10px)에서는 항상 보여준다.
 */
export function useScrollVisibility(
  scrollContainerRef: React.RefObject<HTMLElement | null>,
  threshold: number = 40
): {
  visible: boolean;
  handleTransitionEnd: () => void;
} {
  const [visible, setVisible] = useState(true);
  const lastScrollTop = useRef(0);
  const isAnimating = useRef(false);
  const accumulatedDelta = useRef(0);

  const handleTransitionEnd = useCallback(() => {
    isAnimating.current = false;
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const currentScrollTop = el.scrollTop;
    const delta = currentScrollTop - lastScrollTop.current;
    lastScrollTop.current = currentScrollTop;

    // 최상단에서는 잠금 무시하고 무조건 표시
    if (currentScrollTop <= 10) {
      accumulatedDelta.current = 0;
      isAnimating.current = false;
      setVisible(true);
      return;
    }

    if (isAnimating.current) return;

    // 방향 전환 시 누적 리셋
    if (
      (accumulatedDelta.current > 0 && delta < 0) ||
      (accumulatedDelta.current < 0 && delta > 0)
    ) {
      accumulatedDelta.current = 0;
    }
    accumulatedDelta.current += delta;

    // 같은 방향으로 threshold 이상 누적돼야 반응
    if (Math.abs(accumulatedDelta.current) < threshold) return;

    const nextVisible = accumulatedDelta.current < 0;
    accumulatedDelta.current = 0;

    // 이미 같은 상태면 무시
    setVisible((prev) => {
      if (prev === nextVisible) return prev;
      isAnimating.current = true;
      return nextVisible;
    });
  }, [scrollContainerRef, threshold]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [scrollContainerRef, handleScroll]);

  return { visible, handleTransitionEnd };
}
