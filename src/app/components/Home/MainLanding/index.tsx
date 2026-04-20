"use client";

import Image from "next/image";
import { type TouchEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import SiteHeader, { SiteHeaderMenuItem } from "../../Common/SiteHeader";
import ScrollToTopButton from "../../Common/ScrollToTopButton";
import SectionTitle from "../../Common/SectionTitle";
import EmphasisCopy from "../../Common/EmphasisCopy";
import { fetchInstagramFeed } from "../../../lib/instagramClient";
import { appendContactManageMenu } from "../../Common/headerMenuUtils";

// 타입 선언 영역
// 메인 히어로의 제목/설명/배경이미지 한 세트를 표현
type HeroSlide = {
  heading: string;
  description: string;
  image: string;
};

// 고객~솔루션 본문 1개 카드(이미지+본문+정렬옵션)를 표현
type ServiceBlock = {
  id: string;
  title: string;
  descriptionHtml: string;
  image: string;
  reverse?: boolean;
  align?: "left" | "right";
};

// 연혁 섹션의 연도와 세부 항목 묶음을 표현
type HistoryItem = {
  year: string;
  lines: string[];
};

// 인스타그램 API 응답에서 카드 렌더링에 쓰는 필드 묶음
type InstagramMediaChild = {
  id: string;
  media_type: "IMAGE" | "VIDEO" | string;
  media_url: string;
  thumbnail_url?: string;
};

// 인스타그램 게시물 단위 데이터(단일/캐러셀 공용)
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

// 소셜 모달에서 실제로 좌우 이동하는 개별 미디어 단위
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

// 소셜 카드 썸네일은 게시물의 첫 번째 미디어를 기준으로 표시
const getSocialPreviewMedia = (item: InstagramMediaItem) => getSocialMediaSlides(item)[0] ?? null;

// 카카오 지도 SDK 전역 객체(window.kakao) 타입 확장
declare global {
// 메인 화면: Window 인터페이스 모델
  interface Window {
    kakao?: any;
  }
}

// 메인 헤더 좌측 메뉴(현재 페이지 내부 섹션 이동 중심)
const leftMenu: SiteHeaderMenuItem[] = [
  { label: "회사소개", href: "/company_profile" },
  { label: "사업영역", href: "/business_area" },
  { label: "급식서비스", href: "/catering_service" },
];

// 메인 헤더 우측 메뉴(현재 페이지 내부 섹션 이동 중심)
const rightMenuBase: SiteHeaderMenuItem[] = [
  { label: "홍보", href: "/social" },
  { label: "채용", href: "/recruit" },
  { label: "고객문의", href: "/contact", isCta: true },
];

// 메인 히어로 슬라이드 데이터
const heroSlides: HeroSlide[] = [
  {
    heading: "위탁급식이란?",
    description:
      "급식이 필요한 곳에서 전문적인 운영 체계, 맞춤형 서비스, 그리고 철저한 품질관리로 건강한 한 끼를 안정적으로 제공하는 서비스입니다.",
    image: "/images/main/main_slide_1.jpg",
  },
  {
    heading: "정성을 담은 운영 시스템",
    description:
      "현장 특성과 동선을 고려한 체계적인 급식 운영으로 식사 시간의 만족도와 효율을 동시에 높입니다.",
    image: "/images/main/main_slide_2.jpg",
  },
  {
    heading: "고객 감동을 만드는 한 끼",
    description:
      "신선한 식재료와 검증된 조리 프로세스로 안전하고 맛있는 식사를 매일 제공합니다.",
    image: "/images/main/main_slide_3.jpg",
  },
];

// 메인 고객~솔루션 서비스 블록 데이터
const serviceBlocks: ServiceBlock[] = [
  {
    id: "company",
    title: "위탁급식",
    descriptionHtml:
      "기업, 관공서, 요양원 등 다양한 기관을 대상으로 <strong>맞춤서비스</strong>를 제공합니다.<br />식단을 계획하고 위생 및 <strong>안전 규정</strong>을 철저히 준수하여 안심하고<br />식사를 즐길 수 있는 환경을 제공합니다.<br />고객은 효율적이고 편리한 <strong>급식 서비스</strong>를 즐길 수 있으며<br />위탁급식 <strong>비즈니스를 전문적으로</strong> 아우르는 솔루션을 경험할 수 있습니다.",
    image: "/images/main/main_1.png",
    align: "left",
  },
  {
    id: "business",
    title: "식자재유통",
    descriptionHtml:
      "<strong>신선하고 다양한 식자재</strong>를 수급하여 고객에게 합리적인 가격으로 제공합니다.<br />가격 경쟁력을 유지하며 <strong>좋은 품질의 식재료</strong>를 안정적으로 공급합니다.<br />고객의 요구에 따라 <strong>다양한 상품 라인업</strong>을 제공하여<br />폭넓은 메뉴 구성이 가능하도록 지원합니다.",
    image: "/images/main/main_2.png",
    reverse: true,
    align: "right",
  },
  {
    id: "service",
    title: "메뉴개발",
    descriptionHtml:
      "전문적인 지식과 혁신적인 <strong>아이디어</strong>를 결합하여 <strong>제품의 품질</strong>,<br /><strong>안전성, 맛 모두를</strong> 충족시키는 메뉴를 개발합니다.",
    image: "/images/main/main_3.png",
    align: "left",
  },
];

// 소셜 API 실패 시 대체 카드 데이터
const fallbackSocialMedia: InstagramMediaItem[] = [
  { id: "fallback-1", media_type: "IMAGE", media_url: "/images/social/social_1.jpg", label: "Social 1" },
  { id: "fallback-2", media_type: "IMAGE", media_url: "/images/social/social_2.jpg", label: "Social 2" },
  { id: "fallback-3", media_type: "IMAGE", media_url: "/images/social/social_3.jpg", label: "Social 3" },
  { id: "fallback-4", media_type: "IMAGE", media_url: "/images/social/social_4.jpg", label: "Social 4" },
  { id: "fallback-5", media_type: "IMAGE", media_url: "/images/social/social_5.jpg", label: "Social 5" },
  { id: "fallback-6", media_type: "IMAGE", media_url: "/images/social/social_6.jpg", label: "Social 6" },
];

// 연혁 좌측 컬럼 데이터
const historyLeft: HistoryItem[] = [
  { year: "2016", lines: ["인천시 식자재 유통업체 채움 설립"] },
  { year: "2017", lines: ["청과물 도소매 바른청과 오픈", "위탁급식 전문업체 더채움 설립"] },
  { year: "2018", lines: ["CJ, 삼성 업무협약 체결"] },
  { year: "2019", lines: ["노인 일자리 창출기여 우수상 수상", "위탁급식 운영사업장 30개소 돌파"] },
  { year: "2021", lines: ["수원시 신사옥 설립"] },
];

// 연혁 우측 컬럼 데이터
const historyRight: HistoryItem[] = [
  {
    year: "2022",
    lines: [
      "칼빈매니토바 국제학교 위탁급식",
      "세스코 MOU 체결",
      "세계한류문화 공헌대상 식품부문 대상",
      "법인전환",
    ],
  },
  {
    year: "2023",
    lines: ["헬스케어 브랜드 런칭", "ISO9001 품질경영시스템 도입", "위탁급식 사업장 50개소 돌파"],
  },
  { year: "2024", lines: ["취약계층 복지 증진을 위한 세류2동 업무 협약"] },
  { year: "2025", lines: ["매출액 160억 돌파"] },
];

// 모바일 연혁은 연도 순으로 한 줄씩 교차 배치하기 위해 전체 항목을 합친다.
const historyTimelineItems: HistoryItem[] = [...historyLeft, ...historyRight].sort(
  (left, right) => Number(left.year) - Number(right.year)
);

// 지도 표시에 사용되는 지점 기본 정보
const HEAD_OFFICE_NAME = "(주) 더채움 본사";
// 메인 화면: HEAD_OFFICE_ADDRESS 정의
const HEAD_OFFICE_ADDRESS = "경기도 수원시 세류로 32";
const HERO_AUTOPLAY_DELAY_MS = 7000;
const HERO_TRANSITION_DURATION_MS = 950;

// 메인 화면: MainLanding props 모델
type MainLandingProps = {
  canManageContact: boolean;
};

// 메인 화면: MainLanding 정의
const MainLanding = ({ canManageContact }: MainLandingProps) => {
// 메인 화면: 문의관리 권한을 반영한 rightMenu 정의
  const rightMenu = appendContactManageMenu(rightMenuBase, canManageContact);

  // 상태 관리 영역
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isInitialCopyAnimating, setIsInitialCopyAnimating] = useState(true);
  const [animationResetKey, setAnimationResetKey] = useState(0);
  const [autoPlayResetKey, setAutoPlayResetKey] = useState(0);
  const [isDesktopHeroLayout, setIsDesktopHeroLayout] = useState<boolean | null>(null);
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);
  const [serviceAnimationCycle, setServiceAnimationCycle] = useState(0);
  const [historyAnimationCycle, setHistoryAnimationCycle] = useState(0);
  const [locationAnimationCycle, setLocationAnimationCycle] = useState(0);
  const [socialMediaItems, setSocialMediaItems] = useState<InstagramMediaItem[]>([]);
  const [isSocialLoading, setIsSocialLoading] = useState(true);
  const [instagramUser, setInstagramUser] = useState("thefull");
  const [instagramProfileImage, setInstagramProfileImage] = useState("");
  const [activeSocialMedia, setActiveSocialMedia] = useState<InstagramMediaItem | null>(null);
  const [activeSocialMediaIndex, setActiveSocialMediaIndex] = useState(0);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
