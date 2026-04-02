"use client";

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
  );
}

