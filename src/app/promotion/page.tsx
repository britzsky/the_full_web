import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import PageNavigationLink from "@/app/components/Common/PageNavigationLink";
import SiteHeader, { SiteHeaderMenuItem } from "@/app/components/Common/SiteHeader";
import ScrollToTopButton from "@/app/components/Common/ScrollToTopButton";
import { appendContactManageMenu } from "@/app/components/Common/headerMenuUtils";
import { getAdminAccess } from "@/app/lib/adminAccess";
import { getPromotionManagePermission } from "./permissions";
import { PromotionListTableClient } from "./promotionClient";
import type { PromotionSearchField } from "./types";
import "./page.css";

// 홍보 화면: PromotionPageSearchParams 타입 모델
type PromotionPageSearchParams = {
  q?: string;
  field?: string;
};

// 홍보 화면: 컴포넌트 전달값
type PromotionPageProps = {
  searchParams?: Promise<PromotionPageSearchParams>;
};

// 홍보 화면: 페이지 메타데이터
export const metadata: Metadata = {
  // 홍보 목록 페이지 메타데이터
  title: "(주)더채움 | 홍보",
};

// 홍보 화면: 헤더 좌측 메뉴 목록
const promotionHeaderLeftItems: SiteHeaderMenuItem[] = [
  { label: "회사소개", href: "/company_profile" },
  { label: "사업영역", href: "/business_area" },
  { label: "급식서비스", href: "/catering_service" },
];

// 홍보 화면: 헤더 우측 메뉴 목록
const promotionHeaderRightBaseItems: SiteHeaderMenuItem[] = [
  { label: "홍보", href: "#promotion_list" },
  { label: "채용", href: "/recruit" },
  { label: "고객문의", href: "/contact", isCta: true },
];

// 홍보 화면: toSearchField 정의
const toSearchField = (value: string | undefined): PromotionSearchField => {
  if (value === "content" || value === "all") {
    return value;
  }
  return "title";
};

// 홍보 화면: PromotionPage 함수 로직
export default async function PromotionPage({ searchParams }: PromotionPageProps) {
  noStore();

// 홍보 화면: resolvedSearchParams 정의
  const resolvedSearchParams: PromotionPageSearchParams = (await Promise.resolve(searchParams)) ?? {};
// 홍보 화면: query 정의
  const query = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q.trim() : "";
// 홍보 화면: field 정의
  const field = toSearchField(
    typeof resolvedSearchParams.field === "string" ? resolvedSearchParams.field : undefined
  );

  const [canManagePromotion, canManageContact] = await Promise.all([getPromotionManagePermission(), getAdminAccess()]);
  const refreshKey = `${field}:${query}:${Date.now()}`;
// 홍보 화면: 헤더 우측 메뉴 목록
  const promotionHeaderRightItems = appendContactManageMenu(promotionHeaderRightBaseItems, canManageContact);

  return (
    <main
      id="promotion_scroll"
      className="promotion-page h-[100svh] overflow-x-hidden overflow-y-auto bg-white text-[#111111]"
    >
      <section className="promotion-header-shell relative">
        <SiteHeader
          leftItems={promotionHeaderLeftItems}
          rightItems={promotionHeaderRightItems}
          lightBackground
        />
      </section>

      <section id="promotion_list" className="promotion-list-section">
        <div className="promotion-content-wrap">
          <div className="promotion-list-header">
            <h2 className="promotion-section-title">홍보 게시글</h2>
          </div>

          <form className="promotion-search-form" method="get">
            <label className="promotion-sr-only" htmlFor="promotion-field">
              검색 구분
            </label>
            <select id="promotion-field" name="field" defaultValue={field} className="promotion-search-select">
              <option value="title">제목</option>
              <option value="content">내용</option>
              <option value="all">제목+내용</option>
            </select>
            <label className="promotion-sr-only" htmlFor="promotion-query">
              검색어
            </label>
            <input
              id="promotion-query"
              name="q"
              defaultValue={query}
              className="promotion-search-input"
              placeholder="검색어를 입력해 주세요."
            />
            <button type="submit" className="promotion-search-button">
              검색
            </button>
            {canManagePromotion && (
              <PageNavigationLink href="/promotion/write" className="promotion-button promotion-button-dark promotion-search-write">
                글작성
              </PageNavigationLink>
            )}
          </form>

          <div className="promotion-table-wrap">
            <PromotionListTableClient
              query={query}
              field={field}
              canManagePromotion={canManagePromotion}
              refreshKey={refreshKey}
            />
          </div>
        </div>
      </section>

      <ScrollToTopButton targetId="promotion_scroll" />
    </main>
  );
}
