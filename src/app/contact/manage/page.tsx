import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import SiteHeader, { SiteHeaderMenuItem } from "@/app/components/Common/SiteHeader";
import ScrollToTopButton from "@/app/components/Common/ScrollToTopButton";
import { appendContactManageMenu } from "@/app/components/Common/headerMenuUtils";
import { getAdminAccess } from "@/app/lib/adminAccess";
import { listContactInquiry } from "@/app/contact/inquiryStore";
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

// 등록일을 yyyy-mm-dd 형식으로 변환
const formatSubmittedAt = (value: string) => {
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
  return `${year}-${month}-${day}`;
};

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
// 문의관리 화면: inquiryList 정의
  const inquiryList = await listContactInquiry();

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

          <div className="contact-manage-table-wrap">
            <table className="contact-manage-table" aria-label="고객 문의 목록">
              <thead>
                <tr>
                  <th scope="col">No</th>
                  <th scope="col">제목</th>
                  <th scope="col">업장명</th>
                  <th scope="col">담당자</th>
                  <th scope="col">연락처</th>
                  <th scope="col">이메일</th>
                  <th scope="col">등록일</th>
                  <th scope="col">답변여부</th>
                </tr>
              </thead>
              <tbody>
                {inquiryList.map((inquiry) => (
                  <tr key={inquiry.id}>
                    <td>{inquiry.id}</td>
                    <td className="contact-manage-title-cell">
                      <Link href={`/contact/manage/${inquiry.id}`} className="contact-manage-title-link">
                        {inquiry.title || "-"}
                      </Link>
                    </td>
                    <td>{inquiry.businessName || "-"}</td>
                    <td>{inquiry.managerName}</td>
                    <td>{inquiry.phoneNumber}</td>
                    <td>{inquiry.email}</td>
                    <td>{formatSubmittedAt(inquiry.submittedAt || inquiry.createdAt)}</td>
                    {/* 문의관리 목록: tb_inquiry.answer_yn 기반 답변 상태 표시 */}
                    <td>
                      <span
                        className={`contact-manage-answer-badge ${
                          inquiry.answerYn === "Y"
                            ? "contact-manage-answer-badge-done"
                            : "contact-manage-answer-badge-pending"
                        }`}
                      >
                        {inquiry.answerYn === "Y" ? "답변완료" : "답변미완료"}
                      </span>
                    </td>
                  </tr>
                ))}
                {inquiryList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="contact-manage-empty">
                      접수된 문의가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <ScrollToTopButton targetId="contact_manage_scroll" />
    </main>
  );
}
