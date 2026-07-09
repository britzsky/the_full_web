"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import SectionTitle from "@/app/components/Common/SectionTitle";
import SocialMediaClient from "./SocialMediaClient";
import NaverBlogClient from "./NaverBlogClient";

// SNS 탭 식별자 타입
type SocialTab = "instagram" | "naver";

// 인디케이터 위치·너비 상태 타입
type IndicatorStyle = { left: number; width: number };

export default function SocialTabsClient() {
  const searchParams = useSearchParams();
  // 활성 탭 상태: URL ?tab=naver 파라미터로 초기 탭 결정
  const [activeTab, setActiveTab] = useState<SocialTab>(
    searchParams.get("tab") === "naver" ? "naver" : "instagram"
  );
  // 네이버 탭은 첫 클릭 시 마운트 — 초기 로드 시 불필요한 API 호출 방지
  const [naverMounted, setNaverMounted] = useState(searchParams.get("tab") === "naver");
  // 슬라이딩 인디케이터 위치 및 너비 상태
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle | null>(null);
  // 초기 렌더링 여부 추적 (첫 마운트는 애니메이션 없이 배치)
  const isInitializedRef = useRef(false);
  // 탭 컨테이너 기준점 참조
  const containerRef = useRef<HTMLDivElement>(null);
  // 인스타그램 탭 버튼 참조
  const instagramRef = useRef<HTMLButtonElement>(null);
  // 네이버 블로그 탭 버튼 참조
  const naverRef = useRef<HTMLButtonElement>(null);

  // 활성 탭 변경 시 인디케이터 2단계 애니메이션 실행
  useEffect(() => {
    const activeEl = activeTab === "instagram" ? instagramRef.current : naverRef.current;
    const container = containerRef.current;
    if (!activeEl || !container) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    const targetLeft = activeRect.left - containerRect.left;
    const targetWidth = activeRect.width;

    // 초기 마운트: 애니메이션 없이 즉시 배치
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      setIndicatorStyle({ left: targetLeft, width: targetWidth });
      return;
    }

    // 1단계: 왼→오는 왼쪽 끝, 오→왼은 오른쪽 끝에 6px 배치 (거울 효과)
    const isMovingRight = activeTab === "naver";
    setIndicatorStyle({
      left: isMovingRight ? targetLeft : targetLeft + targetWidth - 6,
      width: 6,
    });

    // 2단계: CSS width 애니메이션(200ms) 완료 후 전체 너비로 확장
    const tid = window.setTimeout(() => {
      setIndicatorStyle({ left: targetLeft, width: targetWidth });
    }, 280);

    return () => clearTimeout(tid);
  }, [activeTab]);

  return (
    <>
      {/* 섹션 타이틀 행 */}
      <div className="social-list-header">
        <SectionTitle englishLabel="Social Media">더채움 소식</SectionTitle>
      </div>

      {/* SNS 탭 행: 화면 가운데 정렬 */}
      <div className="social-sns-tabs-row">
        {/* SNS 탭 버튼 묶음 */}
        <div ref={containerRef} className="social-sns-tabs">
          {/* 인스타그램 탭 버튼 */}
          <button
            ref={instagramRef}
            type="button"
            className={`social-sns-tab${activeTab === "instagram" ? " social-sns-tab--active" : ""}`}
            onClick={() => setActiveTab("instagram")}
          >
            <Image
              src="/images/sns_logo/instagram.webp"
              alt="Instagram"
              width={28}
              height={28}
              className="social-sns-tab-logo"
            />
            <span>Instagram</span>
          </button>

          {/* 탭 구분자 */}
          <span className="social-sns-tab-divider" aria-hidden="true">|</span>

          {/* 네이버 블로그 탭 버튼 */}
          <button
            ref={naverRef}
            type="button"
            className={`social-sns-tab${activeTab === "naver" ? " social-sns-tab--active" : ""}`}
            onClick={() => { setActiveTab("naver"); setNaverMounted(true); }}
          >
            <Image
              src="/images/sns_logo/naver_blog.webp"
              alt="Naver Blog"
              width={28}
              height={28}
              className="social-sns-tab-logo"
            />
            <span>Naver Blog</span>
          </button>

          {/* 슬라이딩 인디케이터 바 */}
          {indicatorStyle && (
            <div
              className="social-sns-indicator"
              style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            />
          )}
        </div>
      </div>

      {/* 탭 콘텐츠 영역: display:none으로 언마운트 없이 탭 전환 (API 재호출 방지) */}
      <div className="social-content-wrap">
        <div className="social-gallery-shell">
          {/* 인스타그램 갤러리 */}
          <div style={{ display: activeTab === "instagram" ? undefined : "none" }}>
            <SocialMediaClient />
          </div>
          {/* 네이버 블로그 목록: 첫 클릭 전까지 마운트하지 않음 */}
          {naverMounted && (
            <div style={{ display: activeTab === "naver" ? undefined : "none" }}>
              <NaverBlogClient />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
