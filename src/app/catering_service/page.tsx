import Image from "next/image";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import SiteHeader, { SiteHeaderMenuItem } from "@/app/components/Common/SiteHeader";
import ScrollToTopButton from "@/app/components/Common/ScrollToTopButton";
import CateringEducationCarousel from "./CateringEducationCarousel";
import CateringScrollController from "./CateringScrollController";
import { appendContactManageMenu } from "@/app/components/Common/headerMenuUtils";
import { getContactManageAccess } from "@/app/lib/adminAccess";
import "./page.css";

// 1번 화면 흐름도 셀(라벨) 텍스트 데이터
type CateringFlowNode = {
  text: string;
  type: "dark" | "outline";
  className: string;
  tooltip?: string;
};

// 2번 화면 3단 메뉴관리 카드 데이터
type CateringStageCard = {
  step: string;
  description: string;
  image: string;
  panelClassName: string;
  imageClassName: string;
};

// 3번 화면 비교표 행 데이터
type CateringCompareRow = {
  label: string;
  defaultValue: string;
  chaewoomValue: string;
};

// 3번 화면 채용/관리 프로세스 카드 데이터
type CateringProcessCard = {
  title: string;
  lines: string[];
};

// 4번 화면 교육 지표 상단 요약 데이터
type CateringEducationStat = {
  label: string;
  value: string;
};

// 4번 화면 본문 교육 카드 데이터
type CateringEducationCard = {
  title: string;
  description: string;
};

// 5번 화면 좌측 뱃지 + 우측 설명 데이터
type CateringResearchItem = {
  label: string;
  description: string;
};

// 5번 화면 하단 채용 블록 데이터
type CateringRecruitBlock = {
  title: string;
  lines: string[];
};

// 급식서비스 페이지 헤더 좌측 메뉴 데이터
const cateringHeaderLeftItems: SiteHeaderMenuItem[] = [
  { label: "회사소개", href: "/company_profile" },
  { label: "사업영역", href: "/business_area" },
  { label: "급식서비스", href: "#catering_flow" },
];

// 급식서비스 페이지 헤더 우측 메뉴 데이터
const cateringHeaderRightBaseItems: SiteHeaderMenuItem[] = [
  { label: "홍보", href: "/social" },
  { label: "채용", href: "/recruit" },
  { label: "고객문의", href: "/contact", isCta: true },
];

// 급식서비스 화면: 페이지 메타데이터
export const metadata: Metadata = {
  // 급식서비스 페이지 메타데이터
  title: "(주)더채움 | 급식서비스",
};

// 1번 화면 메뉴구성 흐름도 배치 데이터
const cateringFlowNodes: CateringFlowNode[] = [
  { text: "고객의 특성 분석", type: "dark", className: "catering_flow_node_left_top" },
  { text: "고객의 Needs 파악", type: "dark", className: "catering_flow_node_left_mid" },
  { text: "기존 운영메뉴의 분석", type: "dark", className: "catering_flow_node_left_bottom" },
  { text: "본사 메뉴팀의 메뉴 구성 검증", type: "dark", className: "catering_flow_node_center_top" },
  { text: "사업장 메뉴 구성", type: "dark", className: "catering_flow_node_center_mid" },
  { text: "운영 결과 분석", type: "dark", className: "catering_flow_node_right_mid" },
  { text: "고객 입맛 식단 구성", type: "dark", className: "catering_flow_node_right_end" },
  { text: "현장중심의 메뉴 구성", type: "outline", className: "catering_flow_node_top_right", tooltip: "연령, 성별, 근무 형태 등 각 사업장의 특성을 반영한 맞춤형 메뉴를 제공합니다. \n 3개월 단위 메뉴 분석을 통해 지속적으로 메뉴를 개선하며, 전문 영양사의 일일 모니터링으로 고객의 니즈를 빠르게 반영합니다." },
];

// 2번 화면 체계적 메뉴관리 3단계 데이터
const cateringStageCards: CateringStageCard[] = [
  {
    step: "STEP 01.",
    description: "기존 사업장 메뉴 구성 확인",
    image: "/images/catering_service/catering_service_1.png",
    panelClassName: "catering_stage_panel_left",
    imageClassName: "catering_stage_image_left",
  },
  {
    step: "STEP 02.",
    description: "본사영양팀 주관 메뉴점검",
    image: "/images/catering_service/catering_service_2.png",
    panelClassName: "catering_stage_panel_center",
    imageClassName: "catering_stage_image_center",
  },
  {
    step: "STEP 03.",
    description: "식단 재구성 의견 수렴 및\n정기적 메뉴 업그레이드",
    image: "/images/catering_service/catering_service_3.png",
    panelClassName: "catering_stage_panel_right",
    imageClassName: "catering_stage_image_right",
  },
];

