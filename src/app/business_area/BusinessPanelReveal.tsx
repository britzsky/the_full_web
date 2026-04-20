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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          sectionElement.classList.add("is-visible");
          return;
        }

        sectionElement.classList.remove("is-visible");
      },
      {
        threshold: 0.35,
      }
    );

    observer.observe(sectionElement);

    return () => {
      observer.disconnect();
    };
  }, [sectionId]);

  return null;
}
