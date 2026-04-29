import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";

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
  initialized: boolean;
  handleTransitionEnd: () => void;
} {
  const [visible, setVisible] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const lastScrollTop = useRef(0);
  const isAnimating = useRef(false);
  const accumulatedDelta = useRef(0);

  const handleTransitionEnd = useCallback(() => {
    isAnimating.current = false;
  }, []);

  // 페인트 전: 스크롤 복원 예정이거나 이미 스크롤된 상태면 숨김으로 시작
  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    const hasSavedScroll = typeof window !== "undefined" &&
      !!(sessionStorage.getItem("animalListScrollTop") || sessionStorage.getItem("centerListScrollTop"));
    if (hasSavedScroll || (el && el.scrollTop > 10)) {
      setVisible(false);
      if (el) lastScrollTop.current = el.scrollTop;
    }
  }, [scrollContainerRef]);

  // 페인트 후 transition 활성화 (초기 상태 보정이 transition 없이 적용된 뒤)
  useEffect(() => {
    requestAnimationFrame(() => {
      setInitialized(true);
    });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // 콘텐츠가 스크롤 컨테이너보다 짧으면 hide/show 비활성화
    if (el.scrollHeight <= el.clientHeight + 100) {
      setVisible(true);
      return;
    }

    const currentScrollTop = el.scrollTop;
    const delta = currentScrollTop - lastScrollTop.current;
    lastScrollTop.current = currentScrollTop;

    // 프로그래밍적 scrollTo에 의한 큰 점프는 무시 (스크롤 복원 등)
    if (Math.abs(delta) > 300) {
      accumulatedDelta.current = 0;
      return;
    }

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

  return { visible, initialized, handleTransitionEnd };
}
