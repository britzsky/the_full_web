"use client";

import { type TouchEvent, useCallback, useEffect, useRef, useState } from "react";
import { fetchInstagramFeed } from "@/app/lib/instagramClient";

// 소셜 페이지 카드에 필요한 인스타그램 자식 미디어 정보
type InstagramMediaChild = {
  id: string;
  media_type: "IMAGE" | "VIDEO" | string;
  media_url: string;
  thumbnail_url?: string;
};

// 소셜 페이지 카드에 필요한 인스타그램 게시물 정보
type InstagramMediaItem = {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  caption?: string;
  timestamp?: string;
  label?: string;
  children?: InstagramMediaChild[];
};

// 인스타그램 API 응답 실패 시 사용하는 기본 카드 데이터
const fallbackSocialMedia: InstagramMediaItem[] = [
  { id: "fallback-1", media_type: "IMAGE", media_url: "/images/social/social_1.jpg", label: "Social 1" },
  { id: "fallback-2", media_type: "IMAGE", media_url: "/images/social/social_2.jpg", label: "Social 2" },
  { id: "fallback-3", media_type: "IMAGE", media_url: "/images/social/social_3.jpg", label: "Social 3" },
  { id: "fallback-4", media_type: "IMAGE", media_url: "/images/social/social_4.jpg", label: "Social 4" },
  { id: "fallback-5", media_type: "IMAGE", media_url: "/images/social/social_5.jpg", label: "Social 5" },
  { id: "fallback-6", media_type: "IMAGE", media_url: "/images/social/social_6.jpg", label: "Social 6" },
];

// 캐러셀 게시물까지 포함해 실제 표시 가능한 미디어 목록으로 정규화
const getSocialMediaSlides = (item?: InstagramMediaItem | null): InstagramMediaChild[] => {
  if (!item) {
    return [];
  }

  const children = (Array.isArray(item.children) ? item.children : [])
    .filter((child) => Boolean(child.media_url))
    .map((child, index) => ({
      id: child.id || `${item.id}-child-${index}`,
      media_type: child.media_type,
      media_url: child.media_url,
      thumbnail_url: child.thumbnail_url,
    }));

  if (children.length > 0) {
    return children;
  }

  if (!item.media_url) {
    return [];
  }

  return [
    {
      id: item.id,
      media_type: item.media_type,
      media_url: item.media_url,
      thumbnail_url: item.thumbnail_url,
    },
  ];
};

// 카드 썸네일은 게시물의 첫 번째 미디어를 사용
const getSocialPreviewMedia = (item: InstagramMediaItem) => getSocialMediaSlides(item)[0] ?? null;

// 카드 오버레이에 노출할 문구를 적당한 길이로 정리
const getSocialOverlayText = (item: InstagramMediaItem) => {
  const rawText = item.caption?.trim() || item.label || "";
  const normalizedText = rawText.replace(/\s+/g, " ").trim();
  const maxOverlayLength = 150;

  if (normalizedText.length <= maxOverlayLength) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, maxOverlayLength)}...`;
};

// 소셜 본문에서 링크로 처리할 URL 패턴
const socialTextLinkPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|(?:m\.)?blog\.naver\.com\/[^\s]+)/gi;

// 링크 끝에 붙은 문장부호를 분리해 실제 링크 범위를 맞춘다
const splitSocialLinkSuffix = (value: string) => {
  const suffixMatch = value.match(/[),.!?]+$/);
  if (!suffixMatch) {
    return { linkText: value, trailingText: "" };
  }

  return {
    linkText: value.slice(0, -suffixMatch[0].length),
    trailingText: suffixMatch[0],
  };
};

// 소셜 상세 본문 안의 URL을 외부 링크로 렌더링
const renderSocialBodyText = (value?: string) => {
  const sourceText = value?.trim() || "";
  if (!sourceText) {
    return "";
  }

  return sourceText.split(socialTextLinkPattern).map((segment, index) => {
    if (!segment) {
      return null;
    }

    if (!/^(https?:\/\/|www\.|(?:m\.)?blog\.naver\.com\/)/i.test(segment)) {
      return <span key={`social-text-${index}`}>{segment}</span>;
    }

    const { linkText, trailingText } = splitSocialLinkSuffix(segment);
    const href = /^https?:\/\//i.test(linkText) ? linkText : `https://${linkText}`;

    return (
      <span key={`social-link-${index}`}>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="break-all underline underline-offset-4 transition hover:opacity-80"
        >
          {linkText}
        </a>
        {trailingText}
      </span>
    );
  });
};

