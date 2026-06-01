"use client";

import { useEffect, useState } from "react";
import ScrollToTopButton from "@/app/components/Common/ScrollToTopButton";

type RecruitFloatingButtonsProps = {
  targetId: string;
  verticalSectionId: string;
};

// 지정 섹션(인재상 첫 화면)에서만 고객문의 버튼을 위로, 나머지는 왼쪽으로 유지한다.
export default function RecruitFloatingButtons({ targetId, verticalSectionId }: RecruitFloatingButtonsProps) {
  const [horizontal, setHorizontal] = useState(false);

  useEffect(() => {
    const verticalSection = document.getElementById(verticalSectionId);
    if (!verticalSection) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHorizontal(!entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    observer.observe(verticalSection);
    return () => observer.disconnect();
  }, [verticalSectionId]);

  return <ScrollToTopButton targetId={targetId} horizontal={horizontal} />;
}
