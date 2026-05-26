"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import GreetingTyping from "./GreetingTyping";

// 비전/미션 항목 타입
interface VisionMissionItem {
  title: string;
  description: string;
  image: string;
}

interface Props {
  greetingImage: string;       // 대표 이미지 경로
  greetingLine: string;        // 타이핑할 인사 문구 첫 줄
  ceoLabel: string;            // CEO 텍스트
  signImageSrc: string;        // 서명 이미지 경로
  paragraphs: string[];        // 슬라이드업할 나머지 문단들
  visionMission: VisionMissionItem[]; // 비전/미션 데이터
}

// 1번 화면(인사말) + 2번 화면(비전/미션) 통합 클라이언트 컴포넌트
// 타이핑 애니메이션 완료 후 비전/미션이 슬라이드업으로 등장
export default function GreetingSection({
  greetingImage,
  greetingLine,
  ceoLabel,
  signImageSrc,
  paragraphs,
  visionMission,
}: Props) {
  // 비전/미션 노출 여부 — 스크롤로 진입 시 true로 전환
  const [vmVisible, setVmVisible] = useState(false);
  const vmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = vmRef.current;
    if (!el) return;
    const scrollRoot = document.getElementById("company-scroll");
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVmVisible(true); observer.disconnect(); } },
      { root: scrollRoot, rootMargin: "0px 0px -30% 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* 대표 이미지 / 인사말 2열 레이아웃 */}
      <div className="company-greeting-grid">
        {/* 왼쪽: 대표 사진 */}
        <div className="company-greeting-image-frame company-enter-up">
          <Image
            src={greetingImage}
            alt="대표 인사 이미지"
            fill
            quality={100}
            sizes="(max-width: 1024px) 86vw, 420px"
            className="company-greeting-image"
          />
        </div>

        {/* 오른쪽: 자모 타이핑 → 커서 깜빡 → CEO → 서명 → 문단 슬라이드업 */}
        <GreetingTyping
          greetingLine={greetingLine}
          ceoLabel={ceoLabel}
          signImageSrc={signImageSrc}
          paragraphs={paragraphs}
        />
      </div>

      {/* 비전/미션: 타이핑 완료 후 슬라이드업으로 등장 */}
      <div
        ref={vmRef}
        id="company-vision-mission"
        className="company-screen-inner company-vm-inner"
        style={{ marginTop: "clamp(6rem, 7vh, 8rem)" }}
      >
        <div className="company-vm-grid">
          {visionMission.map((item, index) => (
            <article
              key={item.title}
              className="company-vm-item"
              style={{
                opacity: vmVisible ? 1 : 0,
                transform: vmVisible ? "translate3d(0,0,0)" : "translate3d(0,22px,0)",
                transition: "opacity 0.52s cubic-bezier(0.22,0.61,0.36,1), transform 0.52s cubic-bezier(0.22,0.61,0.36,1)",
              }}
            >
              <div className="company-vm-icon-frame">
                <Image
                  src={item.image}
                  alt={`${item.title} 아이콘`}
                  fill
                  quality={100}
                  sizes="96px"
                  className="company-vm-icon"
                />
              </div>
              <h2 className="company-vm-title">{item.title}</h2>
              <p className="company-vm-copy">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
