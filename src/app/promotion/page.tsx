import Link from "next/link";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import SiteHeader, { SiteHeaderMenuItem } from "@/app/components/Common/SiteHeader";
import ScrollToTopButton from "@/app/components/Common/ScrollToTopButton";
import { appendContactManageMenu } from "@/app/components/Common/headerMenuUtils";
import { getAdminAccess } from "@/app/lib/adminAccess";
import PromotionListActions from "./PromotionListActions";
import { formatPromotionDate } from "./format";
import { getPromotionManagePermission } from "./permissions";
import { listPromotionPosts } from "./promotionStore";
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

  const [posts, canManagePromotion, canManageContact] = await Promise.all([
    listPromotionPosts({ query, field }),
    getPromotionManagePermission(),
    getAdminAccess(),
  ]);
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
              <Link href="/promotion/write" className="promotion-button promotion-button-dark promotion-search-write">
                글작성
              </Link>
            )}
          </form>

          <div className="promotion-table-wrap">
            <table className="promotion-table" aria-label="홍보 게시글 목록">
              <thead>
                <tr>
                  <th scope="col">No</th>
                  <th scope="col">제목</th>
                  <th scope="col">작성자</th>
                  <th scope="col">등록일</th>
                  {canManagePromotion && <th scope="col">관리</th>}
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>{post.id}</td>
                    <td className="promotion-title-cell">
                      <Link href={`/promotion/${post.id}`} className="promotion-title-link">
                        {post.title}
                      </Link>
                    </td>
                    <td>{post.author}</td>
                    <td>{formatPromotionDate(post.createdAt)}</td>
                    {canManagePromotion && (
                      <td>
                        <PromotionListActions postId={post.id} editHref={`/promotion/${post.id}/edit`} />
                      </td>
                    )}
                  </tr>
                ))}
                {posts.length === 0 && (
                  <tr>
                    <td colSpan={canManagePromotion ? 5 : 4} className="promotion-empty-row">
                      등록된 게시글이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <ScrollToTopButton targetId="promotion_scroll" />
    </main>
  );
}
