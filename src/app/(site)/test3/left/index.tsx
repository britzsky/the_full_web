"use client";

import Image from "next/image";
import Link from "next/link";
import TheFullLogo from "@/app/components/Common/TheFullLogo";

// 상단 메뉴 링크 데이터
const menuLinks = [
  { label: "home", href: "/" },
  { label: "test3", href: "/test3/one" },
  { label: "left", href: "/test3/left" },
  { label: "right", href: "/test3/right" },
];

// 우측 소셜 아이콘 데이터
const socialLinks = [
  { label: "Instagram", src: "/images/sns_logo/instagram.png" },
  { label: "Facebook", src: "/images/sns_logo/facebook.png" },
  { label: "YouTube", src: "/images/sns_logo/youtube.png" },
  { label: "KakaoTalk", src: "/images/sns_logo/kakaotalk.png" },
  { label: "LINE", src: "/images/sns_logo/line.png" },
  { label: "TikTok", src: "/images/sns_logo/tictok.png" },
];

// 좌측 상세 페이지 콘텐츠 데이터
const detailData = {
  background: "/images/test3/main12.webp",
  title: "맑은 호수처럼 정갈한 한 끼",
  subtitle: "CATERING QUALITY",
  body:
    "메뉴 기획부터 조리, 서비스까지 전 과정을 세심하게 관리합니다. 신선한 재료와 안정된 운영으로 매일 믿을 수 있는 식탁을 만듭니다.",
};

const Page = () => {
  return (
    <>
      {/* left 페이지 전체 레이아웃 클래스 */}
    <main className="relative min-h-screen text-[#1f1b18]">
      <Image
        src={detailData.background}
        alt="왼쪽 상세 배경"
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/20" />

      <div className="pointer-events-none fixed left-6 top-6 z-20 flex items-center gap-3 sm:left-10 sm:top-8">
        <Link href="/" className="pointer-events-auto">
          <TheFullLogo
            variant="default"
            alt="The Full logo"
            width={120}
            height={44}
            className="h-10 w-auto"
          />
        </Link>
      </div>

      <nav className="fixed right-6 top-7 z-20 flex items-center gap-6 text-xs uppercase tracking-[0.3em] text-[#1f1b18] sm:right-10 sm:top-8 sm:gap-8 sm:text-sm">
        {menuLinks.map((item) => (
          <Link key={item.label} href={item.href} className="pointer-events-auto">
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="fixed right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-3 sm:flex">
        {socialLinks.map((item) => (
          <a
            key={item.label}
            href="#"
            className="flex h-8 w-8 items-center justify-center"
            aria-label={item.label}
          >
            <Image src={item.src} alt={item.label} width={20} height={20} />
          </a>
        ))}
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
        <div className="w-full max-w-2xl bg-[#f7f2e5]/95 px-10 py-14 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:px-16">
          <h1 className="font-display text-3xl text-[#7a6b5a] sm:text-4xl">
            {detailData.title}
          </h1>
          <p className="mt-4 text-xs uppercase tracking-[0.35em] text-[#a09180]">
            {detailData.subtitle}
          </p>
          <p className="mt-8 text-sm leading-relaxed text-[#7a6b5a]">
            {detailData.body}
          </p>
          <Link
            href="/test3/one"
            className="mt-10 inline-flex border border-[#b6a999] px-6 py-2 text-xs uppercase tracking-[0.3em] text-[#7a6b5a] transition hover:bg-[#f1e8d7]"
          >
            돌아가기
          </Link>
        </div>
      </div>
    </main>
    </>
  );
};

export default Page;

