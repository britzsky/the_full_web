"use client";

import { useEffect } from "react";

// 스크롤 애니메이션 대상 요소 선택자
const MOTION_TARGET_SELECTOR = "[data-company-motion]";
// 초기 진입 시 즉시 표시할 요소 선택자
const INITIAL_MOTION_TARGET_SELECTOR = "[data-company-motion-initial]";

// 회사소개 페이지 스크롤 진입 애니메이션 제어 컴포넌트
export default function CompanyProfileMotion() {
  useEffect(() => {
    // 스크롤 컨테이너 참조
    const scrollContainer = document.getElementById("company-scroll");

    // 스크롤 컨테이너 미존재 시 조기 반환
    if (!(scrollContainer instanceof HTMLElement)) {
      return;
    }

    // 애니메이션 준비 상태 클래스 적용
    scrollContainer.classList.add("company-motion-ready");

    // 전체 애니메이션 대상 요소 목록
    const motionTargets = Array.from(
      scrollContainer.querySelectorAll<HTMLElement>(MOTION_TARGET_SELECTOR)
    );
    // 초기 진입 애니메이션 대상 요소 목록
    const initialMotionTargets = Array.from(
      scrollContainer.querySelectorAll<HTMLElement>(INITIAL_MOTION_TARGET_SELECTOR)
    );

    // 애니메이션 대상 없을 시 조기 반환
    if (motionTargets.length === 0) {
      return;
    }

    // 모든 대상에 가시화 클래스 일괄 적용 (모션 생략 대체 처리)
    const revealAllTargets = () => {
      motionTargets.forEach((targetElement) => {
        targetElement.classList.add("company-motion-visible");
      });
    };

    // 동작 감소 설정 또는 IntersectionObserver 미지원 환경 감지
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
      // 접근성 설정 또는 구형 브라우저: 애니메이션 없이 전체 노출
      revealAllTargets();
      return;
    }

    // 초기 진입 대상 요소 즉시 가시화 처리
    const revealInitialTargets = () => {
      initialMotionTargets.forEach((targetElement) => {
        targetElement.classList.add("company-motion-visible");
      });
    };

    // 다음 프레임에서 초기 대상 노출 (레이아웃 완료 후 적용)
    const animationFrameId = window.requestAnimationFrame(revealInitialTargets);

    // 뷰포트 교차 감지 옵저버 생성
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 뷰포트 미진입 요소 무시
          if (!entry.isIntersecting) {
            return;
          }

          // 뷰포트 진입 시 가시화 클래스 적용 후 관찰 해제
          entry.target.classList.add("company-motion-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        root: scrollContainer,   // 스크롤 기준 컨테이너
        threshold: 0.2,          // 요소 20% 진입 시 트리거
        rootMargin: "0px 0px -8% 0px", // 하단 여백으로 조기 트리거 방지
      }
    );

    // 초기 대상 집합 (중복 관찰 제외용)
    const initialTargetSet = new Set(initialMotionTargets);
    motionTargets.forEach((targetElement) => {
      // 초기 진입 대상은 옵저버 등록 제외
      if (initialTargetSet.has(targetElement)) {
        return;
      }
      // 나머지 대상 스크롤 교차 감지 등록
      observer.observe(targetElement);
    });

    // 클린업: 애니메이션 프레임 취소 및 옵저버 해제
    return () => {
      window.cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, []);

  return null;
}
