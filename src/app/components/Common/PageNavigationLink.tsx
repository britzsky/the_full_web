import type { AnchorHTMLAttributes, ReactNode } from "react";

// 전체 페이지 이동 시 브라우저 문서 요청이 발생하도록 내부 링크를 a 태그로 통일한다.
type PageNavigationLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
};

// 운영 환경에서도 이동한 주소가 네트워크 탭에 문서 요청으로 보이도록 공통 페이지 이동 링크를 제공한다.
export default function PageNavigationLink({ href, children, ...props }: PageNavigationLinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
