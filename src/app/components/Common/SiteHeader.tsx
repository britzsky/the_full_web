"use client";

import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { usePathname } from "next/navigation";
import PageNavigationLink from "./PageNavigationLink";
import TheFullLogo, { type TheFullLogoFormat, type TheFullLogoVariant } from "./TheFullLogo";

// 헤더 메뉴 항목 타입
export type SiteHeaderMenuItem = {
  label: string;
  href?: string;
  isCta?: boolean;
};

// 사이트 헤더 속성 타입
type SiteHeaderProps = {
  leftItems: SiteHeaderMenuItem[];
  rightItems: SiteHeaderMenuItem[];
  logoSrc?: string;
  logoAlt?: string;
  logoVariant?: TheFullLogoVariant;
  logoFormat?: TheFullLogoFormat;
  logoHref?: string;
  lightBackground?: boolean;
  sticky?: boolean;
};

// 문의관리 메뉴 항목
const CONTACT_MANAGE_ITEM: SiteHeaderMenuItem = {
  label: "문의관리",
  href: "/contact/manage",
  isCta: true,
};

// 문의관리 메뉴 표시 모드 타입
type ContactManageMenuMode = "all" | "erp-user-only";

// 문의관리 메뉴 표시 모드
const CONTACT_MANAGE_MENU_MODE: ContactManageMenuMode = "erp-user-only";

// ERP 사용자 식별 쿠키 목록
const ERP_USER_COOKIE_KEYS = [
  "erp_user_id",
  "user_id",
  "login_user_id",
  "thefull_user_id",
  "thefull_user",
];

// ERP 세션 식별 쿠키 목록
const ERP_SESSION_COOKIE_KEYS = [
  "login_session_id",
  "thefull_session_id",
  "session_id",
];

// ERP 웹 권한 쿠키 목록
const ERP_WEB_POSITION_COOKIE_KEYS = [
  "login_web_position",
  "web_position",
  "thefull_web_position",
];

// 쿠키 값 조회 함수
const readCookieValue = (cookieName: string) => {
  if (typeof document === "undefined") {
    return "";
  }

  const prefix = `${cookieName}=`;
  const rawCookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix));

  if (!rawCookie) {
    return "";
  }

  return decodeURIComponent(rawCookie.slice(prefix.length)).trim();
};

// ERP 사용자 세션 여부
const hasErpUserIdSession = () => ERP_USER_COOKIE_KEYS.some((cookieKey) => Boolean(readCookieValue(cookieKey)));

// ERP 로그인 세션 여부
const hasErpSessionId = () => ERP_SESSION_COOKIE_KEYS.some((cookieKey) => Boolean(readCookieValue(cookieKey)));

// ERP 웹 권한 값
const getErpWebPosition = () =>
  ERP_WEB_POSITION_COOKIE_KEYS.map((cookieKey) => readCookieValue(cookieKey).toUpperCase()).find(Boolean) || "";

// 문의관리 접근 세션 여부
const hasContactManageSession = () => {
  const webPosition = getErpWebPosition();
  return hasErpUserIdSession() && hasErpSessionId() && (webPosition === "I" || webPosition === "A");
};

// 문의관리 메뉴 여부
const isContactManageMenu = (item: SiteHeaderMenuItem) =>
  item.href === CONTACT_MANAGE_ITEM.href || item.label === CONTACT_MANAGE_ITEM.label;

// 경로 정규화 함수
const normalizePath = (value: string) => {
  if (!value) {
    return "/";
  }

  const pathOnly = value.split("?")[0]?.split("#")[0] ?? "/";
  if (pathOnly === "/") {
    return "/";
  }

  return pathOnly.endsWith("/") ? pathOnly.slice(0, -1) : pathOnly;
};

// 현재 경로 일치 여부
const isPathMatch = (currentPath: string, menuPath: string) => {
  if (menuPath === "/") {
    return currentPath === "/";
  }

  return currentPath === menuPath || currentPath.startsWith(`${menuPath}/`);
};

// 스크롤 가능 요소 여부
const isScrollableElement = (element: HTMLElement) => {
  const computedStyle = window.getComputedStyle(element);
  const canScrollVertically = /(auto|scroll|overlay)/.test(computedStyle.overflowY);

  return canScrollVertically && element.scrollHeight > element.clientHeight;
};

// 해시 이동 스크롤 컨테이너 탐색
const findClosestScrollContainer = (element: HTMLElement | null) => {
  let currentElement = element?.parentElement ?? null;

  while (currentElement) {
    if (isScrollableElement(currentElement)) {
      return currentElement;
    }

    currentElement = currentElement.parentElement;
  }

  return null;
};

