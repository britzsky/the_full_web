"use client";

import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { usePathname } from "next/navigation";
import PageNavigationLink from "./PageNavigationLink";
import TheFullLogo, { type TheFullLogoFormat, type TheFullLogoVariant } from "./TheFullLogo";

// 헤더 메뉴 아이템 타입
export type SiteHeaderMenuItem = {
  label: string;
  href?: string;
  isCta?: boolean;
};

// SiteHeader 컴포넌트에 주입되는 좌/우 메뉴, 로고, 테마 옵션 묶음
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

const CONTACT_MANAGE_ITEM: SiteHeaderMenuItem = {
  label: "문의관리",
  href: "/contact/manage",
  isCta: true,
};
type ContactManageMenuMode = "all" | "erp-user-only";

// 문의관리 메뉴는 ERP 로그인 세션 + web_position(I/A)이 있을 때만 노출
const CONTACT_MANAGE_MENU_MODE: ContactManageMenuMode = "erp-user-only";

// ERP 로그인 사용자 식별 쿠키 키 후보
const ERP_USER_COOKIE_KEYS = [
  "erp_user_id",
  "user_id",
  "login_user_id",
  "thefull_user_id",
  "thefull_user",
];

// ERP 로그인 세션 식별에 사용하는 쿠키 키 후보
const ERP_SESSION_COOKIE_KEYS = [
  "login_session_id",
  "thefull_session_id",
  "session_id",
];

// 문의관리 권한에 사용하는 web_position 쿠키 키 후보
const ERP_WEB_POSITION_COOKIE_KEYS = [
  "login_web_position",
  "web_position",
  "thefull_web_position",
];

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

const hasErpUserIdSession = () => ERP_USER_COOKIE_KEYS.some((cookieKey) => Boolean(readCookieValue(cookieKey)));
const hasErpSessionId = () => ERP_SESSION_COOKIE_KEYS.some((cookieKey) => Boolean(readCookieValue(cookieKey)));
const getErpWebPosition = () =>
  ERP_WEB_POSITION_COOKIE_KEYS.map((cookieKey) => readCookieValue(cookieKey).toUpperCase()).find(Boolean) || "";
const hasContactManageSession = () => {
  const webPosition = getErpWebPosition();
  return hasErpUserIdSession() && hasErpSessionId() && (webPosition === "I" || webPosition === "A");
};
const isContactManageMenu = (item: SiteHeaderMenuItem) =>
  item.href === CONTACT_MANAGE_ITEM.href || item.label === CONTACT_MANAGE_ITEM.label;

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

const isPathMatch = (currentPath: string, menuPath: string) => {
  if (menuPath === "/") {
    return currentPath === "/";
  }
  return currentPath === menuPath || currentPath.startsWith(`${menuPath}/`);
};

const isScrollableElement = (element: HTMLElement) => {
  const computedStyle = window.getComputedStyle(element);
  const canScrollVertically = /(auto|scroll|overlay)/.test(computedStyle.overflowY);

  return canScrollVertically && element.scrollHeight > element.clientHeight;
};

// 해시 대상이 내부 스크롤 컨테이너 안에 있으면 해당 컨테이너 기준으로 이동한다.
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

// 메뉴 링크 렌더링 분기
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

// 공통 컴포넌트: SiteHeader 함수 로직
export default function SiteHeader({
  leftItems,
  rightItems,
  logoSrc,
  logoAlt = "더채움 로고",
  logoVariant,
  logoFormat = "svg",
  logoHref = "/",
  lightBackground = false,
  sticky = false,
}: SiteHeaderProps) {
  // 헤더 고정 방식(absolute/fixed) 클래스 분기
  const headerPositionClass = sticky ? "site-header-sticky" : "site-header-overlay";
  // 배경 톤(다크/라이트) 클래스 분기
  const headerThemeClass = lightBackground ? "site-header-light" : "site-header-dark";
  const resolvedLogoVariant: TheFullLogoVariant = logoVariant ?? (lightBackground ? "default" : "white");
  const pathname = usePathname();
  const [canShowContactManage, setCanShowContactManage] = useState(
    CONTACT_MANAGE_MENU_MODE === "all" || rightItems.some((item) => isContactManageMenu(item))
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // 첫 렌더부터 헤더 위치가 고정되도록 핵심 레이아웃 속성은 인라인 스타일로 고정
  const headerLayoutStyle: CSSProperties = {
    position: sticky ? "fixed" : "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
  };

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

  const getMenuClassName = (item: SiteHeaderMenuItem, mobile = false) => {
    const isActive = Boolean(item.href) && item.href === activeMenuHref;
    if (mobile) {
      return `site-header-link site-header-link-mobile ${isActive ? "site-header-link-cta site-header-link-cta-mobile" : ""}`;
    }
    return `site-header-link ${isActive ? "site-header-link-cta" : ""}`;
  };

  const getMobileDrawerMenuClassName = (item: SiteHeaderMenuItem) => {
    const isActive = Boolean(item.href) && item.href === activeMenuHref;
    return `site-header-mobile-panel-link ${isActive ? "site-header-mobile-panel-link-active" : ""}`;
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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

  // 현재 페이지 안의 해시 링크는 내부 스크롤 컨테이너 기준으로 부드럽게 이동시킨다.
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
        <div className="hidden h-full items-center md:grid md:grid-cols-[1fr_auto_1fr] md:gap-16">
          <ul className="flex justify-end gap-12 pr-6 lg:gap-14 lg:pr-10">
            {leftItems.map((item) => (
              <li key={item.label} className="flex h-10 items-center">
                {renderMenuLink(item, getMenuClassName(item), handleHashLinkClick)}
              </li>
            ))}
          </ul>

          {/* 로고 링크 */}
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

          <ul className="flex justify-start gap-12 pl-6 lg:gap-14 lg:pl-10">
            {resolvedRightItems.map((item) => (
              <li key={item.label} className="flex h-10 items-center">
                {renderMenuLink(item, getMenuClassName(item), handleHashLinkClick)}
              </li>
            ))}
          </ul>
        </div>

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
              <button
                type="button"
                aria-label="모바일 메뉴 닫기 배경"
                className="site-header-mobile-backdrop"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              <div className="site-header-mobile-panel" role="dialog" aria-modal="true" aria-label="모바일 메뉴">
                <div className="site-header-mobile-panel-top">
                  <div>
                    <p className="site-header-mobile-kicker">THE FULL</p>
                    <p className="site-header-mobile-title">메뉴</p>
                  </div>
                </div>

                <div className="site-header-mobile-groups">
                  <section className="site-header-mobile-group">
                    <p className="site-header-mobile-group-title">서비스</p>
                    <ul className="site-header-mobile-list">
                      {leftItems.map((item) => (
                        <li key={`mobile-left-${item.label}`}>
                          {renderMenuLink(
                            item,
                            getMobileDrawerMenuClassName(item),
                            handleHashLinkClick,
                            () => setIsMobileMenuOpen(false)
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="site-header-mobile-group">
                    <p className="site-header-mobile-group-title">바로가기</p>
                    <ul className="site-header-mobile-list">
                      {resolvedRightItems.map((item) => (
                        <li key={`mobile-right-${item.label}`}>
                          {renderMenuLink(
                            item,
                            getMobileDrawerMenuClassName(item),
                            handleHashLinkClick,
                            () => setIsMobileMenuOpen(false)
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
