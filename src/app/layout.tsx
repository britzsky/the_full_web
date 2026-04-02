import type { Metadata } from "next";
import "./globals.css";

// 공통 레이아웃 화면: 페이지 메타데이터
export const metadata: Metadata = {
  // 기본 사이트 타이틀
  title: "(주)더채움",
  icons: {
    icon: "/favicon.png",
  },
};

// 공통 레이아웃 화면: 함수 로직
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
