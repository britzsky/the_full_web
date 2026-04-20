import Image from "next/image";
import type { Metadata } from "next";
import SiteHeader, { SiteHeaderMenuItem } from "@/app/components/Common/SiteHeader";
import ScrollToTopButton from "@/app/components/Common/ScrollToTopButton";
import { appendContactManageMenu } from "@/app/components/Common/headerMenuUtils";
import { getContactManageAccess } from "@/app/lib/adminAccess";
import CompanyProfileMotion from "./CompanyProfileMotion";
import "./page.css";

// 1번 화면 대표 인사 이미지 경로
const companyGreetingImage = "/images/company_profile/ceo.jpg";
const companyGreetingSignImage = "/images/company_profile/ceo_sign1.png";
// 회사명은 줄바꿈 시 '(주)'와 본문이 분리되지 않도록 단어 결합자를 사용한다.
const companyName = "(주)\u2060더채움";

// 1번 화면(대표 인사) 데이터
const companyGreetingParagraphs = [
  `안녕하십니까, ${companyName} 대표이사 최희영입니다.\n저희 ${companyName}은 고객 한 분 한 분의 건강과 행복을 위해 정직과 신뢰를 바탕으로 \n항상 최선을 다해왔습니다.`,
  "엄선된 식재료와 정성 어린 조리, 철저한 위생 관리로 맛과 안전을 모두 담은 식사를 준비하며, 늘 고객의 목소리에 귀 기울이고 함께 성장하는 파트너가 되겠습니다.",
  "여러분의 일상에 작은 감동을 더하는 한 끼, \n그 마음을 담아 오늘도 최선을 다하겠습니다.",
];

// 2번 화면(비전/미션) 데이터
const companyVisionMission = [
  {
    title: "비전",
    description: "정직과 신뢰를 바탕으로 식음 서비스 분야에서\n고객에게 가장 신뢰받는 파트너가 됩니다.",
    image: "/images/company_profile/vision.jpg",
  },
  {
    title: "미션",
    description: "모두가 행복한 식사문화를 누릴 수 있는\n안전하고 맛있는 식품과 서비스를 제공합니다.",
    image: "/images/company_profile/mission.jpg",
  },
];

// 3번 화면(로고/브랜드 컬러) 데이터
const companyBrandDescriptionLines = [
  "프로그램 개발을 통해 체계화된 운영 시스템과 현장에서 축적된 노하우를 바탕으로 한 신뢰의 가치를 담고 있습니다.",
  "표준화된 시스템을 통해 메뉴 관리, 위생·안전, 현장 운영 전반에서 사업장 간 운영 편차 없이 일관된 품질의 급식 서비스를 제공합니다.",
  "정직한 운영과 안정적인 시스템으로 언제나 믿고 맡길 수 있는 식음 서비스 기업의 방향성을 상징합니다.",
];

// 3번 화면 핵심가치 컬러/문구 데이터
const companyCoreValues = [
  {
    hex: "#59853c",
    message: "늘 새로운 가치와 건강한 식재료",
    color: "#59853c",
  },
  {
    hex: "#1797cc",
    message: "투명한 경영, 고객과의 약속을 지키는 마음",
    color: "#1797cc",
  },
  {
    hex: "#df8929",
    message: "함께 나누는 행복, 긍정적인 에너지",
    color: "#df8929",
  },
];
// 회사소개 페이지 공통 헤더 메뉴
const companyHeaderLeftItems: SiteHeaderMenuItem[] = [
  { label: "회사소개", href: "#company-greeting" },
  { label: "사업영역", href: "/business_area" },
  { label: "급식서비스", href: "/catering_service" },
];

// 회사소개 페이지 공통 헤더 우측 메뉴
const companyHeaderRightBaseItems: SiteHeaderMenuItem[] = [
  { label: "홍보", href: "/social" },
  { label: "채용", href: "/recruit" },
  { label: "고객문의", href: "/contact", isCta: true },
];

// 회사소개 화면: 페이지 메타데이터
export const metadata: Metadata = {
  // 회사소개 페이지 메타데이터
  title: "(주)더채움 | 회사소개",
};

