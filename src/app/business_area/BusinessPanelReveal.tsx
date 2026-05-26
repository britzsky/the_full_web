"use client";

import { useEffect } from "react";

type BusinessPanelRevealProps = {
  sectionId: string;
};

// 사업 영역 급식 서비스 섹션이 화면에 들어오면 카드 진입 클래스를 붙이는 컴포넌트
export default function BusinessPanelReveal({ sectionId }: BusinessPanelRevealProps) {
  useEffect(() => {
    const sectionElement = document.getElementById(sectionId);

    if (!(sectionElement instanceof HTMLElement)) {
      return;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotionQuery.matches) {
      sectionElement.classList.add("is-visible");
      return;
    }

    // 모바일 스냅 스크롤은 빠르게 완료되므로 threshold를 낮춰 확실히 발동하도록 함
    const isMobile = window.innerWidth <= 768;
    const threshold = isMobile ? 0.15 : 0.35;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          sectionElement.classList.add("is-visible");
          return;
        }

        sectionElement.classList.remove("is-visible");
      },
      { threshold }
    );

    observer.observe(sectionElement);

    return () => {
      observer.disconnect();
    };
  }, [sectionId]);

  return null;
}