// 3번 화면 메뉴개발/품질연구 비교표 데이터
const cateringCompareRows: CateringCompareRow[] = [
  { label: "인원", defaultValue: "1.5명", chaewoomValue: "2.5명" },
  { label: "급여", defaultValue: "최저임금", chaewoomValue: "고용안정을 위한 높은 급여" },
  { label: "영양사", defaultValue: "상주의무없음", chaewoomValue: "관리영양사 상주" },
  { label: "관리체계", defaultValue: "부재", chaewoomValue: "관리팀, 영양팀, 회계팀, 교육지원" },
];

// 3번 화면 모집/채용/입사/관리 단계 카드 데이터
const cateringProcessCards: CateringProcessCard[] = [
  { title: "모집", lines: ["워크넷", "지역광고", "취업센터"] },
  { title: "채용", lines: ["심층면접", "기초교육"] },
  { title: "입사", lines: ["영업장 상황별", "전문 인력 투입"] },
  { title: "관리", lines: ["정기적 면담", "더채움 복지시스템", "매년 건강검진 실시"] },
];

// 4번 화면 상단 교육 지표 데이터
const cateringEducationStats: CateringEducationStat[] = [
  { label: "정기교육실시", value: "97%" },
  { label: "비정기교육실시", value: "3%" },
];

// 4번 화면 교육 본문 카드 데이터
const cateringEducationCards: CateringEducationCard[] = [
  {
    title: "본사 교육",
    description:
      "현장 직원 대상 정기 교육을 실시하고,\n교육 결과에 대한 평가를 통해\n인사고과에 반영합니다.\n이를 바탕으로 지속적인 역량 향상과\n현장 운영 개선을 도모합니다.",
  },
  {
    title: "본사 소통",
    description:
      "현장 영양사와 본사 간 월 1회\n정기 미팅을 통해 현장 이슈를 공유하고\n개선 방향을 논의합니다.\n또한 현장 정기 방문을 통해\n세스코 자료를 기반으로\n한 위생 평가와 교육을 실시합니다.",
  },
  {
    title: "협력사 주관 교육",
    description:
      "위생·안전 강화를 위해 월 1회\n세스코 교육을 진행합니다.\n이중 점검 체계를 통해 현장 관리 수준을 높이고, \n 최신 위생 기준과 관리 방안을 \n 현장에 적용합니다.",
  },
  {
    title: "세스코 위생 모니터링",
    description:
      "현장 관리 경험이 풍부한 영양사와 \n 본사가 함께 참여하여 정기적인 \n 위생 모니터링을 실시합니다.\n세스코 기준에 따른 체계적인 점검으로\n현장의 위생 상태를 지속적으로 관리합니다.",
  },
  {
    title: "위생 / 안전 관리",
    description:
      "㈜더채움 전 사업장에 세스코 멤버십 서비스를 \n 적용하여 통합적인 위생·안전 관리 시스템을 \n 운영하고 있습니다.\n일관된 기준과 철저한 관리로\n안심할 수 있는 급식 환경을 제공합니다.",
  },
];

// 5번 화면 레시피/트렌드/건강메뉴 설명 데이터
const cateringResearchItems: CateringResearchItem[] = [
  {
    label: "표준레시피 시스템",
    description:
      "급식에 자주 활용되는 주요 메뉴 2000여개의 레시피를 설계하여 \n 식사 품질 균일화 표준 레시피를 전 사업장 배포하여 관리",
  },
  {
    label: "글로벌 트렌드 연구",
    description:
      "현장 출신 담당자들이 빠르게 변화하는 메뉴 트렌드를 캐치하여 유행하는 \n디저트 혹은 이국적인 메뉴를 특식으로 제공",
  },
  {
    label: "건강메뉴 제공",
    description: "식약처 권장 나트륨 기준을 지키며 매끼 표준염도계를 사용하여 \n저염 조리법으로 건강 메뉴를 제공",
  },
];

