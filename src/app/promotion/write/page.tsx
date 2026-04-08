import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import SiteHeader, { SiteHeaderMenuItem } from "@/app/components/Common/SiteHeader";
import ScrollToTopButton from "@/app/components/Common/ScrollToTopButton";
import { appendContactManageMenu } from "@/app/components/Common/headerMenuUtils";
import { getContactManageAccess } from "@/app/lib/adminAccess";
import PromotionEditorForm from "../PromotionEditorForm";
import { getPromotionManagePermission } from "../permissions";
import "../page.css";

// 홍보 화면: 페이지 메타데이터
export const metadata: Metadata = {
  // 홍보 글작성 페이지 메타데이터
  title: "(주)더채움 | 홍보 글작성",
};

// 홍보 화면: 헤더 좌측 메뉴 목록
const promotionHeaderLeftItems: SiteHeaderMenuItem[] = [
  { label: "회사소개", href: "/company_profile" },
  { label: "사업영역", href: "/business_area" },
  { label: "급식서비스", href: "/catering_service" },
];

// 홍보 화면: 헤더 우측 메뉴 목록
const promotionHeaderRightBaseItems: SiteHeaderMenuItem[] = [
  { label: "홍보", href: "/promotion" },
  { label: "채용", href: "/recruit" },
  { label: "고객문의", href: "/contact", isCta: true },
];

// 홍보 화면: PromotionWritePage 함수 로직
export default async function PromotionWritePage() {
  noStore();

  const [canManagePromotion, canManageContact] = await Promise.all([
    getPromotionManagePermission(),
    getContactManageAccess(),
  ]);
  if (!canManagePromotion) {
    notFound();
  }
// 홍보 화면: 헤더 우측 메뉴 목록
  const promotionHeaderRightItems = appendContactManageMenu(promotionHeaderRightBaseItems, canManageContact);

  return (
    <main
      id="promotion_write_scroll"
      className="promotion-page h-[100svh] overflow-x-hidden overflow-y-auto bg-white text-[#111111]"
    >
      <section className="promotion-header-shell relative">
        <SiteHeader
          leftItems={promotionHeaderLeftItems}
          rightItems={promotionHeaderRightItems}
          lightBackground
        />
      </section>

      <section className="promotion-form-section">
        <div className="promotion-content-wrap">
          <div className="promotion-form-header">
            <h2 className="promotion-section-title">홍보 글작성</h2>
          </div>
          <PromotionEditorForm mode="create" />
        </div>
      </section>

      <ScrollToTopButton targetId="promotion_write_scroll" />
    </main>
  );
}
