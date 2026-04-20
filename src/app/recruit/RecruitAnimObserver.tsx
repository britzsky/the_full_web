"use client";

import { useEffect } from "react";

const DELAYS = ["0.1s", "0.4s", "0.7s", "1.0s"];

function playAnims(section: HTMLElement) {
  const elems = section.querySelectorAll<HTMLElement>(".recruit-anim");
  elems.forEach((el, i) => {
    el.style.animation = "none";
    el.style.opacity = "0";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.animation = `recruit-fade-up 0.65s cubic-bezier(0.22,0.61,0.36,1) ${DELAYS[i] ?? "0.1s"} forwards`;
      });
    });
  });
}

function resetAnims(section: HTMLElement) {
  const elems = section.querySelectorAll<HTMLElement>(".recruit-anim");
  elems.forEach((el) => {
    el.style.animation = "none";
    el.style.opacity = "0";
  });
}

export default function RecruitAnimObserver() {
  useEffect(() => {
    const container = document.getElementById("recruit-scroll");
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(".recruit-screen")
    );
    if (!container) return;

    // 현재 보이는 섹션 인덱스를 추적 → 다음 섹션이면 아래, 이전이면 위
    let currentIndex = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const nextIndex = sections.indexOf(entry.target as HTMLElement);
          const scrollingDown = nextIndex >= currentIndex;
          currentIndex = nextIndex;

          if (scrollingDown) {
            playAnims(entry.target as HTMLElement);
          } else {
            // 위로 올라갈 때는 애니메이션 없이 즉시 표시
            const elems = (entry.target as HTMLElement).querySelectorAll<HTMLElement>(".recruit-anim");
            elems.forEach((el) => {
              el.style.animation = "none";
              el.style.opacity = "1";
            });
          }
        });
      },
      { root: container, threshold: 0.5 }
    );

    sections.forEach((el) => {
      resetAnims(el);
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
