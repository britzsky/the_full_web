import Image from "next/image";
import type { Metadata } from "next";
import SiteHeader, { SiteHeaderMenuItem } from "@/app/components/Common/SiteHeader";
import ScrollToTopButton from "@/app/components/Common/ScrollToTopButton";
import SectionTitle from "@/app/components/Common/SectionTitle";
import EmphasisCopy from "@/app/components/Common/EmphasisCopy";
import "./page.css";

// 사업영역 1번 화면 카드 데이터
const businessValueCards = [
  {
    title: "운영 부담 없는 안정적인 급식 관리",
    descriptionHtml:
      "전문 인력이 상시 운영을 <strong>책임지기 때문에</strong><br />직접 운영 시 발생하는 <strong>인력 관리, 채용, 공백</strong>에<br />대한 부담을 줄일 수 있습니다.",
  },
  {
    title: "전문성과 시스템이 만든 일관된 품질",
    descriptionHtml:
      "표준화된 운영 시스템을 바탕으로<br /><strong>사업장별 편차 없이</strong> 항상 일정한 <strong>맛과</strong><br />품질의 급식을 제공합니다.",
  },
  {
    title: "전문 영양사가 설계하는 맞춤형 식단",
    descriptionHtml:
      "사업장 특성과 구성원에 맞춰<br /><strong>전문 영양사가 체계적으로 식단을 설계</strong>하여<br />건강과 만족을 모두 고려한 급식을 제공합니다.",
  },
  {
    title: "비용 절감과 효율적인 운영",
    descriptionHtml:
      "계획적인 급식 운영을 통해 직접 운영 시<br />발생하는 <strong>인건비, 관리비</strong> 등 불필요한<br /><strong>운영 비용을 효과적으로 절감</strong>할 수 있습니다.",
  },
  {
    title: "본사 영양팀 중심의 신속한 메뉴 개선",
    descriptionHtml:
      "본사 영양팀을 분리·운영하여 <strong>신메뉴 개발과</strong><br /><strong>고객 니즈 파악</strong>이 신속하게 이루어지며,<br />현장 적용까지 빠르게 연결됩니다.",
  },
  {
    title: "엄선된 식자재와 안정적인 공급",
    descriptionHtml:
      "식자재 유통을 직접 운영하여 <strong>품질 기준을</strong><br /><strong>충족한 식자재만을 엄선</strong>하고, 안정적인 공급으로<br />식사의 완성도를 높입니다.",
  },
];

// 사업영역 2번 화면(이미지 3분할) 데이터
const cateringPanels = [
  {
    title: "산업체",
    description:
      "근로자의 근무 환경과 활동량을 고려한 맞춤형 메뉴와 \n 테마 식단을 합리적인 가격으로 제공하여 \n 만족도 높은 급식 서비스를 실현합니다.",
    image: "/images/business_area/business_area_1.jpg",
  },
  {
    title: "학교",
    description:
      "성장기 학생을 위한 균형 잡힌 영양 관리를 \n 최우선으로 하며, 철저한 위생 관리로 \n 안심할 수 있는 급식을 제공합니다.",
    image: "/images/business_area/business_area_2.jpg",
  },
  {
    title: "요양원",
    description:
      "최상의 실버식 메뉴 편성을 기반으로 제철 식재료를 \n 활용한 식단과 다진찬, 갈찬, 죽 등 어르신의 \n 섭취 특성을 고려한 맞춤형 급식을 제공합니다.",
    image: "/images/business_area/business_area_3.jpg",
  },
];

// 사업영역 3번 화면(이벤트) 데이터
const eventGroups = [
  {
    title: "학교",
    description: "창립기념일 이벤트, 어린이날 이벤트,\n스승의날 이벤트",
  },
  {
    title: "산업체",
    description: "창립기념일 이벤트, 새해 이벤트,\n크리스마스 이벤트",
  },
  {
    title: "요양원",
    description: "김장이벤트, 어르신 생일 이벤트",
  },
];

// 사업영역 4번 화면(식자재유통) 데이터
// 식자재유통 상단 3개 항목 데이터
const distributionTopBadges = ["업무협약", "구매관리", "식자재유통 시스템"];
// 식자재유통 하단 1~2번 데이터
const distributionBottomBadgesTop = [
  "1. 전 분야 HACCP 시스템 준용 ISO 품질인증식품 안전 관련 무사고 2000일",
  "2. 식자재 구매부터 검수, 출하, 배송 전분야에 HACCP시스템 적용",
];
// 식자재유통 하단 3~5번 데이터
const distributionBottomBadgesBottom = [
  "3. 위해요소를 분석하여 중요관리 Point를 기준으로 통제",
  "4. ISO 품질관리 시행",
  "5. 각종 위생설비 구축",
];
// 사업영역 페이지 공통 헤더 메뉴 데이터
const businessHeaderLeftItems: SiteHeaderMenuItem[] = [
  { label: "회사소개", href: "/company_profile" },
  { label: "사업영역", href: "#business-overview" },
  { label: "급식서비스", href: "/catering_service" },
];

// 사업영역 페이지 공통 헤더 우측 메뉴 데이터
const businessHeaderRightBaseItems: SiteHeaderMenuItem[] = [
  { label: "홍보", href: "/promotion" },
  { label: "채용", href: "/recruit" },
  { label: "고객문의", href: "/contact", isCta: true },
];

// 사업영역 화면: 페이지 메타데이터
export const metadata: Metadata = {
  // 사업영역 페이지 메타데이터
  title: "(주)더채움 | 사업영역",
};