// 회사소개 화면: CompanyPage 함수 로직
export default async function CompanyPage() {
  const canManageContact = await getContactManageAccess();
  const companyHeaderRightItems = appendContactManageMenu(companyHeaderRightBaseItems, canManageContact);

  return (
    <main
      id="company-scroll"
      className="company-page h-[100svh] overflow-x-hidden overflow-y-auto bg-white text-[#111111]"
    >
      <CompanyProfileMotion />

      {/* 1번 화면: 대표 인사 */}
      <section id="company-greeting" className="company-screen company-screen-with-header relative">
        <SiteHeader
          leftItems={companyHeaderLeftItems}
          rightItems={companyHeaderRightItems}
          lightBackground
        />

        {/* 1번 화면 본문 정렬 래퍼 */}
        <div className="company-screen-body">
          {/* 1번 화면 콘텐츠 폭 컨테이너 */}
          <div className="company-screen-inner company-greeting-inner">
            {/* 대표 이미지/인사말 2열 레이아웃 */}
            <div className="company-greeting-grid">
              <div className="company-greeting-image-frame company-enter-up">
                <Image
                  src={companyGreetingImage}
                  alt="대표 인사 이미지"
                  fill
                  quality={100}
                  sizes="(max-width: 1024px) 86vw, 420px"
                  className="company-greeting-image"
                />
              </div>

              <div className="company-greeting-copy company-enter-up company-enter-delay-1">
                {companyGreetingParagraphs.map((paragraph) => (
                  <p key={paragraph} className="company-greeting-paragraph">
                    {paragraph}
                  </p>
                ))}

                <div className="company-greeting-signature">
                  <span className="company-greeting-signature-label">CEO</span>
                  <Image
                    src={companyGreetingSignImage}
                    alt="CEO 서명"
                    width={180}
                    height={64}
                    quality={100}
                    draggable={false}
                    className="company-greeting-signature-image"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2번 화면: 비전/미션 */}
      <section id="company-vision-mission" className="company-screen">
        {/* 2번 화면 본문 정렬 래퍼 */}
        <div className="company-screen-body">
          {/* 비전/미션 콘텐츠 컨테이너 */}
          <div className="company-screen-inner company-vm-inner">
            {/* 비전/미션 2열 그리드 */}
            <div className="company-vm-grid">
              {companyVisionMission.map((item, index) => (
                <article
                  key={item.title}
                  className={`company-vm-item company-enter-up ${
                    index === 0 ? "company-enter-delay-vm-1" : "company-enter-delay-vm-2"
                  }`}
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
        </div>
      </section>

      {/* 3번 화면: 로고/브랜드 컬러 */}
      <section id="company-brand" className="company-screen">
        {/* 3번 화면 본문 정렬 래퍼 */}
        <div className="company-screen-body">
          {/* 로고/브랜드컬러 콘텐츠 컨테이너 */}
          <div className="company-screen-inner company-brand-inner">
            <div className="company-logo-frame" data-company-motion="zoom">
              <Image
                src="/images/company_profile/thefull_logo.jpg"
                alt="더채움 로고 이미지"
                fill
                quality={100}
                sizes="(max-width: 1024px) 94vw, 640px"
                className="company-logo-image"
              />
            </div>

            <p className="company-intro-description" data-company-motion="up-delay-1">
              {companyBrandDescriptionLines.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </p>

            <div className="company-values-grid">
              {companyCoreValues.map((item, index) => (
                <article
                  key={item.hex}
                  className="company-value-item"
                  data-company-motion={
                    index === 0 ? "up-delay-1" : index === 1 ? "up-delay-2" : "up-delay-3"
                  }
                >
                  <span className="company-value-dot" style={{ backgroundColor: item.color }} aria-hidden="true" />
                  <strong className="company-value-hex">{item.hex}</strong>
                  <p className="company-value-copy">{item.message}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 회사소개 페이지 공통 상단 이동 버튼 */}
      <ScrollToTopButton targetId="company-scroll" />
    </main>
  );
}
