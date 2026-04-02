"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import TheFullLogo from "@/app/components/Common/TheFullLogo";

// 히어로 타이핑 문구 데이터
const typewriterSentences = [
  "음식의 품질을 한 끼 한 끼 정성으로.",
  "신선한 재료로 매일의 맛을 지킵니다.",
  "따뜻한 온도, 정갈한 식탁을 이어갑니다.",
  "안전한 조리와 믿을 수 있는 서비스.",
  "건강한 하루를 위한 꾸준한 책임감.",
];

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

// 분할 화면 배경 이미지 경로
const splitImages = {
  left: "/images/test3/main12.webp",
  right: "/images/test3/main31.webp",
};

// 인스타그램 미디어 타입 정의
type InstagramMedia = {
  id: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  timestamp?: string;
  caption?: string;
  permalink?: string;
  label?: string;
  overlay?: string;
};

// 인스타 API 실패 시 대체 미디어 데이터
const fallbackMedia: InstagramMedia[] = [
  {
    id: "v1",
    media_type: "VIDEO",
    media_url: "/images/test3/v1.mp4",
    label: "V1",
    overlay: "Name Logo Design (Shane)\nMinimal monogram sketch\nSimple lines, strong identity",
  },
  {
    id: "v2",
    media_type: "VIDEO",
    media_url: "/images/test3/v2.mp4",
    label: "V2",
    overlay: "Name Logo Design (Julio)\nCurves on curves\nClean, minimal monogram",
  },
  {
    id: "v3",
    media_type: "VIDEO",
    media_url: "/images/test3/v3.mp4",
    label: "V3",
    overlay:
      "Couple Name Logo (Travis + Taylor)\nRomantic strokes, playful marks\nCustom lettering in motion",
  },
  {
    id: "v4",
    media_type: "VIDEO",
    media_url: "/images/test3/v4.mp4",
    label: "V4",
    overlay: "Name Logo Design (Jeri)\nHand-drawn elegance\nBalanced, modern signature",
  },
];

