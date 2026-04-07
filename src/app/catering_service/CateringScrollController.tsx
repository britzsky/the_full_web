"use client";

import { useEffect } from "react";

// 급식서비스 화면: 전체 화면 섹션 스크롤 보조 컴포넌트 전달값
type CateringScrollControllerProps = {
  containerId: string;
  sectionSelector: string;
};

// 급식서비스 화면: 섹션 단위 부드러운 스크롤 보조 로직
export default function CateringScrollController({
  containerId,
  sectionSelector,
}: CateringScrollControllerProps) {
  useEffect(() => {
    const containerElement = document.getElementById(containerId);

    if (!(containerElement instanceof HTMLElement)) {
      return;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotionQuery.matches) {
      return;
    }

    const sectionElements = Array.from(
      containerElement.querySelectorAll<HTMLElement>(sectionSelector)
    );

    if (sectionElements.length === 0) {
      return;
    }

    let animationFrameId = 0;
    let isAnimating = false;
    let accumulatedWheelDelta = 0;
    let wheelResetTimeoutId = 0;

    // 현재 스크롤 위치와 가장 가까운 섹션 인덱스를 계산한다.
    const getClosestSectionIndex = () => {
      const currentScrollTop = containerElement.scrollTop;

      return sectionElements.reduce((closestIndex, sectionElement, sectionIndex) => {
        const currentDistance = Math.abs(sectionElement.offsetTop - currentScrollTop);
        const closestDistance = Math.abs(sectionElements[closestIndex].offsetTop - currentScrollTop);

        return currentDistance < closestDistance ? sectionIndex : closestIndex;
      }, 0);
    };

    // 휠 이동 시 다음 섹션으로 천천히 붙도록 커스텀 애니메이션을 적용한다.
    const animateToSection = (targetScrollTop: number) => {
      const startScrollTop = containerElement.scrollTop;
      const scrollDistance = targetScrollTop - startScrollTop;

      if (scrollDistance === 0) {
        return;
      }

      const animationDuration = 560;
      const animationStartTime = performance.now();
      isAnimating = true;

      const step = (currentTime: number) => {
        const elapsedTime = currentTime - animationStartTime;
        const progress = Math.min(elapsedTime / animationDuration, 1);
        const easedProgress =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        containerElement.scrollTop = startScrollTop + scrollDistance * easedProgress;

        if (progress < 1) {
          animationFrameId = window.requestAnimationFrame(step);
          return;
        }

        containerElement.scrollTop = targetScrollTop;
        isAnimating = false;
      };

      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(step);
    };

    // 트랙패드의 작은 입력을 모아서 한 화면 단위 이동으로 정리한다.
    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        return;
      }

      if (Math.abs(event.deltaY) < 2) {
        return;
      }

      event.preventDefault();

      if (isAnimating) {
        return;
      }

      accumulatedWheelDelta += event.deltaY;
      window.clearTimeout(wheelResetTimeoutId);
      wheelResetTimeoutId = window.setTimeout(() => {
        accumulatedWheelDelta = 0;
      }, 110);

      if (Math.abs(accumulatedWheelDelta) < 36) {
        return;
      }

      const currentSectionIndex = getClosestSectionIndex();
      const nextSectionIndex = Math.min(
        Math.max(currentSectionIndex + (accumulatedWheelDelta > 0 ? 1 : -1), 0),
        sectionElements.length - 1
      );

      accumulatedWheelDelta = 0;

      if (nextSectionIndex === currentSectionIndex) {
        return;
      }

      animateToSection(sectionElements[nextSectionIndex].offsetTop);
    };

    containerElement.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(wheelResetTimeoutId);
      containerElement.removeEventListener("wheel", handleWheel);
    };
  }, [containerId, sectionSelector]);

  return null;
}
