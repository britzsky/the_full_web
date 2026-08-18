import type { Metadata } from "next";
import TheFullLogo from "@/app/components/Common/TheFullLogo";
import PageNavigationLink from "@/app/components/Common/PageNavigationLink";
import ContactInstagramForm from "./ContactInstagramForm";
import "./page.css";

// 인스타그램 간편문의 화면: 브라우저 탭 제목 등에 쓰이는 페이지 메타데이터
// (기존 /contact 페이지와 구분되도록 "간편문의"로 별도 표기)
export const metadata: Metadata = {
  title: "(주)더채움 | 간편문의",
};

// 인스타그램 간편문의 화면: 인스타그램 프로필 링크/스토리 링크스티커 전용으로 만든 최소 항목 문의 페이지
// - 인스타그램은 링크를 탭하면 앱을 벗어나지 않고 자체 인앱 브라우저(웹뷰)로 이 주소를 그대로 띄운다.
// - 기존 /contact 전체 문의폼(11개 항목)은 그대로 두고, 이 페이지는 그중 핵심 5개 항목
//   (업장명/담당자 성함/연락처/이메일/문의내용)만 노출해 인스타그램에서 빠르게 문의를 남길 수 있게 한다.
// - 나머지 항목(식단가/일 식수/식사·업장 구분/제목 등)은 DB 컬럼이 nullable로 되어 있어
//   ContactInstagramForm에서 아예 전송하지 않으면 서버에서 NULL로 저장된다.
export default function ContactInstagramPage() {
  return (
    <main className="contact-ig-page">
      {/* 상단 헤더: 다른 페이지처럼 전체 메뉴를 넣지 않고 로고(홈 이동 링크)만 최소로 배치 */}
      <header className="contact-ig-header">
        <PageNavigationLink href="/" className="contact-ig-logo-link">
          <TheFullLogo width={132} height={42} className="contact-ig-logo" />
        </PageNavigationLink>
      </header>

      {/* 안내 문구: 기존 /contact 페이지 문의 섹션에 있는 문구를 색상까지 동일하게 재사용 */}
      <section className="contact-ig-hero">
        <p className="contact-ig-notice">
          <span style={{ color: "#ED7736" }}>고객만족</span>을 넘어 <span style={{ color: "#19A8F4" }}>고객감동</span>으로
          <br className="contact-ig-notice-break" />
          <span style={{ color: "#7EB14B" }}>가득찬 밥상</span>을 약속드립니다.
        </p>
      </section>

      {/* 실제 입력 폼은 별도 클라이언트 컴포넌트(ContactInstagramForm)에서 상태/제출 로직까지 처리 */}
      <section className="contact-ig-form-section">
        <ContactInstagramForm />
      </section>
    </main>
  );
}
