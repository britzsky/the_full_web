import type { Metadata } from "next";
import SiteHeader, { SiteHeaderMenuItem } from "@/app/components/Common/SiteHeader";
import ScrollToTopButton from "@/app/components/Common/ScrollToTopButton";
import { appendContactManageMenu } from "@/app/components/Common/headerMenuUtils";
import { getContactManageAccess } from "@/app/lib/adminAccess";
import SocialMediaClient from "./SocialMediaClient";
import "./page.css";

// 소셜 페이지 메타데이터
export const metadata: Metadata = {
  title: "(주)더채움 | Social",
};

// 소셜 페이지 헤더 좌측 메뉴
const socialHeaderLeftItems: SiteHeaderMenuItem[] = [
  { label: "회사소개", href: "/company_profile" },
  { label: "사업영역", href: "/business_area" },
  { label: "급식서비스", href: "/catering_service" },
];

// 소셜 페이지 헤더 우측 기본 메뉴
const socialHeaderRightBaseItems: SiteHeaderMenuItem[] = [
  { label: "홍보", href: "#social_list" },
  { label: "채용", href: "/recruit" },
  { label: "고객문의", href: "/contact", isCta: true },
];

// 소셜 페이지 렌더링
export default async function SocialPage() {
  const canManageContact = await getContactManageAccess();
  const socialHeaderRightItems = appendContactManageMenu(socialHeaderRightBaseItems, canManageContact);

  return (
    <main
      id="social_scroll"
      className="social-page h-[100svh] overflow-x-hidden overflow-y-auto bg-white text-[#111111]"
    >
      <div className="social-bg-wrapper">
        <section className="social-header-shell relative">
          <SiteHeader
            leftItems={socialHeaderLeftItems}
            rightItems={socialHeaderRightItems}
            lightBackground
          />
        </section>

        <section id="social_list" className="social-list-section">
        <div className="social-list-header">
          <h2 className="social-section-title">Social</h2>
        </div>

        <div className="social-content-wrap">
          <div className="social-gallery-shell">
            <SocialMediaClient />
          </div>
        </div>
        </section>
      </div>

      <ScrollToTopButton targetId="social_scroll" />
    </main>
  );
}
