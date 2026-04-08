import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import SiteHeader, { SiteHeaderMenuItem } from "@/app/components/Common/SiteHeader";
import ScrollToTopButton from "@/app/components/Common/ScrollToTopButton";
import { appendContactManageMenu } from "@/app/components/Common/headerMenuUtils";
import { getContactManageAccess } from "@/app/lib/adminAccess";
import { getPromotionManagePermission } from "../permissions";
import { PromotionDetailClient } from "../promotionClient";
import { getPromotionPostById } from "../promotionStore";
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

  const [existingPost, canManagePromotion, canManageContact] = await Promise.all([
    getPromotionPostById(id),
    getPromotionManagePermission(),
    getContactManageAccess(),
  ]);
  const refreshKey = `${id}:${Date.now()}`;
// 홍보 화면: 헤더 우측 메뉴 목록
  const promotionHeaderRightItems = appendContactManageMenu(promotionHeaderRightBaseItems, canManageContact);

  if (!existingPost) {
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
        <PromotionDetailClient
          postId={id}
          canManagePromotion={canManagePromotion}
          refreshKey={refreshKey}
        />
      </section>

      <ScrollToTopButton targetId="promotion_detail_scroll" />
    </main>
  );
}
