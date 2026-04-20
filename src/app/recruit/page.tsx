import Image from "next/image";
import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import SiteHeader, { SiteHeaderMenuItem } from "@/app/components/Common/SiteHeader";
import ScrollToTopButton from "@/app/components/Common/ScrollToTopButton";
import SectionTitle from "@/app/components/Common/SectionTitle";
import { appendContactManageMenu } from "@/app/components/Common/headerMenuUtils";
import { getContactManageAccess } from "@/app/lib/adminAccess";
import "./page.css";

// 채용 페이지 1번 화면(인재상) 카드 데이터
// company_profile 페이지의 핵심 컬러 3개를 동일하게 사용
const recruitTalentCards = [
  {
    title: "가치창출",
    color: "#59853c",
    badgeClassName: "recruit-talent-badge-value",
    lines: ["도전정신과 창의적인 사고를 토대로", "새로운 가치를 지속해서 창출하는 인재"],
  },
  {
    title: "자기계발",
    color: "#1797cc",
    badgeClassName: "recruit-talent-badge-growth",
    lines: ["사회와 환경의 변화에 대비하여", "주도적으로 설정한 목표를 달성하기 위해", "자기 개발에 충실히 임하는 인재"],
  },
  {
    title: "상호존중",
    color: "#df8929",
    badgeClassName: "recruit-talent-badge-respect",
    lines: ["윤리 의식과 도덕성을 바탕으로", "고객사 및 협력사 상호 간을", "존중하는 건전한 가치관을 지닌 인재"],
  },
] as const;

// 채용 페이지 2번 화면(채용절차) 카드 데이터
const recruitProcessCards: {
  title: string;
  iconSrc: string;
  badgeClassName: string;
}[] = [
  {
    title: "지원서 접수",
    badgeClassName: "recruit-process-badge-1",
    iconSrc: "/images/recruit/regi.png",
  },
  {
    title: "서류전형",
    badgeClassName: "recruit-process-badge-2",
    iconSrc: "/images/recruit/paper.png",
  },
  {
    title: "면접",
    badgeClassName: "recruit-process-badge-3",
    iconSrc: "/images/recruit/interview.png",
  },
  {
    title: "최종합격",
    badgeClassName: "recruit-process-badge-4",
    iconSrc: "/images/recruit/job.png",
  },
];

// 채용 페이지 3번 화면(전형안내) 행 데이터
const recruitDetailRows: {
  title: string;
  lines: ReactNode[];
}[] = [
  {
    title: "지원서 접수",
    lines: [
      <>
        지원방법 : <strong>채용공고 사이트를 통한 접수</strong> 또는 <strong>홈페이지 접수</strong>
      </>,
      <>
        제출서류 : 이력서, 자기소개서, 경력기술서(경력자에 한함)
      </>,
      <>유의사항 : 입사지원 서류에 허위사실이 발견될 경우 채용확정 이후라도 채용이 취소될 수 있습니다.</>,
    ],
  },
  {
    title: "서류전형",
    lines: [<>채용하고자 하는 <strong>직무 관련 경력 및 역량 보유 여부</strong>를 평가합니다.</>],
  },
  {
    title: "면접전형",
    lines: [
      <>채용 직무의 <strong>실무 면접위원에 의한 실무능력 및 직무전문성</strong>을 평가합니다.</>,
      <><strong>기본 인성 및 조직적합성</strong>을 종합적으로 평가합니다.</>,
    ],
  },
];

// 채용 페이지 공통 헤더 좌측 메뉴
const recruitHeaderLeftItems: SiteHeaderMenuItem[] = [
  { label: "회사소개", href: "/company_profile" },
  { label: "사업영역", href: "/business_area" },
  { label: "급식서비스", href: "/catering_service" },
];

// 채용 페이지 공통 헤더 우측 메뉴
const recruitHeaderRightBaseItems: SiteHeaderMenuItem[] = [
  { label: "홍보", href: "/social" },
  { label: "채용", href: "/recruit" },
  { label: "고객문의", href: "/contact", isCta: true },
];

// 채용 페이지 메타데이터
export const metadata: Metadata = {
  title: "(주)더채움 | 채용",
};

// 채용 페이지: RecruitPage 함수 로직
export default async function RecruitPage() {
  const canManageContact = await getContactManageAccess();
  const recruitHeaderRightItems = appendContactManageMenu(recruitHeaderRightBaseItems, canManageContact);

  return (
    <main
      id="recruit-scroll"
      className="recruit-page h-[100svh] overflow-x-hidden overflow-y-auto snap-y snap-mandatory scroll-smooth bg-white text-[#111111]"
    >
      {/* 1번 화면: 더채움 인재상 */}
      <section id="recruit-talent" className="recruit-screen recruit-screen-with-header snap-start relative">
         <SiteHeader
            leftItems={recruitHeaderLeftItems}
            rightItems={recruitHeaderRightItems}
            lightBackground
        />
        {/* <SectionTitle>인재상</SectionTitle> */}

        {/* 1번 화면 본문 정렬 래퍼 */}
        <div className="recruit-screen-body">
          {/* 1번 화면 콘텐츠 폭 컨테이너 */}
          <div className="recruit-screen-inner recruit-talent-inner">
            <div className="recruit-talent-grid">
              {recruitTalentCards.map((card) => (
                <article key={card.title} className="recruit-talent-card">
                  <div
                    className={`recruit-talent-badge ${card.badgeClassName}`}
                    style={{ "--recruit-badge-color": card.color } as CSSProperties}
                  >
                    <span>{card.title}</span>
                  </div>
                  <p className="recruit-talent-copy">
                    {card.lines.map((line) => (
                      <span key={line}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2번 화면: 채용절차 */}
      <section id="recruit-process" className="recruit-screen snap-start">
        <SectionTitle>채용절차</SectionTitle>

        {/* 2번 화면 본문 정렬 래퍼 */}
        <div className="recruit-screen-body">
          {/* 2번 화면 콘텐츠 폭 컨테이너 */}
          <div className="recruit-screen-inner recruit-process-inner">
            <div className="recruit-process-grid">
              {recruitProcessCards.map((card, index) => (
                <article key={card.title} className="recruit-process-card">
                  <div className={`recruit-process-badge ${card.badgeClassName}`}>
                    <Image
                      src={card.iconSrc}
                      alt={`${card.title} 아이콘`}
                      width={96}
                      height={96}
                      className="recruit-process-icon"
                    />
                  </div>
                  <h3 className="recruit-process-title">
                    <span className="recruit-process-mobile-order" aria-hidden="true">{index + 1}.</span>
                    {card.title}
                  </h3>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3번 화면: 전형 상세 안내 */}
      <section id="recruit-detail" className="recruit-screen snap-start">
        {/* 3번 화면 본문 정렬 래퍼 */}
        <div className="recruit-screen-body">
          {/* 3번 화면 콘텐츠 폭 컨테이너 */}
          <div className="recruit-screen-inner recruit-detail-inner">
            <div className="recruit-detail-list">
              {recruitDetailRows.map((row) => (
                <article key={row.title} className="recruit-detail-row">
                  <h3 className="recruit-detail-label">{row.title}</h3>
                  <div className="recruit-detail-content">
                    {row.lines.map((line, index) => (
                      <p key={`${row.title}-${index}`} className="recruit-detail-line">
                        {line}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 채용 페이지 공통 상단 이동 버튼 */}
      <ScrollToTopButton targetId="recruit-scroll" />
    </main>
  );
}
