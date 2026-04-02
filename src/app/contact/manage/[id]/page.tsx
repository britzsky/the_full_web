import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import SiteHeader, { SiteHeaderMenuItem } from "@/app/components/Common/SiteHeader";
import ScrollToTopButton from "@/app/components/Common/ScrollToTopButton";
import { appendContactManageMenu } from "@/app/components/Common/headerMenuUtils";
import { getAdminAccess, getSessionUserId } from "@/app/lib/adminAccess";
import { getContactInquiryById, getContactInquiryReplyByInquiryId } from "@/app/contact/inquiryStore";
import ContactManageReplyEditor from "../ContactManageReplyEditor";
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

// 접수일시를 yyyy-mm-dd hh:mm 형식으로 변환
const formatDateTime = (value: string) => {
// 문의관리 화면: date 정의
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

// 문의관리 화면: year 정의
  const year = date.getFullYear();
// 문의관리 화면: month 정의
  const month = String(date.getMonth() + 1).padStart(2, "0");
// 문의관리 화면: day 정의
  const day = String(date.getDate()).padStart(2, "0");
// 문의관리 화면: hours 정의
  const hours = String(date.getHours()).padStart(2, "0");
// 문의관리 화면: minutes 정의
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

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

// 문의관리 화면: inquiry 정의
  const inquiry = await getContactInquiryById(id);
  if (!inquiry) {
    notFound();
  }
  // 문의관리 상세 화면: 등록된 답변 데이터 조회
  const reply = await getContactInquiryReplyByInquiryId(id);
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
        <div className="contact-manage-wrap">
          <article className="contact-manage-detail-card">
            <header className="contact-manage-detail-head">
              {/* 문의관리 상세: 헤더 최상단은 업장명이 아닌 문의 제목으로 노출 */}
              <h1 className="contact-manage-detail-name">{inquiry.title || "-"}</h1>
              <p className="contact-manage-detail-meta">
                <span className="contact-manage-detail-meta-label">접수일</span>{" "}
                <span className="contact-manage-detail-meta-date">{formatDateTime(inquiry.submittedAt || inquiry.createdAt)}</span>
              </p>
            </header>

            <div className="contact-manage-detail-body">
              <div className="contact-manage-detail-row">
                <span className="contact-manage-detail-label">업장명</span>
                <p className="contact-manage-detail-value">{inquiry.businessName}</p>
              </div>
              <div className="contact-manage-detail-row">
                <span className="contact-manage-detail-label">담당자</span>
                <p className="contact-manage-detail-value">{inquiry.managerName}</p>
              </div>
              <div className="contact-manage-detail-row">
                <span className="contact-manage-detail-label">연락처</span>
                <p className="contact-manage-detail-value">{inquiry.phoneNumber}</p>
              </div>
              <div className="contact-manage-detail-row">
                <span className="contact-manage-detail-label">이메일</span>
                <p className="contact-manage-detail-value">{inquiry.email}</p>
              </div>
              <div className="contact-manage-detail-row">
                <span className="contact-manage-detail-label">현재 식단가</span>
                <p className="contact-manage-detail-value">{inquiry.currentMealPrice}</p>
              </div>
              <div className="contact-manage-detail-row">
                <span className="contact-manage-detail-label">희망 식단가</span>
                <p className="contact-manage-detail-value">{inquiry.desiredMealPrice}</p>
              </div>
              <div className="contact-manage-detail-row">
                <span className="contact-manage-detail-label">일 식수</span>
                <p className="contact-manage-detail-value">{inquiry.dailyMealCount}</p>
              </div>
              <div className="contact-manage-detail-row">
                <span className="contact-manage-detail-label">식사 구분</span>
                <p className="contact-manage-detail-value">{inquiry.mealType}</p>
              </div>
              <div className="contact-manage-detail-row">
                <span className="contact-manage-detail-label">업장 구분</span>
                <p className="contact-manage-detail-value">{inquiry.businessType}</p>
              </div>
              <div className="contact-manage-detail-row">
                <span className="contact-manage-detail-label">업체 변경 이유</span>
                <p className="contact-manage-detail-value">{inquiry.switchingReason || "-"}</p>
              </div>
              <div className="contact-manage-detail-row">
                <span className="contact-manage-detail-label">문의 내용</span>
                <p className="contact-manage-detail-value">{inquiry.inquiryContent}</p>
              </div>
            </div>

            <div className="contact-manage-detail-actions">
              <Link href="/contact/manage" className="contact-manage-detail-list-button">
                목록
              </Link>
            </div>
          </article>

          <ContactManageReplyEditor
            inquiryId={id}
            initialReply={reply}
            inquiryTitle={inquiry.title || "-"}
            inquiryContent={inquiry.inquiryContent || "-"}
            erpUserId={erpUserId}
          />
        </div>
      </section>

      <ScrollToTopButton targetId="contact_manage_detail_scroll" />
    </main>
  );
}
