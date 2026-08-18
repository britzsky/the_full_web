import type { Metadata } from "next";
import TheFullLogo from "@/app/components/Common/TheFullLogo";
import PageNavigationLink from "@/app/components/Common/PageNavigationLink";
import ContactInstagramForm from "./ContactInstagramForm";
import "./page.css";

// 인스타그램 간편문의 화면: 페이지 메타데이터
export const metadata: Metadata = {
  title: "(주)더채움 | 간편문의",
};

// 인스타그램 간편문의 화면: 인스타그램 링크 전용 최소 항목 문의 페이지
// 업장명/담당자 성함/연락처/이메일/문의내용 5개 항목만 노출한다.
export default function ContactInstagramPage() {
  return (
    <main className="contact-ig-page">
      <header className="contact-ig-header">
        <PageNavigationLink href="/" className="contact-ig-logo-link">
          <TheFullLogo width={132} height={42} className="contact-ig-logo" />
        </PageNavigationLink>
      </header>

      <section className="contact-ig-hero">
        <p className="contact-ig-notice">
          <span style={{ color: "#ED7736" }}>고객만족</span>을 넘어 <span style={{ color: "#19A8F4" }}>고객감동</span>으로
          <br className="contact-ig-notice-break" />
          <span style={{ color: "#7EB14B" }}>가득찬 밥상</span>을 약속드립니다.
        </p>
      </section>

      <section className="contact-ig-form-section">
        <ContactInstagramForm />
      </section>
    </main>
  );
}