// 메뉴 링크 렌더러
const renderMenuLink = (
  item: SiteHeaderMenuItem,
  className: string,
  onHashLinkClick?: (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => void,
  onNavigate?: () => void
) => {
  if (!item.href) {
    return <span className={className}>{item.label}</span>;
  }

  if (item.href.startsWith("#")) {
    return (
      <a
        href={item.href}
        className={className}
        onClick={(event) => {
          onHashLinkClick?.(event, item.href!);
          onNavigate?.();
        }}
      >
        {item.label}
      </a>
    );
  }

  return (
    <PageNavigationLink href={item.href} className={className} onClick={onNavigate}>
      {item.label}
    </PageNavigationLink>
  );
};

// 공통 사이트 헤더 컴포넌트
export default function SiteHeader({
  leftItems,
  rightItems,
  logoSrc,
  logoAlt = "더풀 로고",
  logoVariant,
  logoFormat = "svg",
  logoHref = "/",
  lightBackground = false,
  sticky = false,
}: SiteHeaderProps) {
  // 헤더 위치 클래스
  const headerPositionClass = sticky ? "site-header-sticky" : "site-header-overlay";

  // 헤더 테마 클래스
  const headerThemeClass = lightBackground ? "site-header-light" : "site-header-dark";

  // 로고 색상 타입
  const resolvedLogoVariant: TheFullLogoVariant = logoVariant ?? (lightBackground ? "default" : "white");

  // 현재 라우트 경로
  const pathname = usePathname();

  // 문의관리 메뉴 표시 상태
  const [canShowContactManage, setCanShowContactManage] = useState(
    CONTACT_MANAGE_MENU_MODE === "all" || rightItems.some((item) => isContactManageMenu(item))
  );

  // 모바일 메뉴 열림 상태
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 헤더 배치 인라인 스타일
  const headerLayoutStyle: CSSProperties = {
    position: sticky ? "fixed" : "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
  };

  // 문의관리 메뉴 표시 권한 동기화
  useEffect(() => {
    if (CONTACT_MANAGE_MENU_MODE === "all") {
      setCanShowContactManage(true);
      return;
    }

    if (rightItems.some((item) => isContactManageMenu(item))) {
      setCanShowContactManage(true);
      return;
    }

    setCanShowContactManage(hasContactManageSession());
  }, [rightItems]);

  // 우측 메뉴 최종 목록
  const resolvedRightItems = useMemo(() => {
    if (!canShowContactManage) {
      return rightItems.filter((item) => !isContactManageMenu(item));
    }

    const hasManageMenu = rightItems.some((item) => isContactManageMenu(item));

    if (hasManageMenu) {
      return rightItems;
    }

    return [...rightItems, CONTACT_MANAGE_ITEM];
  }, [canShowContactManage, rightItems]);

  // 활성 메뉴 href
  const activeMenuHref = useMemo(() => {
    const currentPath = normalizePath(pathname ?? "/");
    const menuItems = [...leftItems, ...resolvedRightItems];

    const matchedPathItems = menuItems
      .filter(
        (item): item is SiteHeaderMenuItem & { href: string } =>
          typeof item.href === "string" && !item.href.startsWith("#")
      )
      .map((item) => ({ href: item.href, normalizedHref: normalizePath(item.href) }))
      .filter((item) => isPathMatch(currentPath, item.normalizedHref))
      .sort((a, b) => b.normalizedHref.length - a.normalizedHref.length);

    if (matchedPathItems.length > 0) {
      return matchedPathItems[0].href;
    }

    const hashMenu = menuItems.find((item) => item.href?.startsWith("#"));
    return hashMenu?.href ?? "";
  }, [leftItems, resolvedRightItems, pathname]);

  // 모바일 메뉴 항목 목록
  const mobileMenuItems = useMemo(() => {
    const allMenuItems = [...leftItems, ...resolvedRightItems];
    const pickMenuItem = (label: string) => allMenuItems.find((item) => item.label === label);
    const orderedLabels = ["회사소개", "사업영역", "급식서비스", "홍보", "채용", "고객문의", "문의관리"];
    const orderedItems = orderedLabels
      .map((label) => pickMenuItem(label))
      .filter((item): item is SiteHeaderMenuItem => Boolean(item));
    const orderedLabelSet = new Set(orderedItems.map((item) => item.label));
    const remainingItems = allMenuItems.filter((item) => !orderedLabelSet.has(item.label));

    return [...orderedItems, ...remainingItems];
  }, [leftItems, resolvedRightItems]);

  // 헤더 메뉴 클래스 이름
  const getMenuClassName = (item: SiteHeaderMenuItem, mobile = false) => {
    const isActive = Boolean(item.href) && item.href === activeMenuHref;

    if (mobile) {
      return `site-header-link site-header-link-mobile ${isActive ? "site-header-link-cta site-header-link-cta-mobile" : ""}`;
    }

    return `site-header-link ${isActive ? "site-header-link-cta" : ""}`;
  };

  // 모바일 드로어 메뉴 클래스 이름
  const getMobileDrawerMenuClassName = (item: SiteHeaderMenuItem) => {
    const isActive = Boolean(item.href) && item.href === activeMenuHref;
    return `site-header-mobile-panel-link ${isActive ? "site-header-mobile-panel-link-active" : ""}`;
  };

  // 라우트 변경 시 모바일 메뉴 닫힘
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // 모바일 메뉴 배경 스크롤 잠금
  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    if (isMobileMenuOpen) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isMobileMenuOpen]);

  // 해시 링크 스크롤 처리
  const handleHashLinkClick = (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    const targetId = href.slice(1);

    if (!targetId) {
      return;
    }

    const targetElement = document.getElementById(targetId);

    if (!(targetElement instanceof HTMLElement)) {
      return;
    }

    event.preventDefault();

    const scrollContainer = findClosestScrollContainer(targetElement);

    if (scrollContainer) {
      const targetScrollTop =
        targetElement.getBoundingClientRect().top -
        scrollContainer.getBoundingClientRect().top +
        scrollContainer.scrollTop;

      scrollContainer.scrollTo({ top: targetScrollTop, behavior: "smooth" });
    } else {
      const targetScrollTop = targetElement.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: targetScrollTop, behavior: "smooth" });
    }

    if (window.location.hash !== href) {
      window.history.replaceState(null, "", href);
    }
  };

  return (
    <header className={`site-header ${headerPositionClass} ${headerThemeClass}`} style={headerLayoutStyle}>
      <div className="site-header-inner">
        {/* 데스크톱 헤더 바 */}
        <div
          className="site-header-desktop-bar hidden items-center md:grid md:grid-cols-[1fr_auto_1fr] md:gap-16"
          style={{ position: "absolute", top: 20, left: 0, right: 0, height: 70 }}
        >
          {/* 데스크톱 좌측 메뉴 목록 */}
          <ul className="flex justify-end gap-16 pr-0 lg:gap-20 lg:pr-0">
            {leftItems.map((item) => (
              <li key={item.label} className="flex h-10 items-center">
                {renderMenuLink(item, getMenuClassName(item), handleHashLinkClick)}
              </li>
            ))}
          </ul>

          {/* 데스크톱 로고 링크 */}
          <PageNavigationLink href={logoHref} className="inline-flex items-center justify-center px-6 lg:px-8">
            <TheFullLogo
              src={logoSrc}
              alt={logoAlt}
              variant={resolvedLogoVariant}
              format={logoFormat}
              width={220}
              height={70}
              className="h-auto w-[178px] md:w-[220px]"
            />
          </PageNavigationLink>

          {/* 데스크톱 우측 메뉴 목록 */}
          <ul className="flex justify-start gap-16 pl-0 lg:gap-20 lg:pl-0">
            {resolvedRightItems.map((item) => (
              <li key={item.label} className="flex h-10 items-center">
                {renderMenuLink(item, getMenuClassName(item), handleHashLinkClick)}
              </li>
            ))}
          </ul>
        </div>

        {/* 모바일 헤더 바 */}
        <div className="md:hidden">
          <div className="site-header-mobile-bar">
            {/* 모바일 로고 링크 */}
            <PageNavigationLink href={logoHref} className="inline-flex items-center justify-center">
              <TheFullLogo
                src={logoSrc}
                alt={logoAlt}
                variant={resolvedLogoVariant}
                format={logoFormat}
                width={160}
                height={51}
                className="h-auto w-[145px]"
              />
            </PageNavigationLink>

            {/* 모바일 메뉴 열기 버튼 */}
            <button
              type="button"
              className={`site-header-mobile-trigger ${
                isMobileMenuOpen ? "site-header-mobile-trigger-active" : ""
              }`}
              aria-label={isMobileMenuOpen ? "모바일 메뉴 닫기" : "모바일 메뉴 열기"}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              <span className="site-header-mobile-trigger-line" />
              <span className="site-header-mobile-trigger-line" />
              <span className="site-header-mobile-trigger-line" />
            </button>
          </div>

          {isMobileMenuOpen && (
            <>
              {/* 모바일 메뉴 배경 버튼 */}
              <button
                type="button"
                aria-label="모바일 메뉴 닫기 배경"
                className="site-header-mobile-backdrop"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              {/* 모바일 메뉴 패널 */}
              <div className="site-header-mobile-panel" role="dialog" aria-modal="true" aria-label="모바일 메뉴">
                <div className="site-header-mobile-panel-top">
                  <div>
                    <TheFullLogo
                      alt={logoAlt}
                      variant="white"
                      format={logoFormat}
                      width={116}
                      height={37}
                      className="site-header-mobile-panel-logo"
                    />
                    <p className="site-header-mobile-title">메뉴</p>
                  </div>
                </div>

                {/* 모바일 메뉴 목록 */}
                <div className="site-header-mobile-groups">
                  <ul className="site-header-mobile-list">
                    {mobileMenuItems.map((item) => (
                      <li key={`mobile-${item.label}`}>
                        {renderMenuLink(
                          item,
                          getMobileDrawerMenuClassName(item),
                          handleHashLinkClick,
                          () => setIsMobileMenuOpen(false)
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