// 메인 화면: 데스크탑 지도 컨테이너 ref
  const desktopMapContainerRef = useRef<HTMLDivElement | null>(null);
// 메인 화면: 모바일 지도 컨테이너 ref
  const mobileMapContainerRef = useRef<HTMLDivElement | null>(null);
  const landingScrollRef = useRef<HTMLElement | null>(null);
  const companySectionRef = useRef<HTMLElement | null>(null);
  const isCompanySectionVisibleRef = useRef(false);
  const historySectionRef = useRef<HTMLElement | null>(null);
  const isHistorySectionVisibleRef = useRef(false);
  const desktopLocationBlockRef = useRef<HTMLDivElement | null>(null);
  const mobileLocationSectionRef = useRef<HTMLElement | null>(null);
  const isDesktopLocationVisibleRef = useRef(false);
  const isMobileLocationVisibleRef = useRef(false);
  const socialTouchStartXRef = useRef<number | null>(null);

  const activeSocialMediaSlides = getSocialMediaSlides(activeSocialMedia);
  const activeSocialMediaSlideCount = activeSocialMediaSlides.length;
  const activeService = serviceBlocks[activeServiceIndex];
  const currentActiveSocialMediaIndex =
    activeSocialMediaSlideCount > 0
      ? Math.min(activeSocialMediaIndex, activeSocialMediaSlideCount - 1)
      : 0;
  const currentActiveSocialSlide =
    activeSocialMediaSlides[currentActiveSocialMediaIndex] ?? null;
  const locationEnterUpClass =
    locationAnimationCycle % 2 === 0
      ? "main-location-enter-up-a"
      : "main-location-enter-up-b";

  // 이전 슬라이드 인덱스와 방향을 기록해 전환 애니메이션 연결
  const goToSlide = useCallback(
    (
      nextIndex: number,
      nextDirection: 1 | -1,
      options?: { resetAutoPlayTimer?: boolean }
    ) => {
      if (nextIndex === activeIndex) {
        return;
      }
      setPreviousIndex(activeIndex);
      setDirection(nextDirection);
      setActiveIndex(nextIndex);
      setIsAnimating(true);
      setAnimationResetKey((prev) => prev + 1);
      if (options?.resetAutoPlayTimer !== false) {
        setAutoPlayResetKey((prev) => prev + 1);
      }
    },
    [activeIndex]
  );

  // 현재 슬라이드 기준 좌/우 이동 인덱스 계산
  const moveSlide = (nextDirection: 1 | -1) => {
// 메인 화면: total 정의
    const total = heroSlides.length;
// 메인 화면: nextIndex 정의
    const nextIndex = (activeIndex + nextDirection + total) % total;
    goToSlide(nextIndex, nextDirection);
  };

  // 좌측 화살표 클릭: 이전 슬라이드 이동
  const handlePrevSlide = () => {
    moveSlide(-1);
  };

  // 우측 화살표 클릭: 다음 슬라이드 이동
  const handleNextSlide = () => {
    moveSlide(1);
  };

  // 점 네비게이션 클릭: 목표 인덱스/방향 계산
  const jumpToSlide = (nextIndex: number) => {
// 메인 화면: nextDirection 정의
    const nextDirection: 1 | -1 = nextIndex > activeIndex ? 1 : -1;
    goToSlide(nextIndex, nextDirection);
  };

  // 자동재생 토글: ❚❚ 버튼은 정지, ▶ 버튼은 재시작
  const handleToggleAutoPlay = () => {
    if (isPaused) {
      setIsPaused(false);
      setAutoPlayResetKey((prev) => prev + 1);
      return;
    }

    setIsPaused(true);
  };

  // 모바일 서비스 카드 좌우 이동
  const moveServiceCard = (nextDirection: 1 | -1) => {
    setActiveServiceIndex((prev) => (prev + nextDirection + serviceBlocks.length) % serviceBlocks.length);
  };

  // 소셜 카드 클릭 시 게시물의 첫 번째 미디어부터 모달을 연다
  const handleOpenSocialMedia = useCallback((item: InstagramMediaItem) => {
    setActiveSocialMedia(item);
    setActiveSocialMediaIndex(0);
  }, []);

  // 소셜 모달 닫기 시 현재 선택 미디어 상태를 함께 초기화한다
  const handleCloseSocialMedia = useCallback(() => {
    setActiveSocialMedia(null);
    setActiveSocialMediaIndex(0);
    socialTouchStartXRef.current = null;
  }, []);

  // 캐러셀 게시물은 현재 인덱스를 기준으로 순환 이동한다
  const moveActiveSocialMedia = useCallback(
    (nextDirection: 1 | -1) => {
      if (activeSocialMediaSlideCount <= 1) {
        return;
      }

      setActiveSocialMediaIndex(
        (prev) => (prev + nextDirection + activeSocialMediaSlideCount) % activeSocialMediaSlideCount
      );
    },
    [activeSocialMediaSlideCount]
  );

  // 모바일 스와이프 제스처 시작 좌표 저장
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

  // 자동 재생 타이머(7초 간격)
  useEffect(() => {
    if (isPaused) {
      return;
    }

// 메인 화면: timer 정의
    const timer = window.setTimeout(() => {
// 메인 화면: nextIndex 정의
      const nextIndex = (activeIndex + 1) % heroSlides.length;
      goToSlide(nextIndex, 1, { resetAutoPlayTimer: false });
    }, HERO_AUTOPLAY_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [activeIndex, goToSlide, isPaused, autoPlayResetKey]);

  // 메인 첫 진입 시 텍스트만 오른쪽에서 들어오도록 초기 애니메이션을 1회 재생
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsInitialCopyAnimating(false);
    }, 560);

    return () => window.clearTimeout(timer);
  }, []);

  // 전환 완료 후 이전 슬라이드 상태 정리
  useEffect(() => {
    if (!isAnimating) {
      return;
    }

// 메인 화면: timer 정의
    const timer = window.setTimeout(() => {
      setIsAnimating(false);
      setPreviousIndex(null);
    }, HERO_TRANSITION_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [animationResetKey, isAnimating]);

  // 인스타그램 소셜 게시물 로드
  useEffect(() => {
// 메인 화면: 상태값
    let isMounted = true;

    // 인스타 API 응답 카드 가공, 실패 시 로컬 fallback 사용
    const loadSocialCards = async () => {
      try {
// 메인 화면: payload 정의
        const payload = await fetchInstagramFeed<InstagramMediaItem>();
// 메인 화면: sourceItems 정의
        const sourceItems = (payload.data ?? [])
          .filter((item) => getSocialMediaSlides(item).length > 0)
          .slice(0, 12);
        // 메인 화면: 영상/이미지 구분 없이 timestamp 최신순으로 정렬 후 6개 노출
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

  // 소셜 상세 팝업 ESC 닫기
  useEffect(() => {
    if (!activeSocialMedia) {
      return;
    }

// 메인 화면: 이벤트 처리 로직
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

  // 캐러셀 길이가 바뀌면 현재 인덱스를 유효 범위로 보정한다
  useEffect(() => {
    if (activeSocialMediaSlideCount === 0) {
      if (activeSocialMediaIndex !== 0) {
        setActiveSocialMediaIndex(0);
      }
      return;
    }

    if (activeSocialMediaIndex > activeSocialMediaSlideCount - 1) {
      setActiveSocialMediaIndex(activeSocialMediaSlideCount - 1);
    }
  }, [activeSocialMediaIndex, activeSocialMediaSlideCount]);

  // 카카오 지도 SDK 로드 및 지도 초기화
  useEffect(() => {
    const isMobileViewport = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
// 메인 화면: container 정의
    const container = isMobileViewport ? mobileMapContainerRef.current : desktopMapContainerRef.current;
    if (!container) {
      return;
    }

    setIsMapReady(false);
    setMapError("");

// 메인 화면: appKey 정의
    const appKey =
      process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ||
      process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY ||
      process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
    if (!appKey) {
      setMapError("카카오 지도 키가 설정되지 않았습니다.");
      return;
    }

// 메인 화면: 상태값
    let cancelled = false;
// 메인 화면: scriptId 정의
    const scriptId = "kakao-map-sdk-script";
// 메인 화면: 기본값 또는 대체 데이터
    const defaultCenter = { lat: 37.2579, lng: 127.0125 };

    // 카카오맵 SDK 준비 후 지도/마커/인포윈도우 생성, 주소 기준 핀 위치 보정
    const initMap = () => {
      const targetContainer = isMobileViewport ? mobileMapContainerRef.current : desktopMapContainerRef.current;
      if (!window.kakao?.maps || !targetContainer || cancelled) {
        return;
      }

      window.kakao.maps.load(() => {
        const nextTargetContainer = isMobileViewport ? mobileMapContainerRef.current : desktopMapContainerRef.current;
        if (!window.kakao?.maps || !nextTargetContainer || cancelled) {
          return;
        }

// 메인 화면: kakao 정의
        const kakao = window.kakao;
// 메인 화면: center 정의
        const center = new kakao.maps.LatLng(defaultCenter.lat, defaultCenter.lng);
// 메인 화면: map 정의
        const map = new kakao.maps.Map(nextTargetContainer, {
          center,
          level: 4,
        });
// 메인 화면: marker 정의
        const marker = new kakao.maps.Marker({
          map,
          position: center,
        });
// 메인 화면: infoWindow 정의
        const infoWindow = new kakao.maps.InfoWindow({
          content: `<div style="padding:8px 10px;font-size:12px;line-height:1.4;">${HEAD_OFFICE_NAME}</div>`,
          disableAutoPan: true,
        });

// 메인 화면: keepMarkerCentered 정의
        const keepMarkerCentered = (position: any) => {
          map.relayout();
          map.setCenter(position);
          marker.setPosition(position);
        };

        if (kakao.maps.services?.Geocoder) {
// 메인 화면: geocoder 정의
          const geocoder = new kakao.maps.services.Geocoder();
          geocoder.addressSearch(
            HEAD_OFFICE_ADDRESS,
            (result: { x: string; y: string }[], status: string) => {
              if (cancelled) {
                return;
              }

              if (
                status === kakao.maps.services.Status.OK &&
                Array.isArray(result) &&
                result.length > 0
              ) {
// 메인 화면: coords 정의
                const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                keepMarkerCentered(coords);
              } else {
                keepMarkerCentered(center);
              }

              infoWindow.open(map, marker);
              setIsMapReady(true);
            }
          );
          return;
        }

        keepMarkerCentered(center);
        infoWindow.open(map, marker);
        setIsMapReady(true);
      });
    };

// 메인 화면: onScriptError 정의
    const onScriptError = () => {
      if (!cancelled) {
        setMapError("카카오 지도 스크립트를 불러오지 못했습니다.");
      }
    };

// 메인 화면: script 정의
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
      document.head.appendChild(script);
    }

    script.addEventListener("load", initMap);
    script.addEventListener("error", onScriptError);

    if (window.kakao?.maps) {
      initMap();
    }

    return () => {
      cancelled = true;
      script?.removeEventListener("load", initMap);
      script?.removeEventListener("error", onScriptError);
    };
  }, []);

  // 렌더링 보조 계산/포맷 함수
  const animationClass = isAnimating
    ? direction === 1
      ? "hero-enter-right"
      : "hero-enter-left"
    : "";

// 메인 화면: previousAnimationClass 정의
  const previousAnimationClass =
    isAnimating && previousIndex !== null
      ? direction === 1
        ? "hero-exit-left"
        : "hero-exit-right"
      : "";
// 메인 화면: copyAnimationClass 정의
  const copyAnimationClass = isAnimating
    ? direction === 1
      ? "hero-copy-enter-right"
      : "hero-copy-enter-left"
    : isInitialCopyAnimating
      ? "hero-copy-enter-right"
      : "";

// 메인 화면: activeSlide 정의
  const activeSlide = heroSlides[activeIndex];
// 메인 화면: previousSlide 정의
  const previousSlide =
    previousIndex !== null ? heroSlides[previousIndex] : null;

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncHeroLayout = () => {
      setIsDesktopHeroLayout(mediaQuery.matches);
    };

    syncHeroLayout();
    mediaQuery.addEventListener("change", syncHeroLayout);

    return () => {
      mediaQuery.removeEventListener("change", syncHeroLayout);
    };
  }, []);

  // 고객~솔루션 섹션이 다시 화면에 들어오면 카드 진입 애니메이션을 재실행한다
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const sectionElement = companySectionRef.current;
    if (!sectionElement) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isVisible = entry.isIntersecting;

        if (isVisible && !isCompanySectionVisibleRef.current) {
          setServiceAnimationCycle((prev) => prev + 1);
        }

        isCompanySectionVisibleRef.current = isVisible;
      },
      {
        root: landingScrollRef.current ?? null,
        threshold: [0, 0.01],
        rootMargin: "0px 0px -10% 0px",
      }
    );

    observer.observe(sectionElement);
    return () => observer.disconnect();
  }, []);

  // 연혁 섹션이 다시 화면에 들어오면 좌/우 컬럼 진입 애니메이션을 재실행한다
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const sectionElement = historySectionRef.current;
    if (!sectionElement) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.55;

        if (isVisible && !isHistorySectionVisibleRef.current) {
          setHistoryAnimationCycle((prev) => prev + 1);
        }

        isHistorySectionVisibleRef.current = isVisible;
      },
      {
        root: landingScrollRef.current,
        threshold: [0.35, 0.55, 0.75],
      }
    );

    observer.observe(sectionElement);
    return () => observer.disconnect();
  }, []);

  // 오시는 길(데스크탑 블록)이 다시 화면에 들어오면 하단 진입 애니메이션을 재실행한다
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const locationElement = desktopLocationBlockRef.current;
    if (!locationElement) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isVisible = entry.isIntersecting;

        if (isVisible && !isDesktopLocationVisibleRef.current) {
          setLocationAnimationCycle((prev) => prev + 1);
        }

        isDesktopLocationVisibleRef.current = isVisible;
      },
      {
        root: landingScrollRef.current ?? null,
        threshold: [0, 0.01],
        rootMargin: "0px 0px -10% 0px",
      }
    );

    observer.observe(locationElement);
    return () => observer.disconnect();
  }, []);

  // 오시는 길(모바일 섹션)이 다시 화면에 들어오면 하단 진입 애니메이션을 재실행한다
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const sectionElement = mobileLocationSectionRef.current;
    if (!sectionElement) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isVisible = entry.isIntersecting;

        if (isVisible && !isMobileLocationVisibleRef.current) {
          setLocationAnimationCycle((prev) => prev + 1);
        }

        isMobileLocationVisibleRef.current = isVisible;
      },
      {
        root: landingScrollRef.current ?? null,
        threshold: [0, 0.01],
        rootMargin: "0px 0px -12% 0px",
      }
    );

    observer.observe(sectionElement);
    return () => observer.disconnect();
  }, []);

  // 슬라이드 좌우 버튼 화살표 SVG 렌더링
  const renderArrow = (dir: "left" | "right") => {
    if (dir === "left") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
            d="M15 18l-6-6l6-6"
          />
        </svg>
      );
    }

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
          d="M9 18l6-6l-6-6"
        />
      </svg>
    );
  };

  // 오시는 길 라벨을 동일 폭에서 양끝 정렬
  const renderJustifiedLabel = (label: string) => {
// 메인 화면: chars 정의
    const chars = Array.from(label);

    return (
      <span
        className="location-label"
        aria-label={label}
        style={{
          display: "inline-flex",
          width: "4.6em",
          alignItems: "center",
          justifyContent: "space-between",
          whiteSpace: "nowrap",
        }}
      >
        {chars.map((char, index) => (
          <span key={`${label}-${index}`}>{char}</span>
        ))}
      </span>
    );
  };

  // 소셜 카드 오버레이 텍스트 우선순위 반환
  const getSocialOverlayText = (item: InstagramMediaItem) => {
    // 메인 화면: rawText 정의
    const rawText = item.caption?.trim() || item.label || "";
    // 메인 화면: normalizedText 정의
    const normalizedText = rawText.replace(/\s+/g, " ").trim();
    // 메인 화면: maxOverlayLength 정의
    const maxOverlayLength = 150;
    if (normalizedText.length <= maxOverlayLength) {
      return normalizedText;
    }
    return `${normalizedText.slice(0, maxOverlayLength)}...`;
  };

  // 소셜 본문에서 링크로 처리할 URL 패턴
  const socialTextLinkPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|(?:m\.)?blog\.naver\.com\/[^\s]+)/gi;

  // URL 끝에 붙은 문장부호를 분리해 링크 범위를 안정적으로 맞춤
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

  // 소셜 상세 본문에 포함된 외부 링크를 하이퍼링크로 렌더링
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
        return (
          <span key={`social-text-${index}`}>
            {segment}
          </span>
        );
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

  // 인스타 날짜 문자열 YYYY-MM-DD 포맷 변환
  const formatMediaDate = (value?: string) => {
    if (!value) {
      return "";
    }

// 메인 화면: date 정의
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    // 메인 화면: year 정의
    const year = date.getFullYear();
    // 메인 화면: month 정의
    const month = String(date.getMonth() + 1).padStart(2, "0");
    // 메인 화면: day 정의
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const instagramProfileHref = `https://www.instagram.com/${encodeURIComponent(
    (instagramUser || "thefull").trim()
  )}/`;

  // 화면 렌더링 영역
  return (
    <main
      id="main-landing-scroll"
      ref={landingScrollRef}
      className="main-page h-[100svh] overflow-x-hidden overflow-y-auto snap-y snap-mandatory scroll-smooth bg-[#FFFFFF] text-[#1b140f]"
    >
      {/* 히어로 섹션 */}
      <section className="relative h-[100svh] min-h-[100svh] snap-start overflow-hidden !py-0">
        <div className="absolute inset-0 z-0">
          {previousSlide && (
            <div
              key={`prev-${previousIndex}-${previousSlide.image}`}
              className={`hero-slide hero-slide-previous ${previousAnimationClass}`}
            >
              <div className="hero-media">
                <Image
                  src={previousSlide.image}
                  alt=""
                  fill
                  priority
                  sizes="100vw"
                  className="hero-slide-image object-cover"
                />
              </div>
            </div>
          )}
          <div
            key={`active-${activeIndex}-${activeSlide.image}`}
            className={`hero-slide hero-slide-current ${animationClass}`}
          >
            <div className="hero-media">
              <Image
                src={activeSlide.image}
                alt={activeSlide.heading}
                fill
                priority
                sizes="100vw"
                className="hero-slide-image object-cover"
              />
            </div>
          </div>
        </div>
        <div
          className="absolute inset-0 z-[5] pointer-events-none"
          style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
        />

        {/* 공통 헤더 */}
        <SiteHeader
          leftItems={leftMenu}
          rightItems={rightMenu}
        />

        <div className="relative z-10 mx-auto h-[100svh] max-w-6xl px-4">
          {isDesktopHeroLayout === false && (
            <div className="hero-mobile-shell">
              <div className="hero-mobile-copy">
                <div
                  key={`mobile-${activeSlide.heading}`}
                  className={`hero-mobile-copy-inner ${copyAnimationClass}`}
                >
                  <h1 className="text-[34px] font-bold">{activeSlide.heading}</h1>
                  <p className="mx-auto mt-12 min-h-[96px] max-w-3xl whitespace-pre-line text-[15px] leading-[1.55] text-white">
                    {activeSlide.description}
                  </p>
                </div>
              </div>

              <div className="hero-mobile-actions">
                <div className="hero-main-actions">
                  <div className="hero-control-group text-white">
                    <button
                      type="button"
                      onClick={handlePrevSlide}
                      aria-label="이전 슬라이드"
                      className="hero-control-button"
                    >
                      {renderArrow("left")}
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleAutoPlay}
                      aria-label={isPaused ? "자동재생 시작" : "자동재생 일시정지"}
                      className="hero-control-button hero-control-toggle"
                    >
                      {isPaused ? "▶" : "❚❚"}
                    </button>
                    <button
                      type="button"
                      onClick={handleNextSlide}
                      aria-label="다음 슬라이드"
                      className="hero-control-button"
                    >
                      {renderArrow("right")}
                    </button>
                  </div>

                  <a
                    href="/business_area"
                    className="hero-cta-button"
                  >
                    더보기
                  </a>
                  <a
                    href="/contact"
                    className="hero-cta-button"
                  >
                    문의하기
                  </a>
                </div>

                <div className="mt-6 flex justify-center gap-2">
                  {heroSlides.map((slide, index) => (
                    <button
                      key={`mobile-dot-${slide.heading}`}
                      type="button"
                      onClick={() => jumpToSlide(index)}
                      aria-label={`${index + 1}번 슬라이드`}
                      className={`h-2.5 w-2.5 rounded-full border border-white transition-all duration-300 ${
                        index === activeIndex
                          ? "scale-110 bg-white"
                          : "bg-white/25 hover:bg-white/45"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {isDesktopHeroLayout === true && (
            <div className="hero-content-shell flex h-full flex-col items-center text-center text-white">
            <div className="hero-copy-zone">
              <div
                key={activeSlide.heading}
                className={`hero-copy-block ${copyAnimationClass}`}
              >
                <h1 className="text-[48px] font-bold">{activeSlide.heading}</h1>
                <p className="mx-auto mt-12 min-h-[118px] max-w-3xl whitespace-pre-line text-[20px] leading-[1.55] text-white">
                  {activeSlide.description}
                </p>
              </div>
            </div>

            <div className="hero-action-zone flex w-full flex-col items-center">
              <div className="hero-main-actions">
                <div className="hero-control-group text-white">
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    aria-label="이전 슬라이드"
                    className="hero-control-button"
                  >
                    {renderArrow("left")}
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleAutoPlay}
                    aria-label={isPaused ? "자동재생 시작" : "자동재생 일시정지"}
                    className="hero-control-button hero-control-toggle"
                  >
                    {isPaused ? "▶" : "❚❚"}
                  </button>
                  <button
                    type="button"
                    onClick={handleNextSlide}
                    aria-label="다음 슬라이드"
                    className="hero-control-button"
                  >
                    {renderArrow("right")}
                  </button>
                </div>

                <a
                  href="/business_area"
                  className="hero-cta-button"
                >
                  더보기
                </a>
                <a
                  href="/contact"
                  className="hero-cta-button"
                >
                  문의하기
                </a>
              </div>

              <div className="mt-6 flex justify-center gap-2">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.heading}
                    type="button"
                    onClick={() => jumpToSlide(index)}
                    aria-label={`${index + 1}번 슬라이드`}
                    className={`h-2.5 w-2.5 rounded-full border border-white transition-all duration-300 ${
                      index === activeIndex
                        ? "scale-110 bg-white"
                        : "bg-white/25 hover:bg-white/45"
                    }`}
                  />
                ))}
              </div>
            </div>
            </div>
          )}
        </div>

        <style jsx>{`
          /* 슬라이드 레이어 기본 틀 */
          .hero-slide {
            position: absolute;
            inset: 0;
            will-change: transform;
          }

          /* 배경 이미지 렌더링 성능 힌트 */
          .hero-slide-image {
            will-change: transform;
          }

          /* 이미지가 잘리지 않도록 잡아주는 래퍼 */
          .hero-media {
            position: absolute;
            inset: 0;
            overflow: hidden;
            will-change: transform;
            transform: scale(1);
          }

          /* 현재 슬라이드에만 켄번즈(줌+이동) 애니메이션 적용 */
          .hero-slide-current .hero-media {
            animation: hero-kenburns 7s ease-out both;
            transform-origin: center center;
          }

          /* 오시는 길 라벨 폭 고정 공통 클래스 */
          .location-label {
            letter-spacing: 0;
          }

          /* 현재 슬라이드를 이전 슬라이드보다 위 레이어에 배치 */
          .hero-slide-current {
            z-index: 2;
          }

          /* 이전 슬라이드는 현재 슬라이드 아래 레이어에 배치 */
          .hero-slide-previous {
            z-index: 1;
          }

          /* 다음 슬라이드가 오른쪽에서 들어오는 클래스 */
          .hero-enter-right {
            animation: hero-enter-right 0.95s cubic-bezier(0.22, 0.61, 0.36, 1) both;
          }

          /* 다음 슬라이드가 왼쪽에서 들어오는 클래스 */
          .hero-enter-left {
            animation: hero-enter-left 0.95s cubic-bezier(0.22, 0.61, 0.36, 1) both;
          }

          /* 현재 슬라이드가 왼쪽으로 빠져나가는 클래스 */
          .hero-exit-left {
            animation: hero-exit-left 0.95s cubic-bezier(0.22, 0.61, 0.36, 1) both;
          }

          /* 현재 슬라이드가 오른쪽으로 빠져나가는 클래스 */
          .hero-exit-right {
            animation: hero-exit-right 0.95s cubic-bezier(0.22, 0.61, 0.36, 1) both;
          }

          /* 본문 카피가 왼쪽에서 들어오는 클래스 */
          .hero-copy-enter-left {
            animation: hero-copy-enter-left 0.55s ease both;
          }

          /* 본문 카피가 오른쪽에서 들어오는 클래스 */
          .hero-copy-enter-right {
            animation: hero-copy-enter-right 0.55s ease both;
          }

          /* 슬라이드 진입(오른쪽 -> 가운데) */
          @keyframes hero-enter-right {
            from {
              opacity: 1;
              transform: translate3d(55%, 0, 0) scale(1.04);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }

          /* 슬라이드 진입(왼쪽 -> 가운데) */
          @keyframes hero-enter-left {
            from {
              opacity: 1;
              transform: translate3d(-55%, 0, 0) scale(1.04);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }

          /* 슬라이드 퇴장(가운데 -> 왼쪽) */
          @keyframes hero-exit-left {
            from {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
            to {
              opacity: 1;
              transform: translate3d(-55%, 0, 0) scale(1.04);
            }
          }

          /* 슬라이드 퇴장(가운데 -> 오른쪽) */
          @keyframes hero-exit-right {
            from {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
            to {
              opacity: 1;
              transform: translate3d(55%, 0, 0) scale(1.04);
            }
          }

          /* 본문 카피 진입(왼쪽 -> 가운데) */
          @keyframes hero-copy-enter-left {
            from {
              opacity: 0;
              transform: translateX(-26px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          /* 본문 카피 진입(오른쪽 -> 가운데) */
          @keyframes hero-copy-enter-right {
            from {
              opacity: 0;
              transform: translateX(26px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          /* 배경 이미지가 천천히 확대/이동되는 켄번즈 */
          @keyframes hero-kenburns {
            from {
              transform: scale(1) translate3d(0, 0, 0);
            }
            to {
              transform: scale(1.12) translate3d(-1.45%, -0.65%, 0);
            }
          }

        `}</style>
      </section>

      {/* 회사 소개/사업 영역 섹션 */}
      <section
        id="company"
        ref={companySectionRef}
        className="h-[100svh] snap-start bg-[#FFFFFF] !py-0 text-[#000000] flex flex-col"
      >
        {/* 섹션 제목 위치 통일 */}
        <SectionTitle>고객만족을 넘어 고객감동을 실현하는 맞춤형 급식 솔루션</SectionTitle>

        {/* 고객~솔루션 본문 세로 정렬 래퍼 */}
        <div className="main-section-body-flex">
          {/* 데스크탑 고객~솔루션 카드 묶음 컨테이너 */}
          <div key={`main-services-desktop-${serviceAnimationCycle}`} className="main-services-wrap w-full">
          {serviceBlocks.map((item, index) => {
            // 고객~솔루션 카드는 순서대로 진입하도록 카드별 지연 시간을 적용
            const mediaDelay = `${(index * 0.24).toFixed(2)}s`;
            const copyDelay = `${(index * 0.24 + 0.06).toFixed(2)}s`;

            return (
              <article
                key={item.title}
                className={`service-block-${item.id} grid items-start gap-5 md:grid-cols-2 md:gap-10 ${
                  item.reverse
                    ? "md:[&>.service-media]:order-2 md:[&>.service-copy]:order-1"
                    : ""
                }`}
              >
                <div
                  className={`service-media main-service-media-frame relative overflow-hidden ${
                    item.reverse ? "md:ml-auto md:w-[96%]" : "md:w-[96%]"
                  } ${item.reverse ? "main-service-media-enter-right" : "main-service-media-enter-left"}`}
                  style={{ animationDelay: mediaDelay }}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>

                <div
                  className={`service-copy self-start ${
                    item.align === "right" ? "text-right" : "text-left"
                  } ${item.reverse ? "md:-mr-[4%]" : "md:-ml-[4%]"} ${
                    item.reverse ? "main-service-copy-enter-left" : "main-service-copy-enter-right"
                  }`}
                  style={{ animationDelay: copyDelay }}
                >
                  <div className="main-body-bar" />
                  <div className={`${item.align === "right" ? "px-4 md:pl-8 md:pr-0" : "px-4 md:pl-0 md:pr-8"}`}>
                    <h3 className="main-body-title">
                      {item.title}
                    </h3>
                    <EmphasisCopy html={item.descriptionHtml} className="main-body-copy" />
                  </div>
                </div>
              </article>
            );
          })}
          </div>

          {/* 모바일 고객~솔루션 카드 캐러셀 */}
          <div className="main-services-mobile-wrap">
            <article key={`main-services-mobile-${serviceAnimationCycle}-${activeService.id}`} className="main-service-mobile-card">
              <div
                className={`main-service-mobile-media main-service-media-frame relative overflow-hidden ${
                  activeService.reverse ? "main-service-media-enter-right" : "main-service-media-enter-left"
                }`}
              >
                <Image
                  src={activeService.image}
                  alt={activeService.title}
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              </div>

              <div
                className={`service-copy text-left ${
                  activeService.reverse ? "main-service-copy-enter-left" : "main-service-copy-enter-right"
                }`}
              >
                <div className="main-body-bar" />
                <div className="px-4">
                  <div className="flex items-end justify-between gap-3">
                    <h3 className="main-body-title">
                      {activeService.title}
                    </h3>
                    <span className="main-mobile-sequence-text">
                      {String(activeServiceIndex + 1).padStart(2, "0")} / {String(serviceBlocks.length).padStart(2, "0")}
                    </span>
                  </div>
                  <EmphasisCopy html={activeService.descriptionHtml} className="main-body-copy" />
                </div>
              </div>
            </article>

            <div className="main-mobile-carousel-controls">
              <button
                type="button"
                onClick={() => moveServiceCard(-1)}
                aria-label="이전 서비스 카드"
                className="main-mobile-carousel-arrow"
              >
                {renderArrow("left")}
              </button>

              <div className="main-mobile-carousel-dots" aria-label="서비스 카드 순서">
                {serviceBlocks.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveServiceIndex(index)}
                    aria-label={`${index + 1}번 서비스 카드`}
                    aria-pressed={index === activeServiceIndex}
                    className={`main-mobile-carousel-dot ${
                      index === activeServiceIndex ? "main-mobile-carousel-dot-active" : ""
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => moveServiceCard(1)}
                aria-label="다음 서비스 카드"
                className="main-mobile-carousel-arrow"
              >
                {renderArrow("right")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 소셜 미디어 섹션 */}
      <section
        id="social"
        className="relative h-[100svh] snap-start overflow-hidden bg-[#FFFFFF] !py-0 text-[#000000] flex flex-col"
      >
        {/* 소셜 배경 이미지와 화이트 오버레이 레이어 */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <Image
            src="/images/social/social_background.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-[0.3] blur-[3px] scale-110"
          />
          <div className="absolute inset-0 bg-white/50" />
        </div>
        <div className="relative z-[1] flex h-full flex-col">
          {/* 섹션 제목 위치 통일 */}
          <SectionTitle>Social</SectionTitle>
          {/* 소셜 본문 세로 정렬 래퍼 */}
          <div className="main-section-body-flex">
            {/* 소셜 그리드 폭 컨테이너 */}
            <div className="main-social-wrap mx-auto w-full max-w-[1240px] px-3 md:px-6">
            <div className="main-social-grid grid grid-cols-2 place-items-center md:grid-cols-3">
              {isSocialLoading &&
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={`social-skeleton-${index}`} className="main-social-card main-social-card-item block w-full">
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#ece9e4]" />
                  </div>
                ))}
              {!isSocialLoading &&
                socialMediaItems.map((item, index) => {
                  // 메인 화면: 상태값
                  const previewMedia = getSocialPreviewMedia(item);
                  const slideCount = getSocialMediaSlides(item).length;
                  const isVideo = previewMedia?.media_type === "VIDEO";
                  // 메인 화면: overlayText 정의
                  const overlayText = getSocialOverlayText(item);

                  if (!previewMedia) {
                    return null;
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleOpenSocialMedia(item)}
                      className="main-social-card main-social-card-item group relative block w-full"
                      aria-label={`${overlayText || `Instagram ${index + 1}`} 열기`}
                    >
                      {/* 소셜 카드: 세로 직사각형 비율(3:4) 유지 + 프레임 꽉 채우기(확대) */}
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
                          <div className="main-social-overlay-copy px-5">
                            {overlayText}
                          </div>
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
            </div>
          </div>
        </div>
      </section>

      {/* 소셜 상세 팝업 */}
      {activeSocialMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6 py-10"
          onClick={handleCloseSocialMedia}
        >
          <div
            className="relative w-full max-w-5xl overflow-y-auto bg-[#f7f2e5] shadow-[0_40px_90px_rgba(0,0,0,0.4)] max-h-[88vh] md:grid md:max-h-[80vh] md:grid-cols-[1fr_1fr] md:overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#cbbca8]/60 bg-[#f7f2e5] px-4 py-3 text-xs text-[#6b7a8f] md:hidden">
              <a
                href={instagramProfileHref}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-2 transition hover:opacity-80"
              >
                {instagramProfileImage ? (
                  <img
                    src={instagramProfileImage}
                    alt={`${instagramUser} profile`}
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
                aria-label="Close"
                onClick={handleCloseSocialMedia}
                className="text-base text-[#6b7a8f]"
              >
                ×
              </button>
            </div>
            {/* 소셜 모달: 카드와 동일한 고정 3:4 프레임 + 검정 배경 */}
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
            <div className="flex max-h-none flex-col gap-4 overflow-auto px-4 pb-4 pt-4 text-[#6b7a8f] md:max-h-[80vh] md:gap-6 md:p-6">
              <div className="hidden items-center justify-between border-b border-[#cbbca8]/60 pb-3 text-xs md:flex">
                <a
                  href={instagramProfileHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 items-center gap-2 transition hover:opacity-80"
                >
                  {/* 인스타그램 프로필 이미지 */}
                  {instagramProfileImage ? (
                    <img
                      src={instagramProfileImage}
                      alt={`${instagramUser} profile`}
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
                  aria-label="Close"
                  onClick={handleCloseSocialMedia}
                  className="text-base"
                >
                  ×
                </button>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line md:text-base">
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

      {/* 연혁 + 오시는 길 섹션 */}
      <section
        id="history"
        ref={historySectionRef}
        className="h-[100svh] snap-start bg-[#FFFFFF] !py-0 text-[#000000] flex flex-col"
      >
        {/* 섹션 제목 위치 통일 */}
        <SectionTitle key={`history-title-${historyAnimationCycle}`} wrapClassName="main-history-enter-down">연혁</SectionTitle>
        {/* 연혁/오시는길 본문 세로 정렬 래퍼 */}
        <div className="main-section-body-flex">
          {/* 데스크탑 연혁/오시는길 콘텐츠 컨테이너 */}
          <div className="main-history-wrap">
            <div className="mx-auto w-full max-w-[1120px]">
              <div className="mt-4 grid gap-7 md:grid-cols-2 md:gap-x-14 md:gap-y-8">
                <div key={`history-left-${historyAnimationCycle}`} className="space-y-7 main-history-enter-down">
                  {historyLeft.map((item) => (
                    <div key={item.year} className="grid grid-cols-[120px_1fr] items-start gap-5 md:grid-cols-[136px_1fr]">
                      <p className="main-history-year">
                        {item.year}
                      </p>
                      <div className="space-y-2 pt-0.5">
                        {item.lines.map((line) => (
                          <p key={`${item.year}-${line}`} className="main-history-line">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div key={`history-right-${historyAnimationCycle}`} className="space-y-7 main-history-enter-down-delay">
                  {historyRight.map((item) => (
                    <div key={item.year} className="grid grid-cols-[120px_1fr] items-start gap-5 md:grid-cols-[136px_1fr]">
                      <p className="main-history-year">
                        {item.year}
                      </p>
                      <div className="space-y-2 pt-0.5">
                        {item.lines.map((line) => (
                          <p key={`${item.year}-${line}`} className="main-history-line">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div id="location" ref={desktopLocationBlockRef} className={locationEnterUpClass}>
              {/* 오시는 길 섹션 제목 위치 통일 */}
              <SectionTitle wrapClassName="main-location-title-wrap">오시는 길</SectionTitle>
              <div className="mx-auto mt-4 w-full max-w-[1120px] px-3 md:px-6">
                <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:gap-8">
                  <div className="main-map-frame relative overflow-hidden border border-[#d2b79a] bg-[#f4efe8]">
                    <div ref={desktopMapContainerRef} className="h-full w-full" />
                    {!isMapReady && !mapError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#f4efe8]/80 text-sm text-[#7a6b5a]">
                        지도를 불러오는 중입니다.
                      </div>
                    )}
                    {mapError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#f4efe8]/90 px-4 text-center text-sm text-[#7a6b5a]">
                        <p>{mapError}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center">
                    <div className="main-location-info">
                      <div className="grid grid-cols-[92px_1fr] items-center gap-4 md:grid-cols-[100px_1fr]">
                        <p className="main-location-label">{renderJustifiedLabel("회사명")}</p>
                        <p className="main-location-value">(주) 더채움</p>
                      </div>
                      <div className="grid grid-cols-[92px_1fr] items-center gap-4 md:grid-cols-[100px_1fr]">
                        <p className="main-location-label">{renderJustifiedLabel("사업자명")}</p>
                        <p className="main-location-value">875 - 87 - 02546</p>
                      </div>
                      <div className="grid grid-cols-[92px_1fr] items-center gap-4 md:grid-cols-[100px_1fr]">
                        <p className="main-location-label">{renderJustifiedLabel("대표자")}</p>
                        <p className="main-location-value">최희영</p>
                      </div>
                      <div className="grid grid-cols-[92px_1fr] items-center gap-4 md:grid-cols-[100px_1fr]">
                        <p className="main-location-label">{renderJustifiedLabel("설립일")}</p>
                        <p className="main-location-value">2016. 01. 20</p>
                      </div>
                      <div className="grid grid-cols-[92px_1fr] items-start gap-4 md:grid-cols-[100px_1fr]">
                        <p className="main-location-label pt-0.5">{renderJustifiedLabel("소재지")}</p>
                        <p className="main-location-value">경기도 수원시 세류로 32 404호 (본사)</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <a
                    href={`https://map.kakao.com/link/search/${encodeURIComponent(HEAD_OFFICE_ADDRESS)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center border border-[#cbbca8] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#7a6b5a] hover:bg-[#efe6d8]"
                  >
                    카카오맵으로 이동
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 모바일 연혁 카드 콘텐츠 */}
          <div className="main-history-mobile-wrap">
            <div className="main-history-mobile-timeline">
              {historyTimelineItems.map((item, index) => {
                const isRight = index % 2 === 1;

                return (
                  <div
                    key={`mobile-history-${item.year}`}
                    className={`main-history-mobile-timeline-row ${
                      isRight ? "main-history-mobile-timeline-row-right" : ""
                    }`}
                  >
                    <article className="main-history-mobile-entry">
                      <p className="main-history-mobile-entry-year">{item.year}</p>
                      <div className="main-history-mobile-entry-lines">
                        {item.lines.map((line) => (
                          <p key={`${item.year}-${line}`} className="main-history-line">
                            {line}
                          </p>
                        ))}
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 모바일 오시는 길 전용 섹션 */}
      <section
        ref={mobileLocationSectionRef}
        className="main-location-mobile-section h-[100svh] snap-start bg-[#FFFFFF] !py-0 text-[#000000] flex flex-col md:hidden"
      >
        <SectionTitle wrapClassName={locationEnterUpClass}>오시는 길</SectionTitle>
        <div className="main-section-body-flex">
          <div className={`main-location-mobile-wrap ${locationEnterUpClass}`}>
            <div className="main-location-mobile-card">
              <div className="main-map-frame relative overflow-hidden border border-[#d2b79a] bg-[#f4efe8]">
                <div ref={mobileMapContainerRef} className="h-full w-full" />
                {!isMapReady && !mapError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#f4efe8]/80 px-4 text-center text-sm text-[#7a6b5a]">
                    지도를 불러오는 중입니다.
                  </div>
                )}
                {mapError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#f4efe8]/90 px-4 text-center text-sm text-[#7a6b5a]">
                    <p>{mapError}</p>
                  </div>
                )}
              </div>

              <div className="main-location-info">
                <div className="grid grid-cols-[80px_1fr] items-center gap-3">
                  <p className="main-location-label">{renderJustifiedLabel("회사명")}</p>
                  <p className="main-location-value">(주) 더채움</p>
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center gap-3">
                  <p className="main-location-label">{renderJustifiedLabel("사업자명")}</p>
                  <p className="main-location-value">875 - 87 - 02546</p>
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center gap-3">
                  <p className="main-location-label">{renderJustifiedLabel("대표자")}</p>
                  <p className="main-location-value">최희영</p>
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center gap-3">
                  <p className="main-location-label">{renderJustifiedLabel("설립일")}</p>
                  <p className="main-location-value">2016. 01. 20</p>
                </div>
                <div className="grid grid-cols-[80px_1fr] items-start gap-3">
                  <p className="main-location-label pt-0.5">{renderJustifiedLabel("소재지")}</p>
                  <p className="main-location-value">경기도 수원시 세류로 32 404호 (본사)</p>
                </div>
              </div>

              <div className="mt-1">
                <a
                  href={`https://map.kakao.com/link/search/${encodeURIComponent(HEAD_OFFICE_ADDRESS)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center border border-[#cbbca8] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#7a6b5a] hover:bg-[#efe6d8]"
                >
                  카카오맵으로 이동
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* 메인 페이지 공통 상단 이동 버튼 */}
      <ScrollToTopButton targetId="main-landing-scroll" />
    </main>
  );
};

export default MainLanding;
