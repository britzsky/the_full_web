import type { SiteHeaderMenuItem } from "@/app/components/Common/SiteHeader";

// 문의관리 권한이 있을 때 헤더 우측에 문의관리 메뉴를 추가
export const appendContactManageMenu = (items: SiteHeaderMenuItem[], canManage: boolean): SiteHeaderMenuItem[] => {
  if (!canManage) {
    return items;
  }

  return [...items, { label: "문의관리", href: "/contact/manage", isCta: true }];
};
