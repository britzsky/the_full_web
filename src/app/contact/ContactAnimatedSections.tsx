"use client";

import { useEffect, useRef } from "react";

// 고객문의 품질관리 섹션 1회 진입 애니메이션 컴포넌트
export function ContactQualitySectionAnimated({ children }: { children: React.ReactNode }) {
  // 품질관리 섹션 요소 참조값
  const ref = useRef<HTMLElement>(null);

  // 스크롤 교차 감지 기반 표시 클래스 부여 처리
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 품질관리 섹션 노출 기준 관찰자
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("contact-section-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    // 품질관리 섹션 애니메이션 래퍼 영역
    <section ref={ref} className="contact-quality-section contact-section-animate">
      {children}
    </section>
  );
}

// 고객문의 입력폼 섹션 1회 진입 애니메이션 컴포넌트
export function ContactFormSectionAnimated({ children }: { children: React.ReactNode }) {
  // 입력폼 섹션 요소 참조값
  const ref = useRef<HTMLElement>(null);

  // 스크롤 교차 감지 기반 표시 클래스 부여 처리
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 입력폼 섹션 지연 노출 기준 관찰자
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("contact-section-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.18 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    // 고객문의 입력폼 섹션 애니메이션 래퍼 영역
    <section ref={ref} id="contact_form" className="contact-form-section contact-section-animate">
      {children}
    </section>
  );
}
