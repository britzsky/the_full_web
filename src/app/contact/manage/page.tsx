import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import CommonSearchSelect from "@/app/components/Common/CommonSearchSelect";
import SiteHeader, { SiteHeaderMenuItem } from "@/app/components/Common/SiteHeader";
import ScrollToTopButton from "@/app/components/Common/ScrollToTopButton";
import { appendContactManageMenu } from "@/app/components/Common/headerMenuUtils";
import { getContactManageAccess } from "@/app/lib/adminAccess";
import { ContactManageTableClient } from "./contactManageClient";
import "./page.css";

type ContactManageSearchField = "title" | "businessName" | "managerName";

type ContactManagePageSearchParams = {
  q?: string;
  field?: string;
};

type ContactManagePageProps = {
  searchParams?: Promise<ContactManagePageSearchParams>;
};

const toSearchField = (value: string | undefined): ContactManageSearchField => {
  if (value === "businessName" || value === "managerName") {
    return value;
  }
  return "title";
};

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

const contactManageSearchFieldOptions = [
  { value: "title", label: "제목" },
  { value: "businessName", label: "업장명" },
  { value: "managerName", label: "담당자" },
];

// 문의관리 목록 페이지 렌더링
export default async function ContactManagePage({ searchParams }: ContactManagePageProps) {
  noStore();

// 문의관리 화면: 검색 파라미터 정리
  const resolvedSearchParams: ContactManagePageSearchParams = (await Promise.resolve(searchParams)) ?? {};
  const query = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q.trim() : "";
  const field = toSearchField(
    typeof resolvedSearchParams.field === "string" ? resolvedSearchParams.field : undefined
  );
// 문의관리 화면: 상태값
  const canManage = await getContactManageAccess();
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

          <form className="contact-manage-search-form" method="get">
            <label className="contact-manage-sr-only" htmlFor="contact-manage-field">
              검색 구분
            </label>
            <CommonSearchSelect
              id="contact-manage-field"
              name="field"
              defaultValue={field}
              options={contactManageSearchFieldOptions}
              wrapperClassName="contact-manage-search-select"
            />
            <label className="contact-manage-sr-only" htmlFor="contact-manage-query">
              검색어
            </label>
            <input
              id="contact-manage-query"
              name="q"
              defaultValue={query}
              className="contact-manage-search-input"
              placeholder="검색어를 입력해 주세요."
            />
            <button type="submit" className="contact-manage-search-button">
              검색
            </button>
          </form>

          <ContactManageTableClient refreshKey={refreshKey} query={query} field={field} />
        </div>
      </section>

      <ScrollToTopButton targetId="contact_manage_scroll" />
    </main>
  );
}
