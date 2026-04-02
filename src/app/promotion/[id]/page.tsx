import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import type { ReactNode } from "react";
import SiteHeader, { SiteHeaderMenuItem } from "@/app/components/Common/SiteHeader";
import ScrollToTopButton from "@/app/components/Common/ScrollToTopButton";
import { appendContactManageMenu } from "@/app/components/Common/headerMenuUtils";
import { getAdminAccess } from "@/app/lib/adminAccess";
import PromotionDetailActions from "../PromotionDetailActions";
import { formatPromotionDate } from "../format";
import { getPromotionManagePermission } from "../permissions";
import { getPromotionAdjacentPosts, getPromotionPostById } from "../promotionStore";
import "../page.css";

// 홍보 화면: 컴포넌트 전달값
type PromotionDetailPageProps = {
  params: Promise<{ id: string }>;
};

// 홍보 상세 페이지 메타데이터(게시글별 분기 없이 고정)
export async function generateMetadata({ params }: PromotionDetailPageProps): Promise<Metadata> {
// 홍보 화면: resolvedParams 정의
  const resolvedParams = await Promise.resolve(params);
// 홍보 화면: id 정의
  const id = Number(resolvedParams.id);

  if (!Number.isInteger(id) || id <= 0) {
    return { title: "(주)더채움 | 홍보" };
  }
  return { title: "(주)더채움 | 홍보" };
}

// 홍보 상세 페이지 헤더 좌측 메뉴
const promotionHeaderLeftItems: SiteHeaderMenuItem[] = [
  { label: "회사소개", href: "/company_profile" },
  { label: "사업영역", href: "/business_area" },
  { label: "급식서비스", href: "/catering_service" },
];

// 홍보 상세 페이지 헤더 우측 기본 메뉴
const promotionHeaderRightBaseItems: SiteHeaderMenuItem[] = [
  { label: "홍보", href: "/promotion" },
  { label: "채용", href: "/recruit" },
  { label: "고객문의", href: "/contact", isCta: true },
];

// 홍보 상세 화면: data URL 이미지 주소 패턴
const dataUrlImagePattern = /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/;
// 홍보 상세 화면: 외부 URL 이미지 주소 패턴
const urlImagePattern = /^https?:\/\/\S+$/;
// 홍보 상세 화면: HTML 본문 판별 패턴
const htmlTagPattern = /<\/?[a-z][^>]*>/i;

// 홍보 상세 화면: HTML 본문 최소 안전화 처리
const sanitizePromotionHtml = (rawHtml: string) => {
  let sanitized = rawHtml;

  // 스크립트/스타일/임베드 계열 태그와 이벤트 핸들러를 제거해 HTML 렌더링 위험을 낮춤
  sanitized = sanitized.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  sanitized = sanitized.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  sanitized = sanitized.replace(
    /<\/?(iframe|object|embed|link|meta|base|form|input|button|textarea|select|option|svg|math)\b[^>]*>/gi,
    ""
  );
  sanitized = sanitized.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  sanitized = sanitized.replace(
    /\s(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi,
    ' $1="#"'
  );

  return sanitized;
};

// 홍보 상세 화면: 레거시 마크다운 본문 렌더 노드 생성
const renderLegacyMarkdownContent = (content: string): ReactNode[] => {
  const blocks = content
    .split(/\n{2,}/)
    .map((rawBlock) => rawBlock.trim())
    .filter((block) => block.length > 0);
  const nodes: ReactNode[] = [];

  blocks.forEach((block, blockIndex) => {
    let cursor = 0;
    const matches = Array.from(block.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g));

    if (matches.length === 0) {
      nodes.push(
        <p className="promotion-detail-paragraph" key={`promotion-paragraph-${blockIndex}`}>
          {block}
        </p>
      );
      return;
    }

    matches.forEach((match, imageIndex) => {
      const matchStart = match.index ?? 0;
      const matchText = match[0] ?? "";
      const beforeText = block.slice(cursor, matchStart).trim();
      if (beforeText) {
        nodes.push(
          <p className="promotion-detail-paragraph" key={`promotion-paragraph-${blockIndex}-${imageIndex}-before`}>
            {beforeText}
          </p>
        );
      }

      const imageAlt = (match[1] ?? "첨부 이미지").trim() || "첨부 이미지";
      const imageSrc = (match[2] ?? "").trim();
      const canRenderImage =
        dataUrlImagePattern.test(imageSrc) || urlImagePattern.test(imageSrc) || imageSrc.startsWith("/");

      if (canRenderImage) {
        nodes.push(
          <figure className="promotion-detail-image-wrap" key={`promotion-image-${blockIndex}-${imageIndex}`}>
            <img src={imageSrc} alt={imageAlt} className="promotion-detail-image" />
          </figure>
        );
      }

      cursor = matchStart + matchText.length;
    });

    const afterText = block.slice(cursor).trim();
    if (afterText) {
      nodes.push(
        <p className="promotion-detail-paragraph" key={`promotion-paragraph-${blockIndex}-after`}>
          {afterText}
        </p>
      );
    }
  });

  return nodes;
};