// 인스타그램 날짜 문자열을 화면 표시용 YYYY-MM-DD 형식으로 변환
const formatMediaDate = (value?: string) => {
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

// 소셜 페이지: 메인 화면과 동일한 카드/모달 구성을 렌더링
export default function SocialMediaClient() {
  const [socialMediaItems, setSocialMediaItems] = useState<InstagramMediaItem[]>([]);
  const [isSocialLoading, setIsSocialLoading] = useState(true);
  const [instagramUser, setInstagramUser] = useState("thefull");
  const [instagramProfileImage, setInstagramProfileImage] = useState("");
  const [activeSocialMedia, setActiveSocialMedia] = useState<InstagramMediaItem | null>(null);
  const [activeSocialMediaIndex, setActiveSocialMediaIndex] = useState(0);
  const socialTouchStartXRef = useRef<number | null>(null);

  const activeSocialMediaSlides = getSocialMediaSlides(activeSocialMedia);
  const activeSocialMediaSlideCount = activeSocialMediaSlides.length;
  const currentActiveSocialMediaIndex =
    activeSocialMediaSlideCount > 0
      ? Math.min(activeSocialMediaIndex, activeSocialMediaSlideCount - 1)
      : 0;
  const currentActiveSocialSlide =
    activeSocialMediaSlides[currentActiveSocialMediaIndex] ?? null;
  const instagramProfileHref = `https://www.instagram.com/${encodeURIComponent(
    (instagramUser || "thefull").trim()
  )}/`;

  // 최신 인스타그램 게시물을 메인 화면과 동일한 정렬 기준으로 6개만 노출
  useEffect(() => {
    let isMounted = true;

    const loadSocialCards = async () => {
      try {
        const payload = await fetchInstagramFeed<InstagramMediaItem>();
        const sourceItems = (payload.data ?? [])
          .filter((item) => getSocialMediaSlides(item).length > 0)
          .slice(0, 12);

        const mappedCards = sourceItems
          .map((item, index) => ({ item, index }))
          .sort((a, b) => {
            const timeA = a.item.timestamp ? new Date(a.item.timestamp).getTime() : Number.NaN;
            const timeB = b.item.timestamp ? new Date(b.item.timestamp).getTime() : Number.NaN;

            if (!Number.isNaN(timeA) && !Number.isNaN(timeB)) {
              return timeB - timeA;
            }
            if (!Number.isNaN(timeA)) {
              return -1;
            }
            if (!Number.isNaN(timeB)) {
              return 1;
            }
            return a.index - b.index;
          })
          .map(({ item }) => item)
          .slice(0, 6);

        if (!isMounted) {
          return;
        }

        if (payload.user?.username) {
          setInstagramUser(payload.user.username);
        }
        setInstagramProfileImage(payload.user?.profile_picture_url ?? "");

        if (mappedCards.length === 0) {
          setSocialMediaItems(fallbackSocialMedia);
          return;
        }

        setSocialMediaItems(mappedCards);
      } catch {
        if (isMounted) {
          setSocialMediaItems(fallbackSocialMedia);
        }
      } finally {
        if (isMounted) {
          setIsSocialLoading(false);
        }
      }
    };

    loadSocialCards();

    return () => {
      isMounted = false;
    };
  }, []);

  // 카드 클릭 시 선택한 게시물의 첫 번째 미디어부터 상세 모달을 연다
  const handleOpenSocialMedia = useCallback((item: InstagramMediaItem) => {
    setActiveSocialMedia(item);
    setActiveSocialMediaIndex(0);
  }, []);

  // 상세 모달을 닫을 때 선택 상태와 터치 시작점을 함께 초기화한다
  const handleCloseSocialMedia = useCallback(() => {
    setActiveSocialMedia(null);
    setActiveSocialMediaIndex(0);
    socialTouchStartXRef.current = null;
  }, []);

  // 캐러셀 게시물은 현재 미디어 인덱스를 기준으로 순환 이동한다
  const moveActiveSocialMedia = useCallback(
    (nextDirection: 1 | -1) => {
      if (activeSocialMediaSlideCount <= 1) {
        return;
      }

      setActiveSocialMediaIndex(
        (previousIndex) =>
          (previousIndex + nextDirection + activeSocialMediaSlideCount) % activeSocialMediaSlideCount
      );
    },
    [activeSocialMediaSlideCount]
  );

  // 모바일 스와이프 제스처 시작 좌표를 저장한다
  const handleSocialMediaTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (activeSocialMediaSlideCount <= 1) {
      return;
    }

    socialTouchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  // 모바일 스와이프 종료 시 이동 방향을 계산한다
  const handleSocialMediaTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const startX = socialTouchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX;
    socialTouchStartXRef.current = null;

    if (startX === null || typeof endX !== "number") {
      return;
    }

    const deltaX = endX - startX;
    if (Math.abs(deltaX) < 45) {
      return;
    }

    moveActiveSocialMedia(deltaX < 0 ? 1 : -1);
  };

  const handleSocialMediaTouchCancel = () => {
    socialTouchStartXRef.current = null;
  };

  // 상세 모달이 열려 있을 때 ESC와 좌우 화살표 키 입력을 처리한다
  useEffect(() => {
    if (!activeSocialMedia) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseSocialMedia();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveActiveSocialMedia(-1);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveActiveSocialMedia(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSocialMedia, handleCloseSocialMedia, moveActiveSocialMedia]);

  return (
    <>
      {/* 소셜 카드 그리드 영역 */}
      <div className="social-card-grid main-social-grid grid grid-cols-2 place-items-center md:grid-cols-3">
        {isSocialLoading &&
          Array.from({ length: 6 }).map((_, index) => (
            <div key={`social-skeleton-${index}`} className="main-social-card social-gallery-card block w-full">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#ece9e4]" />
            </div>
          ))}

        {!isSocialLoading &&
          socialMediaItems.map((item, index) => {
            const previewMedia = getSocialPreviewMedia(item);
            const slideCount = getSocialMediaSlides(item).length;
            const isVideo = previewMedia?.media_type === "VIDEO";
            const overlayText = getSocialOverlayText(item);

            if (!previewMedia) {
              return null;
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleOpenSocialMedia(item)}
                className="main-social-card social-gallery-card group relative block w-full"
                aria-label={`${overlayText || `Instagram ${index + 1}`} 열기`}
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
                  {isVideo ? (
                    <video
                      src={previewMedia.media_url}
                      poster={previewMedia.thumbnail_url}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      preload="metadata"
                      playsInline
                    />
                  ) : (
                    <img
                      src={previewMedia.media_url}
                      alt={overlayText || `Instagram ${index + 1}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}

                  {isVideo && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-base text-[#1f1b18]">
                        ▶
                      </div>
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-center text-[13px] text-white/0 transition group-hover:bg-black/55 group-hover:text-white/100">
                    <div className="main-social-overlay-copy px-5">{overlayText}</div>
                  </div>

                  {slideCount > 1 && (
                    <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white">
                      {slideCount}컷
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-0 border border-white/40" />
                </div>
              </button>
            );
          })}
      </div>

      {/* 소셜 상세 팝업 */}
      {activeSocialMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6 py-10"
          onClick={handleCloseSocialMedia}
        >
          <div
            className="relative max-h-[88vh] w-full max-w-5xl overflow-y-auto bg-[#f7f2e5] shadow-[0_40px_90px_rgba(0,0,0,0.4)] md:grid md:max-h-[80vh] md:grid-cols-[1fr_1fr] md:overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="relative aspect-[3/4] w-full overflow-hidden bg-black md:max-h-[80vh]"
              onTouchStart={handleSocialMediaTouchStart}
              onTouchEnd={handleSocialMediaTouchEnd}
              onTouchCancel={handleSocialMediaTouchCancel}
            >
              {currentActiveSocialSlide?.media_type === "VIDEO" ? (
                <video
                  key={currentActiveSocialSlide.id}
                  src={currentActiveSocialSlide.media_url}
                  poster={currentActiveSocialSlide.thumbnail_url}
                  className="h-full w-full object-contain"
                  controls
                  playsInline
                />
              ) : (
                currentActiveSocialSlide && (
                  <img
                    src={currentActiveSocialSlide.media_url}
                    alt={activeSocialMedia.caption ?? activeSocialMedia.label ?? "Instagram"}
                    className="h-full w-full object-contain"
                  />
                )
              )}

              {activeSocialMediaSlideCount > 1 && (
                <>
                  <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                    {currentActiveSocialMediaIndex + 1} / {activeSocialMediaSlideCount}
                  </div>

                  <button
                    type="button"
                    aria-label="이전 미디어"
                    onClick={(event) => {
                      event.stopPropagation();
                      moveActiveSocialMedia(-1);
                    }}
                    className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-2xl text-white transition hover:bg-black/65"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    aria-label="다음 미디어"
                    onClick={(event) => {
                      event.stopPropagation();
                      moveActiveSocialMedia(1);
                    }}
                    className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-2xl text-white transition hover:bg-black/65"
                  >
                    ›
                  </button>

                  <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/35 px-3 py-2 backdrop-blur-sm">
                    {activeSocialMediaSlides.map((slide, index) => (
                      <button
                        key={slide.id}
                        type="button"
                        aria-label={`${index + 1}번째 미디어 보기`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setActiveSocialMediaIndex(index);
                        }}
                        className={`h-2.5 w-2.5 rounded-full transition ${
                          index === currentActiveSocialMediaIndex ? "bg-white" : "bg-white/45 hover:bg-white/75"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex max-h-none flex-col gap-6 overflow-auto p-6 text-[#6b7a8f] md:max-h-[80vh]">
              <div className="flex items-center justify-between border-b border-[#cbbca8]/60 pb-3 text-xs">
                <a
                  href={instagramProfileHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 items-center gap-2 transition hover:opacity-80"
                >
                  {instagramProfileImage ? (
                    <img
                      src={instagramProfileImage}
                      alt={`${instagramUser} 프로필`}
                      className="h-10 w-10 rounded-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={() => setInstagramProfileImage("")}
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d8ccbb] text-[12px] font-semibold text-[#5f6c80]">
                      {(instagramUser?.trim().charAt(0) || "@").toUpperCase()}
                    </span>
                  )}
                  <span className="truncate text-sm tracking-[0.2em]">@{instagramUser}</span>
                </a>

                <button
                  type="button"
                  aria-label="닫기"
                  onClick={handleCloseSocialMedia}
                  className="text-base"
                >
                  ×
                </button>
              </div>

              <p className="whitespace-pre-line text-base leading-relaxed">
                {renderSocialBodyText(activeSocialMedia.caption ?? activeSocialMedia.label ?? "")}
              </p>

              <div className="mt-auto w-full">
                {formatMediaDate(activeSocialMedia.timestamp) && (
                  <div className="w-full text-xs text-[#6b7a8f]/80">
                    <span className="block h-px w-full bg-[#cbbca8]" />
                    <div className="mt-2 flex justify-end">
                      <span>{formatMediaDate(activeSocialMedia.timestamp)}</span>
                    </div>
                  </div>
                )}

                <a
                  href={activeSocialMedia.permalink ?? `https://www.instagram.com/${instagramUser}/`}
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
    </>
  );
}
