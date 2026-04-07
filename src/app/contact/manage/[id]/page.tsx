import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import SiteHeader, { SiteHeaderMenuItem } from "@/app/components/Common/SiteHeader";
import ScrollToTopButton from "@/app/components/Common/ScrollToTopButton";
import { appendContactManageMenu } from "@/app/components/Common/headerMenuUtils";
import { getAdminAccess, getSessionUserId } from "@/app/lib/adminAccess";
import { getContactInquiryById } from "@/app/contact/inquiryStore";
import { ContactManageDetailClient } from "../contactManageClient";
import "../page.css";

// 문의관리 상세 페이지 params 타입
type ContactManageDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ erp_user_id?: string | string[]; user_id?: string | string[] }>;
};

// 문의관리 상세 페이지 메타데이터
export async function generateMetadata({ params }: ContactManageDetailPageProps): Promise<Metadata> {
// 문의관리 화면: resolvedParams 정의
  const resolvedParams = await Promise.resolve(params);
// 문의관리 화면: id 정의
  const id = Number(resolvedParams.id);

  if (!Number.isInteger(id) || id <= 0) {
    return { title: "(주)더채움 | 문의관리" };
  }
  return { title: "(주)더채움 | 문의관리" };
}

// 문의관리 상세 페이지 헤더 좌측 메뉴
const contactManageHeaderLeftItems: SiteHeaderMenuItem[] = [
  { label: "회사소개", href: "/company_profile" },
  { label: "사업영역", href: "/business_area" },
  { label: "급식서비스", href: "/catering_service" },
];

// 문의관리 상세 페이지 헤더 우측 기본 메뉴
const contactManageHeaderRightBaseItems: SiteHeaderMenuItem[] = [
  { label: "홍보", href: "/promotion" },
  { label: "채용", href: "/recruit" },
  { label: "고객문의", href: "/contact", isCta: true },
];

// 문의관리 상세 페이지 렌더링
export default async function ContactManageDetailPage({ params, searchParams }: ContactManageDetailPageProps) {
  noStore();

// 문의관리 화면: 상태값
  const canManage = await getAdminAccess();
  if (!canManage) {
    notFound();
  }

// 문의관리 화면: resolvedParams 정의
  const resolvedParams = await Promise.resolve(params);
// 문의관리 화면: id 정의
  const id = Number(resolvedParams.id);
  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const inquiry = await getContactInquiryById(id);
  if (!inquiry) {
    notFound();
  }

  const resolvedSearchParams = (await Promise.resolve(searchParams ?? {})) as {
    erp_user_id?: string | string[];
    user_id?: string | string[];
  };
  const queryUserId = Array.isArray(resolvedSearchParams.erp_user_id)
    ? resolvedSearchParams.erp_user_id[0]
    : resolvedSearchParams.erp_user_id;
  const legacyQueryUserId = Array.isArray(resolvedSearchParams.user_id)
    ? resolvedSearchParams.user_id[0]
    : resolvedSearchParams.user_id;
  // 문의관리 상세: URL 파라미터가 없을 때는 로그인 세션 쿠키 user_id를 사용
  const sessionUserId = await getSessionUserId();
  const erpUserId = (queryUserId || legacyQueryUserId || sessionUserId || "").trim();
  const refreshKey = `${id}:${Date.now()}`;

// 문의관리 화면: rightItems 정의
  const rightItems = appendContactManageMenu(contactManageHeaderRightBaseItems, canManage);

  return (
    <main
      id="contact_manage_detail_scroll"
      className="contact-manage-page h-[100svh] overflow-x-hidden overflow-y-auto bg-white text-[#111111]"
    >
      {/* 문의관리 상세 페이지 공통 헤더 영역 */}
      <section className="contact-manage-header-shell relative">
        <SiteHeader
          leftItems={contactManageHeaderLeftItems}
          rightItems={rightItems}
          lightBackground
        />
      </section>

      {/* 문의관리 상세 본문 섹션(접수 상세 데이터 표시) */}
      <section className="contact-manage-detail-section">
        <ContactManageDetailClient inquiryId={id} erpUserId={erpUserId} refreshKey={refreshKey} />
      </section>

      <ScrollToTopButton targetId="contact_manage_detail_scroll" />
    </main>
  );
}
