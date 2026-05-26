"use client";

import Link from "next/link";

// 공통 컴포넌트: 컴포넌트 전달값
type ScrollToTopButtonProps = {
  targetId: string;
};

// 공통 컴포넌트: ScrollToTopButton 함수 로직
export default function ScrollToTopButton({ targetId }: ScrollToTopButtonProps) {
  // 스크롤 컨테이너 상단 이동
  const handleMoveTop = () => {
// 공통 컴포넌트: targetElement 정의
    const targetElement = document.getElementById(targetId);
    const canScrollTarget =
      targetElement !== null &&
      targetElement.scrollHeight > targetElement.clientHeight &&
      getComputedStyle(targetElement).overflowY !== "visible";

    if (canScrollTarget && targetElement !== null) {
      targetElement.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="floating-action-buttons">
      <Link href="/contact" className="contact-inquiry-button" aria-label="고객문의 페이지로 이동">
        <svg
          className="contact-inquiry-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 12a9 9 0 0 1 18 0v5a2 2 0 0 1-2 2h-3v-7h5M3 12h5v7H5a2 2 0 0 1-2-2Zm13 7v1a3 3 0 0 1-3 3h-1"
          />
        </svg>
      </Link>

      <button
        type="button"
        className="scroll-to-top-button"
        onClick={handleMoveTop}
        aria-label="맨 위 카드로 이동"
      >
        <svg
          className="scroll-to-top-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
            d="M18 15l-6-6l-6 6"
          />
        </svg>
      </button>
    </div>
  );
}
