import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import SiteHeader, { SiteHeaderMenuItem } from "@/app/components/Common/SiteHeader";
import ScrollToTopButton from "@/app/components/Common/ScrollToTopButton";
import { appendContactManageMenu } from "@/app/components/Common/headerMenuUtils";
import { getAdminAccess } from "@/app/lib/adminAccess";
import { ContactManageTableClient } from "./contactManageClient";
import "./page.css";

// 문의관리 목록 페이지 메타데이터
export const metadata: Metadata = {
  // 문의관리 페이지 메타데이터
  title: "(주)더채움 | 문의관리",
};

// 문의관리 페이지 헤더 좌측 메뉴
const contactManageHeaderLeftItems: SiteHeaderMenuItem[] = [
  { label: "회사소개", href: "/company_profile" },
  { label: "사업영역", href: "/business_area" },
  { label: "급식서비스", href: "/catering_service" },
];

// 문의관리 페이지 헤더 우측 기본 메뉴
const contactManageHeaderRightBaseItems: SiteHeaderMenuItem[] = [
  { label: "홍보", href: "/promotion" },
  { label: "채용", href: "/recruit" },
  { label: "고객문의", href: "/contact", isCta: true },
];

// 문의관리 목록 페이지 렌더링
export default async function ContactManagePage() {
  noStore();

// 문의관리 화면: 상태값
  const canManage = await getAdminAccess();
  if (!canManage) {
    notFound();
  }

// 문의관리 화면: rightItems 정의
  const rightItems = appendContactManageMenu(contactManageHeaderRightBaseItems, canManage);
  const refreshKey = Date.now().toString();

  return (
    <main
      id="contact_manage_scroll"
      className="contact-manage-page h-[100svh] overflow-x-hidden overflow-y-auto bg-white text-[#111111]"
    >
      {/* 문의관리 목록 페이지 공통 헤더 영역 */}
      <section className="contact-manage-header-shell relative">
        <SiteHeader
          leftItems={contactManageHeaderLeftItems}
          rightItems={rightItems}
          lightBackground
        />
      </section>

      {/* 문의관리 목록 본문 섹션(문의 목록 테이블) */}
      <section className="contact-manage-section">
        <div className="contact-manage-wrap">
          <h1 className="contact-manage-title">문의관리</h1>

          <ContactManageTableClient refreshKey={refreshKey} />
        </div>
      </section>

      <ScrollToTopButton targetId="contact_manage_scroll" />
    </main>
  );
}