// 사업영역 화면: BusinessPage 함수 로직
export default function BusinessPage() {
  return (
    <main
      id="business-scroll"
      className="business-page h-[100svh] overflow-x-hidden overflow-y-auto snap-y snap-mandatory scroll-smooth bg-white text-[#111111]"
    >
      {/* 1번 화면: 핵심 강점 6개 카드 */}
      <section id="business-overview" className="business-screen business-screen-with-header snap-start relative">
        {/* 공통 헤더(최상단 1회 노출) */}
        <SiteHeader
          leftItems={businessHeaderLeftItems}
          rightItems={businessHeaderRightBaseItems}
          lightBackground
        />
        {/* 1번 화면 본문 정렬 래퍼 */}
        <div className="business-screen-body">
          {/* 1번 화면 콘텐츠 폭 컨테이너 */}
          <div className="business-screen-inner">
            {/* 6개 카드 그리드 */}
            <div className="business-value-grid">
              {businessValueCards.map((card, index) => (
                <article key={card.title} className="business-value-card">
                  <h2 className="business-value-title">
                    {index + 1}. {card.title}
                  </h2>
                  <EmphasisCopy html={card.descriptionHtml} className="business-value-copy" />
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2번 화면: 사업군별 3분할 이미지 카드 */}
      <section id="business-catering" className="business-screen business-screen-catering snap-start">
        {/* 2번 화면 본문 정렬 래퍼 */}
        <div className="business-screen-body">
          {/* 2번 화면 풀폭 콘텐츠 래퍼 */}
          <div className="business-panel-fullbleed">
            {/* 3분할 이미지 그리드 */}
            <div className="business-panel-grid">
              {cateringPanels.map((panel) => (
                <article key={panel.title} className="business-panel-card">
                  <Image
                    src={panel.image}
                    alt={`${panel.title} 급식서비스`}
                    fill
                    quality={100}
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover business-catering-image"
                  />
                  <div className="business-panel-dim" />
                  <div className="business-panel-copy">
                    <h3 className="business-panel-title">{panel.title}</h3>
                    <p className="business-panel-description">{panel.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3번 화면: 이벤트 안내 + 토성 고리 */}
      <section id="business-event" className="business-screen snap-start">
        <SectionTitle>이벤트</SectionTitle>
        {/* 3번 화면 본문 정렬 래퍼 */}
        <div className="business-screen-body">
          {/* 이벤트 본문 컨테이너 */}
          <div className="business-screen-inner business-event-inner">
            {/* 이미지/고리/문구 좌표 기준판 */}
            <div className="business-event-orbit">
              <article className="business-event-copy business-event-copy-11">
                <h3 className="business-event-title">{eventGroups[0].title}</h3>
                <p className="business-event-description">{eventGroups[0].description}</p>
              </article>

              <article className="business-event-copy business-event-copy-1">
                <h3 className="business-event-title">{eventGroups[1].title}</h3>
                <p className="business-event-description">{eventGroups[1].description}</p>
              </article>

              <div className="business-event-visual">
                <div className="business-event-image-frame">
                  <Image
                    src="/images/business_area/business_area_4.jpg"
                    alt="이벤트 이미지"
                    fill
                    quality={100}
                    sizes="(max-width: 1024px) 76vw, 26vw"
                    className="object-cover business-event-image"
                  />
                </div>
                <svg
                  className="business-event-ring"
                  viewBox="0 0 800 800"
                  aria-hidden="true"
                  focusable="false"
                >
                  <ellipse cx="400" cy="400" rx="390" ry="128" />
                </svg>
              </div>

              <article className="business-event-copy business-event-copy-6">
                <h3 className="business-event-title">{eventGroups[2].title}</h3>
                <p className="business-event-description">{eventGroups[2].description}</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* 4번 화면: 식자재유통 기준/강점 카드 */}
      <section id="business-distribution" className="business-screen snap-start">
        <SectionTitle>식자재유통</SectionTitle>
        {/* 4번 화면 본문 정렬 래퍼 */}
        <div className="business-screen-body">
          {/* 식자재유통 콘텐츠 컨테이너 */}
          <div className="business-screen-inner business-distribution-inner">
            <div className="business-distribution-top">
              {distributionTopBadges.map((item) => (
                <div key={item} className="business-distribution-pill">
                  {item}
                </div>
              ))}
            </div>

            <div className="business-distribution-center">
              <h3 className="business-distribution-center-title">식자재 구매기준</h3>
              <div className="business-distribution-center-box">
                <p>
                  대기업 물류사와의 복수 거래를 기반으로, 대한민국 최대 농산물 유통 허브인
                  <br />
                  가락시장 새벽 경매에 매일 참여하며 축적된 구매 노하우를 바탕으로
                  <br />
                  우수한 품질과 합리적인 가격의 식자재를 선별합니다. 또한 각 지역 농·수산물 시장과의 네트워크를 구축해
                  <br />
                  전국 어디서나 동일한 기준의 안전하고 신선한 식자재를 안정적으로 공급하는
                  <br />
                  더채움만의 유통 시스템을 운영하고 있습니다.
                </p>
              </div>
            </div>

            <div className="business-distribution-bottom">
              <div className="business-distribution-bottom-top">
                {distributionBottomBadgesTop.map((item, index) => (
                  <div
                    key={item}
                    className={`business-distribution-chip business-distribution-chip-top business-distribution-chip-top-${index + 1}`}
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="business-distribution-bottom-bottom">
                {distributionBottomBadgesBottom.map((item, index) => (
                  <div
                    key={item}
                    className={`business-distribution-chip business-distribution-chip-bottom business-distribution-chip-bottom-${index + 1}`}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 사업영역 페이지 공통 상단 이동 버튼 */}
      <ScrollToTopButton targetId="business-scroll" />
    </main>
  );
}



