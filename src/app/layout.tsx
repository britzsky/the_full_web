import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const pretendard = localFont({
  src: [
    { path: "../../public/fonts/Pretendard-ExtraLight.woff2", weight: "200", style: "normal" },
    { path: "../../public/fonts/Pretendard-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/Pretendard-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/Pretendard-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/Pretendard-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/Pretendard-ExtraBold.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-pretendard",
  display: "block",
});

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
    <html lang="ko" className={pretendard.variable}>
      {/* CKEditor5 CSS: cssnano 충돌 방지를 위해 webpack 처리 없이 직접 로드 */}
      <head>
        <link rel="stylesheet" href="/ckeditor5.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