const Page = () => {
  // 타이핑 애니메이션 상태
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // 소셜 미디어 상태
  const [mediaItems, setMediaItems] = useState<InstagramMedia[]>(fallbackMedia);
  const [activeMedia, setActiveMedia] = useState<InstagramMedia | null>(null);
  const [instagramUser, setInstagramUser] = useState("dd.w0nu13");

  // 후기 섹션 데이터 정의
  const testimonials = [
    {
      quote:
        "메뉴가 다양하고 간이 안정적이라 직원들이 전반적으로 맛있게 먹고 있습니다. 식재료 신선도도 좋아서 만족도가 높습니다.",
      name: "A 요양원",
    },
    {
      quote:
        "배식 동선이 깔끔하고 대기 시간이 줄어서 점심 시간이 훨씬 편해졌습니다. 현장 요청 사항도 빠르게 반영해 주셔서 신뢰가 갑니다.",
      name: "B 요양원",
    },
    {
      quote:
        "주방과 식당 위생 상태가 항상 깔끔하게 유지되고,\n알레르기 표기나 원산지 안내도 잘 되어 있어 안심하고 이용할 수 있습니다.",
      name: "C 요양원",
    },
  ];

  // 후기 전환 상태
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [prevTestimonial, setPrevTestimonial] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // 히어로 타이핑 효과
  useEffect(() => {
    const currentSentence = typewriterSentences[sentenceIndex];
    let delay = isDeleting ? 50 : 120;

    if (!isDeleting && charIndex === currentSentence.length) {
      delay = 1400;
    }
    if (isDeleting && charIndex === 0) {
      delay = 500;
    }

    const timer = setTimeout(() => {
      if (!isDeleting && charIndex < currentSentence.length) {
        setCharIndex((prev) => prev + 1);
        return;
      }
      if (!isDeleting && charIndex === currentSentence.length) {
        setIsDeleting(true);
        return;
      }
      if (isDeleting && charIndex > 0) {
        setCharIndex((prev) => prev - 1);
        return;
      }
      if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setSentenceIndex((prev) => (prev + 1) % typewriterSentences.length);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, sentenceIndex]);

  // 후기 수동 전환 함수
  const changeTestimonial = (nextIndex: number) => {
    if (nextIndex === activeTestimonial) {
      return;
    }
    setPrevTestimonial(activeTestimonial);
    setActiveTestimonial(nextIndex);
    setIsAnimating(true);
  };

  // 후기 전환 애니메이션 종료 처리
  useEffect(() => {
    if (!isAnimating) {
      return;
    }
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setPrevTestimonial(null);
    }, 600);
    return () => clearTimeout(timer);
  }, [isAnimating]);

  // 후기 자동 순환 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      changeTestimonial((activeTestimonial + 1) % testimonials.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [activeTestimonial, testimonials.length]);

  // 스크롤 위치 기반 동적 그라데이션 처리
  useEffect(() => {
    const section = document.querySelector(
      "[data-dynamic-gradient='true']"
    ) as HTMLElement | null;
    if (!section) {
      return;
    }

    const warm = [
      [201, 160, 154],
      [227, 199, 170],
      [241, 217, 179],
    ];
    const cool = [
      [157, 182, 211],
      [184, 199, 214],
      [202, 211, 221],
    ];

    const mix = (a: number[], b: number[], t: number) =>
      `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)}, ${Math.round(
        a[1] + (b[1] - a[1]) * t
      )}, ${Math.round(a[2] + (b[2] - a[2]) * t)})`;

    let frame = 0;
    const updateGradient = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const rect = section.getBoundingClientRect();
        const viewportMid = window.innerHeight / 2;
        const sectionMid = rect.top + rect.height / 2;
        const offset =
          (viewportMid - sectionMid) / Math.max(1, window.innerHeight / 2);
        const t = Math.min(1, Math.max(0, Math.abs(offset)));
        const bias = offset >= 0 ? "warm" : "cool";
        const startBase = cool[0];
        const midBase = cool[1];
        const endBase = warm[2];
        const biasStart = bias === "warm" ? warm[0] : cool[0];
        const biasMid = bias === "warm" ? warm[1] : cool[1];
        const biasEnd = bias === "warm" ? warm[2] : cool[2];
        section.style.setProperty("--grad-start", mix(startBase, biasStart, t));
        section.style.setProperty("--grad-mid", mix(midBase, biasMid, t));
        section.style.setProperty("--grad-end", mix(endBase, biasEnd, t));
      });
    };

    updateGradient();
    window.addEventListener("scroll", updateGradient, { passive: true });
    window.addEventListener("resize", updateGradient);
    return () => {
      window.removeEventListener("scroll", updateGradient);
      window.removeEventListener("resize", updateGradient);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  // 소셜 팝업 ESC 닫기 처리
  useEffect(() => {
    if (!activeMedia) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveMedia(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMedia]);

  // 인스타그램 미디어 로드
  useEffect(() => {
    let isMounted = true;
    const loadMedia = async () => {
      try {
        const response = await fetch("/api/instagram", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        if (!isMounted || !data?.data) {
          return;
        }
        if (data?.user?.username) {
          setInstagramUser(data.user.username);
        }
        const videoItems = data.data.filter((item: any) => item.media_type === "VIDEO");
        if (videoItems.length === 0) {
          return;
        }
        setMediaItems(videoItems.slice(0, 4));
      } catch {
        // Keep fallback media on error.
      }
    };
    loadMedia();
    return () => {
      isMounted = false;
    };
  }, []);

  // 카드 오버레이 문구 우선순위 함수
  const getOverlayText = (item: InstagramMedia) =>
    item.caption?.trim() || item.overlay || "";

  // 인스타 날짜 포맷 함수
  const formatDate = (value?: string) => {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <>
      {/* test3 메인 페이지 전체 레이아웃 클래스 */}
    <main className="relative min-h-screen bg-[#F3EED4] text-[#1f1b18]">
      {/* 상단 좌측 로고 영역 클래스 */}
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

      {/* 상단 우측 메뉴 네비게이션 클래스 */}
      <nav className="fixed right-6 top-7 z-20 flex items-center gap-6 text-xs uppercase tracking-[0.3em] text-[#1f1b18] sm:right-10 sm:top-8 sm:gap-8 sm:text-sm">
        {menuLinks.map((item) => (
          <Link key={item.label} href={item.href} className="pointer-events-auto">
            {item.label}
          </Link>
        ))}
      </nav>

      {/* 우측 소셜 아이콘 컬럼 클래스 */}
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

      {/* 1번 화면 히어로 섹션 클래스 */}
      <section className="relative flex min-h-screen items-center justify-center px-6 text-center">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.4em] text-[#1f1b18]/70">
            Contract Catering
          </p>
          <h1 className="mt-6 whitespace-nowrap font-display text-3xl text-[#1f1b18] sm:text-5xl">
            {typewriterSentences[sentenceIndex].slice(0, charIndex)}
            <span
              className="ml-1 inline-block animate-pulse align-middle text-[0.9em]"
              aria-hidden="true"
            >
              |
            </span>
          </h1>
        </div>
      </section>

      {/* 2번 화면 좌우 분할 소개 섹션 클래스 */}
      <section className="relative min-h-screen">
        <div className="absolute inset-0 z-0 grid grid-cols-2">
          <Link
            href="/test3/left"
            aria-label="왼쪽 화면 보기"
            className="group relative block h-full w-full"
          >
            <Image
              src={splitImages.left}
              alt="왼쪽 배경"
              fill
              sizes="50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/20" />
          </Link>
          <Link
            href="/test3/right"
            aria-label="오른쪽 화면 보기"
            className="group relative block h-full w-full"
          >
            <Image
              src={splitImages.right}
              alt="오른쪽 배경"
              fill
              sizes="50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/20" />
          </Link>
        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center pointer-events-none">
          <div className="w-full max-w-3xl bg-[#f7f2e5]/90 px-10 py-12 shadow-[0_30px_80px_rgba(0,0,0,0.2)] sm:px-16">
            <div className="flex flex-col gap-8 text-[#7a6b5a] sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-4 text-sm leading-relaxed">
                <p className="text-xs uppercase tracking-[0.4em] text-[#7a6b5a]">
                  Catering Story
                </p>
                <p>
                  왼쪽은 브랜드 스토리, 오른쪽은 서비스 소개입니다. 원하는 쪽을
                  선택해 주세요.
                </p>
              </div>
              <div className="h-px w-full bg-[#b6a999]/60 sm:h-24 sm:w-px" />
              <div className="space-y-4 text-sm leading-relaxed">
                <p className="text-xs uppercase tracking-[0.4em] text-[#7a6b5a]">
                  Service Book
                </p>
                <p>
                  한 끼의 품질과 운영 철학을 소개합니다. 화면을 클릭해 이어지는
                  내용을 확인하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3번 화면 후기/그라데이션 섹션 클래스 */}
      <section
        data-dynamic-gradient="true"
        className="relative flex min-h-screen items-center justify-center px-6 text-center transition-[background] duration-700 bg-[linear-gradient(180deg,var(--grad-start)_0%,var(--grad-mid)_45%,var(--grad-end)_100%)]"
      >
        <div className="flex w-full max-w-4xl items-center justify-center gap-6 text-[#8a7a68]">
          <div className="relative w-full max-w-[42rem] border border-[#cbbca8] bg-[#f7f2e5]/95 px-5 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
            <p className="text-xs uppercase tracking-[0.4em] text-[#8a7a68]">
              What people say about us
            </p>
            <div className="testimonial-stage mx-auto mt-6 min-h-[110px] max-w-2xl text-[#7a6b5a]">
            {prevTestimonial !== null && (
              <div className="testimonial-out text-sm leading-relaxed text-center whitespace-pre-line">
                {testimonials[prevTestimonial].quote.replace(/\.\s*/g, ".\n")}
              </div>
            )}
            <div
              className={`testimonial-in text-sm leading-relaxed text-center ${
                isAnimating ? "is-animating" : ""
              }`}
            >
              <span className="whitespace-pre-line">
                {testimonials[activeTestimonial].quote.replace(/\.\s*/g, ".\n")}
              </span>
            </div>
          </div>
          <p className="mt-5 text-sm font-semibold text-[#8a7a68]">
            {testimonials[activeTestimonial].name}
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                type="button"
                aria-label={`Go to testimonial ${index + 1}`}
                onClick={() => changeTestimonial(index)}
                className={`h-2 w-2 rounded-full ${
                  index === activeTestimonial
                    ? "bg-[#8a7a68]"
                    : "border border-[#cbbca8]"
                }`}
              />
            ))}
          </div>
            <button
              type="button"
              aria-label="Previous testimonial"
              onClick={() =>
                changeTestimonial(
                  (activeTestimonial - 1 + testimonials.length) %
                    testimonials.length
                )
              }
              className="absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#cbbca8] text-lg text-[#8a7a68]"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Next testimonial"
              onClick={() =>
                changeTestimonial((activeTestimonial + 1) % testimonials.length)
              }
              className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#cbbca8] text-lg text-[#8a7a68]"
            >
              →
            </button>
          </div>
        </div>
      </section>

      {/* 4번 화면 소셜 미디어 섹션 클래스 */}
      <section className="relative flex min-h-screen items-center justify-center bg-[#96A9C2] px-6 py-16">
        <div className="w-full max-w-[90rem]">
          <h2 className="text-center font-display text-2xl text-[#F3F2DC] sm:text-3xl -mt-20">
            My stream of consciousness
          </h2>
          <div className="mt-10 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {mediaItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveMedia(item)}
                className="group relative block aspect-[3/4] overflow-hidden bg-white/70 shadow-[0_18px_40px_rgba(0,0,0,0.2)]"
                aria-label="Open Instagram"
              >
                {item.media_type === "VIDEO" ? (
                  <video
                    src={item.media_url}
                    poster={item.thumbnail_url}
                    className="h-full w-full object-cover"
                    preload="metadata"
                    playsInline
                  />
                ) : (
                  <img
                    src={item.media_url}
                    alt={item.caption ?? item.label ?? "Instagram media"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/70 text-xl text-[#6b7a8f]">
                    ▶
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-center text-sm text-white/0 transition group-hover:bg-black/55 group-hover:text-white/100">
                  <div className="px-8 leading-relaxed whitespace-pre-line">
                    {getOverlayText(item)}
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 border border-white/40" />
              </button>
            ))}
          </div>
        </div>
      </section>
      {/* 소셜 상세 팝업 오버레이 클래스 */}
      {activeMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6 py-10"
          onClick={() => setActiveMedia(null)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden bg-[#f7f2e5] shadow-[0_40px_90px_rgba(0,0,0,0.4)] md:grid md:max-h-[80vh] md:grid-cols-[1.1fr_0.9fr]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-[3/4] w-full bg-[#e9dfcf] md:max-h-[80vh]">
              {activeMedia.media_type === "VIDEO" ? (
                <video
                  src={activeMedia.media_url}
                  className="h-full w-full object-cover"
                  controls
                  playsInline
                />
              ) : (
                <img
                  src={activeMedia.media_url}
                  alt={activeMedia.caption ?? activeMedia.label ?? "Instagram"}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="flex max-h-[80vh] flex-col gap-6 overflow-auto p-6 text-[#6b7a8f]">
              <div className="flex items-center justify-between border-b border-[#cbbca8]/60 pb-3 text-xs tracking-[0.3em]">
                <span>@{instagramUser}</span>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setActiveMedia(null)}
                  className="text-base"
                >
                  ×
                </button>
              </div>
              <p className="text-base leading-relaxed whitespace-pre-line">
                {activeMedia.caption ?? activeMedia.overlay ?? ""}
              </p>
              <div className="mt-auto w-full">
                {formatDate(activeMedia.timestamp) && (
                  <div className="w-full text-xs text-[#6b7a8f]/80">
                    <span className="block h-px w-full bg-[#cbbca8]" />
                    <div className="mt-2 flex justify-end">
                      <span>{formatDate(activeMedia.timestamp)}</span>
                    </div>
                  </div>
                )}
                <a
                  href={activeMedia.permalink ?? `https://www.instagram.com/${instagramUser}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center border border-[#cbbca8] px-4 py-2 text-xs uppercase tracking-[0.3em] text-[#6b7a8f] hover:bg-[#efe6d8]"
                >
                  Instagram에서 보기
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5번 화면 푸터/연락처 섹션 클래스 */}
      <section className="relative bg-[#E3C7AF] px-6 py-16">
        <div className="mx-auto w-full max-w-[90rem] border border-[#d2b79a] bg-[#F3F2DC] px-14 py-16">
          <div className="grid gap-10 text-[#8a7a68] md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#8a7a68]">
                Contact us
              </p>
              <div className="mt-6 h-36 w-36 border border-[#d2b79a]">
                <Image
                  src="/images/test3/1.jpg"
                  alt="Footer left"
                  width={144}
                  height={144}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-4 text-sm text-[#8a7a68]/70">
                대표명 : 최희영
              </p>
              <p className="text-sm text-[#8a7a68]/70">
                사업자번호 : 875-87-02456 
              </p>
              <p className="text-sm text-[#8a7a68]/70">
                주소 : (본사) 경기도 수원시 권선구 세류로32, 403 - 404호
              </p>
            </div>
            <div className="flex flex-col items-center justify-center gap-6 text-center">
              <p className="font-display text-2xl text-[#8a7a68]">
                Thank you for spending time with us!
              </p>
              <p className="max-w-xs text-sm leading-relaxed text-[#8a7a68]/80">
                오늘의 식탁과 내일의 신뢰를 함께 만들어갑니다.
              </p>
              <button
                type="button"
                className="border border-[#cbbca8] px-6 py-2 text-xs uppercase tracking-[0.3em] text-[#8a7a68] transition-colors duration-500 hover:bg-[#96A9C2] hover:text-[#F3F2DC] -mt-2"
              >
                Let's keep in touch
              </button>
              <p className="mt-4 text-xs uppercase tracking-[0.1em] text-[#8a7a68]/70">
                Contract Catering · Meal Service · On-Site Operations
              </p>
            </div>
            <div className="flex flex-col items-end gap-4 text-right text-sm text-[#8a7a68]/70">
              <div className="h-45 w-45 border border-[#d2b79a]">
                <Image
                  src="/images/test3/2.jpg"
                  alt="Footer right"
                  width={180}
                  height={180}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p>Tel: 031-223-7324</p>
                <p>Email: Thefull@thefull.co.kr</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-center gap-3">
          <Image
            src="/images/logo/favicon.png"
            alt="The Full favicon logo"
            width={40}
            height={40}
          />
          <p className="text-sm text-[#CEA37D]"> ⓒ thefull all rights reserved.</p>
        </div>
      </section>
      {/* 후기 전환 애니메이션 전역 스타일 */}
      <style jsx global>{`
        @keyframes slide-out-left {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(-30%);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(30%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .testimonial-stage {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .testimonial-out,
        .testimonial-in {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .testimonial-out {
          animation: slide-out-left 0.6s ease-out forwards;
        }

        .testimonial-in {
          opacity: 1;
        }

        .testimonial-in.is-animating {
          animation: slide-in-right 0.6s ease-out forwards;
        }
      `}</style>
    </main>
    </>
  );
};

export default Page;