// 홍보 상세 화면: 본문 저장 포맷(HTML/마크다운) 분기 렌더링
const renderPromotionContent = (content: string): ReactNode[] => {
  const normalizedContent = content.trim();
  if (!normalizedContent) {
    return [];
  }

  if (htmlTagPattern.test(normalizedContent)) {
    return [
      <div
        className="promotion-detail-html ck-content"
        key="promotion-html-content"
        dangerouslySetInnerHTML={{ __html: sanitizePromotionHtml(normalizedContent) }}
      />,
    ];
  }

  return renderLegacyMarkdownContent(normalizedContent);
};

// 홍보 화면: PromotionDetailPage 함수 로직
export default async function PromotionDetailPage({ params }: PromotionDetailPageProps) {
  noStore();

// 홍보 화면: resolvedParams 정의
  const resolvedParams = await Promise.resolve(params);
// 홍보 화면: id 정의
  const id = Number(resolvedParams.id);
  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const [post, adjacentPosts, canManagePromotion, canManageContact] = await Promise.all([
    getPromotionPostById(id),
    getPromotionAdjacentPosts(id),
    getPromotionManagePermission(),
    getAdminAccess(),
  ]);
// 홍보 화면: 헤더 우측 메뉴 목록
  const promotionHeaderRightItems = appendContactManageMenu(promotionHeaderRightBaseItems, canManageContact);

  if (!post) {
    notFound();
  }

  return (
    // 홍보 상세 화면: 페이지 스크롤 루트
    <main
      id="promotion_detail_scroll"
      className="promotion-page h-[100svh] overflow-x-hidden overflow-y-auto bg-white text-[#111111]"
    >
      {/* 홍보 상세 상단은 배경이미지 없이 공통 헤더만 노출 */}
      <section className="promotion-header-shell relative">
        <SiteHeader
          leftItems={promotionHeaderLeftItems}
          rightItems={promotionHeaderRightItems}
          lightBackground
        />
      </section>

      {/* 홍보 상세 화면: 게시글 본문/액션/이전글·다음글 영역 */}
      <section className="promotion-detail-section">
        <div className="promotion-content-wrap">
          {/* 홍보 상세 화면: 게시글 제목/메타/본문 카드 */}
          <article className="promotion-detail-card">
            <header className="promotion-detail-header">
              <h2 className="promotion-detail-title">{post.title}</h2>
              <div className="promotion-detail-meta">
                <span>
                  <span className="promotion-detail-meta-label">작성자</span>{" "}
                  <span className="promotion-detail-meta-value">{post.author}</span>
                </span>
                <span className="promotion-detail-meta-divider" />
                <span>
                  <span className="promotion-detail-meta-label">작성일</span>{" "}
                  <span className="promotion-detail-meta-value">{formatPromotionDate(post.createdAt)}</span>
                </span>
              </div>
            </header>

            {/* 홍보 상세 화면: 게시글 본문 표시 영역(HTML/마크다운 호환) */}
            <div className="promotion-detail-content">{renderPromotionContent(post.content)}</div>

            {/* 홍보 상세 화면: 게시글 액션 버튼 영역(목록/수정/삭제) */}
            <PromotionDetailActions postId={post.id} canManage={canManagePromotion} />
          </article>

          {/* 홍보 상세 화면: 이전글/다음글 네비게이션 영역 */}
          <div className="promotion-detail-nav">
            <div className="promotion-detail-nav-row">
              <span className="promotion-detail-nav-label">이전글</span>
              {adjacentPosts.previous ? (
                <Link href={`/promotion/${adjacentPosts.previous.id}`} className="promotion-detail-nav-link">
                  {adjacentPosts.previous.title}
                </Link>
              ) : (
                <span className="promotion-detail-nav-empty">이전 글이 없습니다.</span>
              )}
              <span className="promotion-detail-nav-date">
                {adjacentPosts.previous ? formatPromotionDate(adjacentPosts.previous.createdAt) : ""}
              </span>
            </div>
            <div className="promotion-detail-nav-row">
              <span className="promotion-detail-nav-label">다음글</span>
              {adjacentPosts.next ? (
                <Link href={`/promotion/${adjacentPosts.next.id}`} className="promotion-detail-nav-link">
                  {adjacentPosts.next.title}
                </Link>
              ) : (
                <span className="promotion-detail-nav-empty">다음 글이 없습니다.</span>
              )}
              <span className="promotion-detail-nav-date">
                {adjacentPosts.next ? formatPromotionDate(adjacentPosts.next.createdAt) : ""}
              </span>
            </div>
          </div>
        </div>
      </section>

      <ScrollToTopButton targetId="promotion_detail_scroll" />
    </main>
  );
}