// 5번 화면 중간 강조 박스 데이터
const cateringSafetyChips = [
  "현장 전문 영양사 및 본사 위생팀의 교육과\n철저한 관리를 통한 사업이래 무사고 운영",
  "국내 최고 위생 서비스를 자랑하는 세스코와의\n업무협약을 통한 수준높은 위생서비스 제공",
  "각 지역 구청을 통한 단체급식 전문\n식중독 예방제 실시",
];

// 5번 화면 하단 채용 블록 데이터
const cateringRecruitBlocks: CateringRecruitBlock[] = [
  { title: "정규직 채용", lines: ["안정적인 관리를 위해 전직원 정규직 채용", "장기근속 多"] },
  {
    title: "긴급인력",
    lines: [
      "비상 상황 발생 시 자사의 인력관리 시스템과\n노하우를 활용한 신속한 대응 가능",
      "파출 서비스 운영을 통한 즉시 투입 가능한 인력 확보",
    ],
  },
];

// 급식서비스 화면: CateringServicePage 함수 로직
export default async function CateringServicePage() {
  const canManageContact = await getContactManageAccess();
  const cateringHeaderRightItems = appendContactManageMenu(cateringHeaderRightBaseItems, canManageContact);

  return (
    <main
      id="catering_scroll"
      className="catering_page h-[100svh] overflow-x-hidden overflow-y-auto snap-y snap-mandatory scroll-smooth bg-white text-[#111111]"
    >
      <CateringScrollController containerId="catering_scroll" sectionSelector="[data-catering-section]" />

      {/* 1번 화면 메뉴구성 흐름도 */}
      <section
        id="catering_flow"
        data-catering-section
        className="catering_screen catering_screen_with_header snap-start relative"
      >
        <SiteHeader
          leftItems={cateringHeaderLeftItems}
          rightItems={cateringHeaderRightItems}
          lightBackground
        />
        {/* 흐름도 본문 정렬 래퍼 */}
        <div className="catering_screen_body">
          {/* 흐름도 가로 기준 폭 컨테이너 */}
          <div className="catering_screen_inner">
            {/* 노드/연결선 좌표 보드 */}
            <div className="catering_flow_board">
              {cateringFlowNodes.map((node, index) => (
                <div
                  key={node.text}
                  className={`catering_flow_node ${node.className} ${
                    node.type === "outline" ? "catering_flow_node_outline" : "catering_flow_node_dark"
                  } ${node.tooltip ? "catering_flow_node_hover_anchor" : ""}`}
                  tabIndex={node.tooltip ? 0 : undefined}
                  style={{ ["--catering-flow-node-order" as any]: index } as CSSProperties}
                >
                  <span>{node.text}</span>
                  {node.tooltip ? (
                    <div className="catering-hover-tooltip catering-hover-tooltip-right" role="tooltip">
                      <p className="catering-hover-tooltip-text">{node.tooltip}</p>
                    </div>
                  ) : null}
                </div>
              ))}
              <svg
                className="catering_flow_svg"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
                focusable="false"
              >
                {/* 데스크톱/태블릿 흐름선 세트 */}
                <g className="catering_flow_lines_default">
                  <path
                    d="M13.4 13.5 V67.5"
                    className="catering_flow_path"
                    style={{ ["--catering-flow-line-order" as any]: 0 } as CSSProperties}
                  />
                  <path
                    d="M13.4 40.5 H44.2"
                    className="catering_flow_path catering_flow_needs_line_default"
                    style={{ ["--catering-flow-line-order" as any]: 1 } as CSSProperties}
                  />
                  <path
                    d="M13.4 40.5 H44.3"
                    className="catering_flow_path catering_flow_needs_line_small"
                    style={{ ["--catering-flow-line-order" as any]: 1 } as CSSProperties}
                  />
                  <path
                    d="M44.4 25.5 V53.5"
                    className="catering_flow_path"
                    style={{ ["--catering-flow-line-order" as any]: 2 } as CSSProperties}
                  />
                  <path
                    d="M44.4 53.5 H68.2"
                    className="catering_flow_path"
                    style={{ ["--catering-flow-line-order" as any]: 3 } as CSSProperties}
                  />
                  <path
                    d="M68.2 53.5 H88.2"
                    className="catering_flow_path"
                    style={{ ["--catering-flow-line-order" as any]: 4 } as CSSProperties}
                  />
                  {/* 기본 화면: 화살표 */}
                  <g className="catering_flow_arrow_default">
                    <path
                      d="M88.2 53.5 V77.8 H44.4"
                      className="catering_flow_path"
                      style={{ ["--catering-flow-line-order" as any]: 5 } as CSSProperties}
                    />
                    <path
                      d="M44.4 61.2 V77.8"
                      className="catering_flow_path"
                      style={{ ["--catering-flow-line-order" as any]: 6 } as CSSProperties}
                    />
                    <path
                      d="M42.8 63.4 L44.4 60.8 L46 63.4"
                      className="catering_flow_svg_arrowhead"
                      style={{ ["--catering-flow-line-order" as any]: 7 } as CSSProperties}
                    />
                  </g>

                  {/* 작은 화면: 화살표 */}
                  <g className="catering_flow_arrow_small">
                    <path
                      d="M88.2 60.7 V80.4 H44.4"
                      className="catering_flow_path"
                      style={{ ["--catering-flow-line-order" as any]: 5 } as CSSProperties}
                    />
                    <path
                      d="M44.4 64.6 V80.4"
                      className="catering_flow_path"
                      style={{ ["--catering-flow-line-order" as any]: 6 } as CSSProperties}
                    />
                    <g transform="translate(0 3.4)">
                      <path
                        d="M42.8 63.4 L44.4 60.8 L46 63.4"
                        className="catering_flow_svg_arrowhead"
                        style={{ ["--catering-flow-line-order" as any]: 7 } as CSSProperties}
                      />
                    </g>
                  </g>
                </g>

                {/* 모바일 흐름선 세트 */}
                <g className="catering_flow_lines_mobile">
                  {/* 상단 3개 분석 노드를 본사/사업장 사이 연결선에 합류 */}
                  <path
                    d="M17 29 V52"
                    className="catering_flow_path"
                    style={{ ["--catering-flow-line-order" as any]: 0 } as CSSProperties}
                  />
                  <path
                    d="M50 29 V52"
                    className="catering_flow_path"
                    style={{ ["--catering-flow-line-order" as any]: 1 } as CSSProperties}
                  />
                  <path
                    d="M83 29 V52"
                    className="catering_flow_path"
                    style={{ ["--catering-flow-line-order" as any]: 2 } as CSSProperties}
                  />
                  <path
                    d="M17 52 H83"
                    className="catering_flow_path"
                    style={{ ["--catering-flow-line-order" as any]: 3 } as CSSProperties}
                  />
                  <path
                    d="M50 48 V56"
                    className="catering_flow_path"
                    style={{ ["--catering-flow-line-order" as any]: 4 } as CSSProperties}
                  />

                  {/* 사업장 메뉴 구성 이후 하단 결과 노드로 순차 연결 */}
                  <path
                    d="M50 65 V86"
                    className="catering_flow_path"
                    style={{ ["--catering-flow-line-order" as any]: 5 } as CSSProperties}
                  />

                  {/* 고객 입맛 식단 구성에서 사업장 메뉴 구성으로 피드백 루프 */}
                  <path
                    d="M50 95 H88 V60 H50"
                    className="catering_flow_path"
                    style={{ ["--catering-flow-line-order" as any]: 6 } as CSSProperties}
                  />
                  <path
                    d="M52.2 58.6 L49.8 60 L52.2 61.4"
                    className="catering_flow_svg_arrowhead"
                    style={{ ["--catering-flow-line-order" as any]: 7 } as CSSProperties}
                  />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 2번 화면 체계적 메뉴 관리 단계 */}
      <section id="catering_stage" data-catering-section className="catering_screen catering_screen_stage snap-start">
        {/* 3단 접시 패널 본문 래퍼 */}
        <div className="catering_screen_body">
          {/* 3열 접시 패널 그리드 */}
          <div className="catering_stage_grid">
            {cateringStageCards.map((card) => (
              <article key={card.step} className={`catering_stage_panel ${card.panelClassName}`}>
                <div className={`catering_stage_image_wrap ${card.imageClassName}`}>
                  <Image
                    src={card.image}
                    alt={card.step}
                    fill
                    quality={100}
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="catering_stage_image"
                  />
                </div>
                <div className="catering_stage_text">
                  <strong>{card.step}</strong>
                  <p>{card.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3번 화면 메뉴개발/품질연구 표 + 프로세스 */}
      <section id="catering_compare" data-catering-section className="catering_screen snap-start">
        {/* 비교표/프로세스 본문 래퍼 */}
        <div className="catering_screen_body">
          {/* 비교표와 프로세스 묶음 컨테이너 */}
          <div className="catering_screen_inner catering_compare_inner">
            <div className="catering_compare_top_tabs">
              <span>메뉴개발</span>
              <span>품질연구</span>
            </div>

            {/* 인력/급여/영양사/관리체계 비교표 */}
            <div className="catering_compare_table">
              <div className="catering_compare_cell catering_compare_cell_head">구분</div>
              <div className="catering_compare_cell catering_compare_cell_head">일반업체</div>
              <div className="catering_compare_cell catering_compare_cell_head">더채움</div>
              {cateringCompareRows.map((row) => (
                <div key={row.label} className="catering_compare_row_group">
                  <div key={`${row.label}-label`} className="catering_compare_cell catering_compare_cell_side">
                    {row.label}
                  </div>
                  <div key={`${row.label}-default`} className="catering_compare_cell">
                    {row.defaultValue}
                  </div>
                  <div key={`${row.label}-chaewoom`} className="catering_compare_cell">
                    {row.chaewoomValue}
                  </div>
                </div>
              ))}
            </div>

            {/* 모집-채용-입사-관리 운영 프로세스 카드 */}
            <div className="catering_process_row">
              {cateringProcessCards.map((card, index) => (
                <article key={card.title} className="catering_process_card">
                  <div className="catering_process_card_head">{card.title}</div>
                  <div
                    className="catering_process_card_body"
                    style={{ ["--process-row-count" as any]: card.lines.length } as CSSProperties}
                  >
                    {card.lines.map((line) => (
                      <p key={`${card.title}-${line}`}>{line}</p>
                    ))}
                  </div>
                  {index < cateringProcessCards.length - 1 && (
                    <Image
                      src="/images/catering_service/arrow_1.svg"
                      alt="다음 단계"
                      width={40}
                      height={20}
                      className="catering_process_arrow"
                    />
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4번 화면 교육/소통 지표 */}
      <section id="catering_education" data-catering-section className="catering_screen snap-start">
        {/* 교육 지표/본문 래퍼 */}
        <div className="catering_screen_body">
          {/* 교육 섹션 콘텐츠 컨테이너 */}
          <div className="catering_screen_inner catering_education_inner">
            <div className="catering_education_stats">
              {cateringEducationStats.map((item) => (
                <article key={item.label} className="catering_education_stat_item">
                  <span className="catering_education_stat_label">{item.label}</span>
                  <strong className="catering_education_stat_value" data-target={item.value}>0%</strong>
                </article>
              ))}
            </div>

            {/* 교육/소통 카드 슬라이드 영역 */}
            <CateringEducationCarousel cards={cateringEducationCards} />
          </div>
        </div>
      </section>

      {/* 5번 화면 레시피/위생/채용 */}
      <section id="catering_research" data-catering-section className="catering_screen snap-start">
        {/* 레시피/안전/채용 본문 래퍼 */}
        <div className="catering_screen_body">
          {/* 마지막 섹션 콘텐츠 컨테이너 */}
          <div className="catering_screen_inner catering_research_inner">
            {/* 표준레시피/트렌드/건강메뉴 설명 행 */}
            <div className="catering_research_list">
              {cateringResearchItems.map((item) => (
                <article key={item.label} className="catering_research_item">
                  <span className="catering_research_badge">{item.label}</span>
                  <p className="catering_research_description">{item.description}</p>
                </article>
              ))}
            </div>

            {/* 위생/안전 강조 박스 3개 */}
            <div className="catering_safety_chip_row">
              {cateringSafetyChips.map((item) => (
                <div key={item} className="catering_safety_chip">
                  {item}
                </div>
              ))}
            </div>

            {/* 정규직 채용/긴급인력 안내 블록 */}
            <div className="catering_recruit_blocks">
              {cateringRecruitBlocks.map((block) => (
                <article key={block.title} className="catering_recruit_block">
                  <h3>{block.title}</h3>
                  <ul>
                    {block.lines.map((line) => (
                      <li key={`${block.title}-${line}`}>{line}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 급식서비스 페이지 공통 상단 이동 버튼 */}
      <ScrollToTopButton targetId="catering_scroll" />
    </main>
  );
}
