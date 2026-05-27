import Image from "next/image";
import type { Metadata } from "next";
import SiteHeader, { SiteHeaderMenuItem } from "@/app/components/Common/SiteHeader";
import ScrollToTopButton from "@/app/components/Common/ScrollToTopButton";
import SectionTitle from "@/app/components/Common/SectionTitle";
import ContactInquiryForm from "./ContactInquiryForm";
import { ContactQualitySectionAnimated, ContactFormSectionAnimated } from "./ContactAnimatedSections";
import { appendContactManageMenu } from "@/app/components/Common/headerMenuUtils";
import { getContactManageAccess } from "@/app/lib/adminAccess";
import "./page.css";

// 고객문의 화면: ContactQualityRow 타입 모델
type ContactQualityRow = {
  label: string;
  content: string;
};

// 고객문의 화면: 페이지 메타데이터
export const metadata: Metadata = {
  // 고객문의 페이지 메타데이터
  title: "(주)더채움 | 고객문의",
};

// 고객문의 화면: 헤더 좌측 메뉴 목록
const contactHeaderLeftItems: SiteHeaderMenuItem[] = [
  { label: "회사소개", href: "/company_profile" },
  { label: "사업영역", href: "/business_area" },
  { label: "급식서비스", href: "/catering_service" },
];

// 고객문의 화면: 헤더 우측 메뉴 목록
const contactHeaderRightBaseItems: SiteHeaderMenuItem[] = [
  { label: "홍보", href: "/social" },
  { label: "채용", href: "/recruit" },
  // 고객문의 화면: 타 페이지와 헤더 메뉴 위치/구성을 동일하게 유지
  { label: "고객문의", href: "/contact", isCta: true },
];

// 고객문의 화면: contactQualityRows 정의
const contactQualityRows: ContactQualityRow[] = [
  {
    label: "수량",
    content: "본사 차원의 관리로 과다 구매를 예방하여 신선도 유지 및 재고 손실 최소화",
  },
  {
    label: "유통기한",
    content: "신선하고 품질이 높은 식자재 확보를 위한 현지에서 갓 생산한 식자재 구매",
  },
  {
    label: "원산지표기",
    content: "HACCP에 준하는 식자재 관련 품질기준을 적용한 식자재 구매 및 인증을 취득한 식자재 구매",
  },
  {
    label: "브랜드",
    content:
      "웰스토리·아워홈·한화·동원 등 대기업 식자재 업체와 직거래하며, 국내산 및 G마크·HACCP 인증 제품만 사용",
  },
];

// 고객문의 화면: ContactPage 함수 로직
export default async function ContactPage() {
  const canManageContact = await getContactManageAccess();
  const contactHeaderRightItems = appendContactManageMenu(contactHeaderRightBaseItems, canManageContact);

  return (
    <main
      id="contact_scroll"
      // 고객문의 화면: 다른 탭과 동일한 헤더 메뉴 좌표 기준(고정 높이 + 내부 스크롤) 유지
      className="contact-page h-[100svh] overflow-x-hidden overflow-y-auto bg-[#FAFAF8] text-[#111111]"
    >
      <section className="contact-hero relative">
        <Image
          src="/images/contact/contact_1.webp"
          alt="고객문의 배경"
          fill
          priority
          sizes="100vw"
          className="contact-hero-image"
        />
        <div className="contact-hero-overlay" />
        <SiteHeader
          leftItems={contactHeaderLeftItems}
          rightItems={contactHeaderRightItems}
        />
        <div className="contact-hero-copy">
          <h1 className="contact-hero-title">
            <span className="contact-hero-line">궁금한 점이 있다면 언제든 남겨주세요.</span>
            <span className="contact-hero-line contact-hero-line-sub">확인 후 정성껏 답변드리겠습니다.</span>
          </h1>
        </div>
      </section>

      <ContactQualitySectionAnimated>
        <SectionTitle englishLabel="Quality Standards">식자재 품질관리 기준</SectionTitle>
        <div className="contact-content-wrap">
          <div className="contact-quality-table-wrap">
            <div className="contact-quality-table">
              <div className="contact-quality-cell contact-quality-cell-head">구매기준</div>
              <div className="contact-quality-cell contact-quality-cell-head">주요내용</div>
              {contactQualityRows.map((row) => (
                <div key={row.label} className="contact-quality-row-group">
                  <div className="contact-quality-cell contact-quality-cell-side">{row.label}</div>
                  <div className="contact-quality-cell">{row.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ContactQualitySectionAnimated>

      <ContactFormSectionAnimated>
        <SectionTitle englishLabel="Customer Inquiry">고객문의</SectionTitle>
        <div className="contact-content-wrap">
          <p className="contact-form-notice">
            <span style={{ color: "#ED7736" }}>고객만족</span>을 넘어 <span style={{ color: "#19A8F4" }}>고객감동</span>으로<br className="contact-form-notice-break" /><span style={{ color: "#7EB14B" }}>가득찬 밥상</span>을 약속드립니다.
          </p>
          <hr className="contact-form-divider" />
          <ContactInquiryForm />
        </div>
      </ContactFormSectionAnimated>

      <ScrollToTopButton targetId="contact_scroll" />
    </main>
  );
}
