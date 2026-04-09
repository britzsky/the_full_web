"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// 급식서비스 화면: 교육 카드 슬라이드 데이터 모델
type CateringEducationCarouselCard = {
  title: string;
  description: string;
};

// 급식서비스 화면: 교육 카드 슬라이드 컴포넌트 전달값
type CateringEducationCarouselProps = {
  cards: CateringEducationCarouselCard[];
};

// 급식서비스 화면: 4번 화면 교육 카드 슬라이드
export default function CateringEducationCarousel({ cards }: CateringEducationCarouselProps) {
  const getInitialCardsPerPage = () => {
    if (typeof window === "undefined") {
      return 3;
    }

    return window.innerWidth <= 1024 ? 1 : 3;
  };

  const [cardsPerPage, setCardsPerPage] = useState(getInitialCardsPerPage);
  const [activeIndex, setActiveIndex] = useState(getInitialCardsPerPage);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [cardOffsets, setCardOffsets] = useState<number[]>([]);
  const [measuredCardCount, setMeasuredCardCount] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 화면 폭에 따라 한 번에 보이는 카드 수를 조정한다.
    const syncCardsPerPage = () => {
      setCardsPerPage(window.innerWidth <= 1024 ? 1 : 3);
    };

    syncCardsPerPage();
    window.addEventListener("resize", syncCardsPerPage);

    return () => {
      window.removeEventListener("resize", syncCardsPerPage);
    };
  }, []);

  const visibleCardCount = Math.min(cardsPerPage, cards.length || cardsPerPage);
  const hasMultiplePages = cards.length > visibleCardCount;
  const cloneCount = Math.min(visibleCardCount, cards.length);
  const middleStartIndex = hasMultiplePages ? cloneCount : 0;

  // 무한 순환 이동을 위해 앞/뒤에 복제 카드를 붙인 트랙을 만든다.
  const renderedCards = hasMultiplePages
    ? [
        ...cards.slice(cards.length - cloneCount),
        ...cards,
        ...cards.slice(0, cloneCount),
      ]
    : cards;
  const trackCards = hasMultiplePages && measuredCardCount === 0 ? cards : renderedCards;
  const canTranslate = cardOffsets.length === trackCards.length && activeIndex < cardOffsets.length;
  const currentTranslateX = canTranslate ? cardOffsets[activeIndex] : 0;

  useEffect(() => {
    // 화면 구성이 바뀌면 항상 가운데 원본 구간에서 다시 시작한다.
    setIsTransitionEnabled(false);
    setIsAnimating(false);
    setActiveIndex(middleStartIndex);
    setMeasuredCardCount(0);
    setCardOffsets([]);
  }, [middleStartIndex, cards.length, cardsPerPage]);

  // 좌우 화살표 클릭 시 카드 1칸씩 실제로 이동한다.
  const handleMove = (nextDirection: 1 | -1) => {
    if (!hasMultiplePages || isAnimating) {
      return;
    }

    setIsAnimating(true);
    setIsTransitionEnabled(true);
    setActiveIndex((previousIndex) => previousIndex + nextDirection);
  };

  // 복제 구간까지 이동하면 같은 화면 상태를 유지한 채 원본 구간으로 즉시 되돌린다.
  const handleTransitionEnd = () => {
    if (!hasMultiplePages) {
      return;
    }

    if (activeIndex >= cards.length + cloneCount) {
      setIsTransitionEnabled(false);
      setActiveIndex(activeIndex - cards.length);
      setIsAnimating(false);
      return;
    }

    if (activeIndex < cloneCount) {
      setIsTransitionEnabled(false);
      setActiveIndex(activeIndex + cards.length);
      setIsAnimating(false);
      return;
    }

    setIsAnimating(false);
  };

  useLayoutEffect(() => {
    // 트랙 내부 카드의 실제 x 좌표를 읽어 카드 이동 오차를 없앤다.
    const measureTrack = () => {
      const trackElement = trackRef.current;
      if (!trackElement) {
        return;
      }

      const cardElements = Array.from(
        trackElement.querySelectorAll<HTMLElement>(".catering_education_card")
      );

      if (cardElements.length === 0) {
        setCardOffsets([]);
        setMeasuredCardCount(0);
        return;
      }

      const offsets = cardElements.map((cardElement) => cardElement.offsetLeft);
      setCardOffsets(offsets);
      setMeasuredCardCount(cardElements.length);
    };

    measureTrack();
    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => measureTrack()) : null;

    if (resizeObserver && trackRef.current) {
      resizeObserver.observe(trackRef.current);
    }

    window.addEventListener("resize", measureTrack);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measureTrack);
    };
  }, [cardsPerPage, cards.length, trackCards.length]);

  return (
    <div className="catering_education_cards_wrap">
      <button
        type="button"
        aria-label="이전"
        className="catering_education_nav catering_education_nav_left"
        onClick={() => handleMove(-1)}
        disabled={!hasMultiplePages || isAnimating}
      >
        ‹
      </button>

      {/* 교육 카드 표시 영역 */}
      <div className="catering_education_cards_viewport">
        <div
          ref={trackRef}
          className={`catering_education_cards ${
            isTransitionEnabled ? "catering_education_cards_track_animated" : ""
          }`}
          style={
            canTranslate
              ? {
                  transform: `translateX(-${currentTranslateX}px)`,
                }
              : undefined
          }
          onTransitionEnd={handleTransitionEnd}
        >
          {trackCards.map((card, index) => (
            <article key={`${index}-${card.title}`} className="catering_education_card">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="다음"
        className="catering_education_nav catering_education_nav_right"
        onClick={() => handleMove(1)}
        disabled={!hasMultiplePages || isAnimating}
      >
        ›
      </button>
    </div>
  );
}
