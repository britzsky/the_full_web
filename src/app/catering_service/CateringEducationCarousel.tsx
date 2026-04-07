"use client";

import { useEffect, useState } from "react";

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
  const [cardsPerPage, setCardsPerPage] = useState(3);
  const [currentPage, setCurrentPage] = useState(0);

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

  const cardPages: CateringEducationCarouselCard[][] = [];

  for (let index = 0; index < cards.length; index += cardsPerPage) {
    cardPages.push(cards.slice(index, index + cardsPerPage));
  }

  useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, Math.max(cardPages.length - 1, 0)));
  }, [cardPages.length]);

  // 이전 카드 묶음으로 이동한다.
  const handleMovePrevious = () => {
    setCurrentPage((previousPage) => Math.max(previousPage - 1, 0));
  };

  // 다음 카드 묶음으로 이동한다.
  const handleMoveNext = () => {
    setCurrentPage((previousPage) => Math.min(previousPage + 1, cardPages.length - 1));
  };

  return (
    <div className="catering_education_cards_wrap">
      <button
        type="button"
        aria-label="이전"
        className="catering_education_nav catering_education_nav_left"
        onClick={handleMovePrevious}
        disabled={currentPage === 0}
      >
        ‹
      </button>

      {/* 교육 카드 슬라이드 표시 영역 */}
      <div className="catering_education_cards_viewport">
        <div
          className="catering_education_cards_track"
          style={{ transform: `translateX(-${currentPage * 100}%)` }}
        >
          {cardPages.map((pageCards, pageIndex) => (
            <div key={`education-page-${pageIndex}`} className="catering_education_cards">
              {pageCards.map((card) => (
                <article key={card.title} className="catering_education_card">
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="다음"
        className="catering_education_nav catering_education_nav_right"
        onClick={handleMoveNext}
        disabled={currentPage === cardPages.length - 1}
      >
        ›
      </button>
    </div>
  );
}
