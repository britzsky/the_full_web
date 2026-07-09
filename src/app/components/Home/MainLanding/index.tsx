"use client";

import Image from "next/image";
import Link from "next/link";
import { type TouchEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import SiteHeader, { SiteHeaderMenuItem } from "../../Common/SiteHeader";
import ScrollToTopButton from "../../Common/ScrollToTopButton";
import SiteFooter from "../../Common/SiteFooter";
import SectionTitle from "../../Common/SectionTitle";
import EmphasisCopy from "../../Common/EmphasisCopy";
import { fetchInstagramFeed } from "../../../lib/instagramClient";
import { appendContactManageMenu } from "../../Common/headerMenuUtils";
import { NAVER_BLOG_HOME, type NaverBlogPost } from "@/app/social/naver-blog/types";

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

// 네이버 블로그 날짜 포맷 (YYYY.MM.DD)
function formatBlogDate(pubDate: string): string {
  if (!pubDate) return "";
  const date = new Date(pubDate);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

// 카카오 지도 SDK 전역 객체(window.kakao) 타입 확장
declare global {
  // 카카오 지도 SDK가 window.kakao 에 마운트되므로 전역 Window 타입에 추가
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
    image: "/images/main/main_slide_1.webp",
  },
  {
    heading: "정성을 담은 운영 시스템",
    description:
      "현장 특성과 동선을 고려한 체계적인 급식 운영으로 식사 시간의 만족도와 효율을 동시에 높입니다.",
    image: "/images/main/main_slide_2.webp",
  },
  {
    heading: "고객 감동을 만드는 한 끼",
    description:
      "신선한 식재료와 검증된 조리 프로세스로 안전하고 맛있는 식사를 매일 제공합니다.",
    image: "/images/main/main_slide_3.webp",
  },
];

// 메인 고객~솔루션 서비스 블록 데이터
const serviceBlocks: ServiceBlock[] = [
  {
    id: "company",
    title: "위탁급식",
    descriptionHtml:
      "기업, 관공서, 요양원 등 다양한 기관을 대상으로 <strong>맞춤서비스</strong>를 제공합니다.<br />식단을 계획하고 위생 및 <strong>안전 규정</strong>을 철저히 준수하여 안심하고<br />식사를 즐길 수 있는 환경을 제공합니다.<br />고객은 효율적이고 편리한 <strong>급식 서비스</strong>를 즐길 수 있으며<br />위탁급식 <strong>비즈니스를 전문적으로</strong> 아우르는 솔루션을 경험할 수 있습니다.",
    image: "/images/main/home_service_1.webp",
    align: "left",
  },
  {
    id: "business",
    title: "식자재유통",
    descriptionHtml:
      "<strong>신선하고 다양한 식자재</strong>를 수급하여 고객에게 합리적인 가격으로 제공합니다.<br />가격 경쟁력을 유지하며 <strong>좋은 품질의 식재료</strong>를 안정적으로 공급합니다.<br />고객의 요구에 따라 <strong>다양한 상품 라인업</strong>을 제공하여<br />폭넓은 메뉴 구성이 가능하도록 지원합니다.",
    image: "/images/main/home_service_2.webp",
    reverse: true,
    align: "right",
  },
  {
    id: "service",
    title: "메뉴개발",
    descriptionHtml:
      "전문적인 지식과 혁신적인 <strong>아이디어</strong>를 결합하여 <strong>제품의 품질</strong>,<br /><strong>안전성, 맛 모두를</strong> 충족시키는 메뉴를 개발합니다.",
    image: "/images/main/home_service_3.webp",
    align: "left",
  },
];

// 소셜 API 실패 시 대체 카드 데이터
const fallbackSocialMedia: InstagramMediaItem[] = [
  { id: "fallback-1", media_type: "IMAGE", media_url: "/images/social/social_1.webp", label: "Social 1" },
  { id: "fallback-2", media_type: "IMAGE", media_url: "/images/social/social_2.webp", label: "Social 2" },
  { id: "fallback-3", media_type: "IMAGE", media_url: "/images/social/social_3.webp", label: "Social 3" },
  { id: "fallback-4", media_type: "IMAGE", media_url: "/images/social/social_4.webp", label: "Social 4" },
  { id: "fallback-5", media_type: "IMAGE", media_url: "/images/social/social_5.webp", label: "Social 5" },
  { id: "fallback-6", media_type: "IMAGE", media_url: "/images/social/social_6.webp", label: "Social 6" },
];

// 연혁 좌측 컬럼 데이터
const historyLeft: HistoryItem[] = [
  { year: "2016", lines: ["- 인천시 식자재 유통업체 채움 설립"] },
  {
    year: "2017", lines: [
      "- 청과물 도소매 바른청과 오픈",
      "- 위탁급식 전문업체 더채움 설립"]
  },
  { year: "2018", lines: ["- CJ, 삼성 업무협약 체결"] },
  {
    year: "2019", lines: [
      "- 노인 일자리 창출기여 우수상 수상",
      "- 위탁급식 운영사업장 30개소 돌파"]
  },
  { year: "2021", lines: ["- 수원시 신사옥 설립"] },
];

// 연혁 우측 컬럼 데이터
const historyRight: HistoryItem[] = [
  {
    year: "2022",
    lines: [
      "- 칼빈매니토바 국제학교 위탁급식",
      "- 세스코 MOU 체결",
      "- 세계한류문화 공헌대상 식품부문 대상",
      "- 법인전환",
    ],
  },
  {
    year: "2023",
    lines: [
      "- 헬스케어 브랜드 런칭",
      "- ISO9001 품질경영시스템 도입",
      "- 위탁급식 사업장 50개소 돌파"],
  },
  { year: "2024", lines: ["- 취약계층 복지 증진을 위한 세류2동 업무 협약"] },
  { year: "2025", lines: ["- 매출액 160억 돌파"] },
];

// 우측 컬럼 항목 간격: 왼쪽 마지막 점과 오른쪽 마지막 점이 같은 시각에 도달하도록 역산
const historyRightInterval = ((historyLeft.length - 1) * 0.44) / (historyRight.length - 1);

// 모바일 연혁은 연도 순으로 한 줄씩 교차 배치하기 위해 전체 항목을 합친다.
const historyTimelineItems: HistoryItem[] = [...historyLeft, ...historyRight].sort(
  (left, right) => Number(left.year) - Number(right.year)
);

// 지도 표시에 사용되는 지점 기본 정보
const HEAD_OFFICE_NAME = "(주) 더채움 본사";
// 카카오/네이버 지도 주소 검색에 사용되는 더채움 본사 도로명 주소
const HEAD_OFFICE_ADDRESS = "경기도 수원시 세류로 32";
// 오시는 길 지도 핀 안에 표시되는 더채움 로고 이미지
const HEAD_OFFICE_MARKER_LOGO_SRC = "/images/logo/thefull_logo.webp";
// 히어로 자동재생 간격 및 슬라이드 전환 소요 시간 상수
const HERO_AUTOPLAY_DELAY_MS = 7000;
const HERO_TRANSITION_DURATION_MS = 950;
const MAP_TYPE_BUTTON_ACTIVE_CLASS = "bg-[#5a4a3a] text-white";
const MAP_TYPE_BUTTON_INACTIVE_CLASS = "bg-white text-[#5a4a3a] hover:bg-[#f4efe8] active:bg-[#efe6d8]";

// 더채움 본사 위치를 표시하는 카카오 지도 커스텀 핀
const createHeadOfficeMarkerContent = () => {
  return `
    <div style="width:96px;text-align:center;font-family:Arial,'Noto Sans KR',sans-serif;pointer-events:none;">
      <div style="position:relative;width:70px;height:76px;margin:0 auto;">
        <div style="position:absolute;left:50%;top:2px;width:58px;height:58px;margin-left:-29px;border:4px solid #111;border-radius:50% 50% 50% 0;background:#fff;transform:rotate(-45deg);box-shadow:0 2px 7px rgba(0,0,0,0.22);">
          <div style="position:absolute;left:50%;top:50%;width:42px;height:42px;border-radius:50%;transform:translate(-50%,-50%) rotate(45deg);display:flex;align-items:center;justify-content:center;overflow:hidden;">
            <img src="${HEAD_OFFICE_MARKER_LOGO_SRC}" alt="" style="width:86px;height:28px;object-fit:contain;display:block;" />
          </div>
        </div>
      </div>
    </div>
  `;
};

// 메인 랜딩 컴포넌트 props (고객문의 관리 메뉴 노출 여부)
type MainLandingProps = {
  canManageContact: boolean;
};

// 카카오 지도 뷰 타입: 일반 지도 또는 스카이뷰
type MapViewType = "roadmap" | "skyview";

// 메인 랜딩 페이지 루트 컴포넌트: 히어로·서비스·소셜·연혁·오시는 길 섹션을 스냅 스크롤로 렌더링
const MainLanding = ({ canManageContact }: MainLandingProps) => {
  // 문의관리 권한 여부에 따라 우측 메뉴에 관리 항목 추가
  const rightMenu = appendContactManageMenu(rightMenuBase, canManageContact);

  // 상태 관리 영역
  // 현재 활성 히어로 슬라이드 인덱스
  const [activeIndex, setActiveIndex] = useState(0);
  // 슬라이드 전환 중 이전 슬라이드 인덱스 (전환 애니메이션 동시 재생용)
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  // 슬라이드 이동 방향 (1: 오른쪽→왼쪽, -1: 왼쪽→오른쪽)
  const [direction, setDirection] = useState<1 | -1>(1);
  // 히어로 자동재생 일시정지 여부
  const [isPaused, setIsPaused] = useState(false);
  // 히어로 슬라이드 전환 애니메이션 진행 중 여부
  const [isAnimating, setIsAnimating] = useState(false);
  // 최초 진입 시 카피 텍스트 애니메이션 진행 여부
  const [isInitialCopyAnimating, setIsInitialCopyAnimating] = useState(true);
  // 애니메이션 클래스를 강제 리셋하기 위한 카운터 키
  const [animationResetKey, setAnimationResetKey] = useState(0);
  // 자동재생 타이머를 재시작하기 위한 카운터 키
  const [autoPlayResetKey, setAutoPlayResetKey] = useState(0);
  // 현재 뷰포트가 데스크탑(768px 이상) 히어로 레이아웃인지 여부 (null: 초기 미결정)
  const [isDesktopHeroLayout, setIsDesktopHeroLayout] = useState<boolean | null>(null);
  // 모바일 서비스 캐러셀의 현재 활성 카드 인덱스
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);
  // 서비스 섹션 진입 애니메이션 재실행 트리거 카운터
  const [serviceAnimationCycle, setServiceAnimationCycle] = useState(0);
  // 연혁 섹션 진입 애니메이션 재실행 트리거 카운터
  const [historyAnimationCycle, setHistoryAnimationCycle] = useState(0);
  // 연혁 섹션 현재 활성 여부 (플로팅 버튼 레이아웃 전환용)
  const [isHistorySection, setIsHistorySection] = useState(false);
  // 오시는 길 섹션 진입 애니메이션 재실행 트리거 카운터
  const [locationAnimationCycle, setLocationAnimationCycle] = useState(0);
  // 인스타그램 게시물 카드 목록 (API 응답 또는 fallback 데이터)
  const [socialMediaItems, setSocialMediaItems] = useState<InstagramMediaItem[]>([]);
  // 인스타그램 카드 로딩 중 여부 (스켈레톤 표시 제어)
  const [isSocialLoading, setIsSocialLoading] = useState(true);
  // 인스타그램 계정명 (프로필 링크 및 표시용)
  const [instagramUser, setInstagramUser] = useState("thefull");
  // 인스타그램 프로필 이미지 URL (모달 상단 아이콘)
  const [instagramProfileImage, setInstagramProfileImage] = useState("");
  // 소셜 상세 팝업에서 현재 열린 게시물 (null이면 팝업 닫힘)
  const [activeSocialMedia, setActiveSocialMedia] = useState<InstagramMediaItem | null>(null);
  // 소셜 팝업 내 캐러셀 현재 슬라이드 인덱스
  const [activeSocialMediaIndex, setActiveSocialMediaIndex] = useState(0);
  // 소셜 섹션 SNS 탭 선택 상태 (instagram / naver)
  const [activeMainSocialTab, setActiveMainSocialTab] = useState<"instagram" | "naver">("instagram");
  // SNS 탭 전환 인디케이터 위치/폭 (슬라이딩 바 애니메이션용)
  const [mainSocialIndicatorStyle, setMainSocialIndicatorStyle] = useState<{ left: number; width: number } | null>(null);
  // 메인 소셜 섹션 네이버 블로그 최신 게시물 목록
  const [naverPostsMain, setNaverPostsMain] = useState<NaverBlogPost[]>([]);
  // 네이버 블로그 로딩 중 여부 (스켈레톤 표시 제어)
  const [isNaverMainLoading, setIsNaverMainLoading] = useState(true);
  // 카카오 지도 초기화 완료 여부 (지도 컨트롤 버튼 표시 조건)
  const [isMapReady, setIsMapReady] = useState(false);
  // 카카오 지도 로드/초기화 실패 시 오류 메시지
  const [mapError, setMapError] = useState("");
  // 데스크탑 카카오 지도를 마운트할 DOM 컨테이너 ref
  const desktopMapContainerRef = useRef<HTMLDivElement | null>(null);
  // 모바일 카카오 지도를 마운트할 DOM 컨테이너 ref
  const mobileMapContainerRef = useRef<HTMLDivElement | null>(null);
  // 데스크탑 지도 인스턴스(zoom/reset 제어용)
  const desktopMapInstanceRef = useRef<{ map: any; center: any } | null>(null);
  // 모바일 지도 인스턴스(zoom/reset 제어용)
  const mobileMapInstanceRef = useRef<{ map: any; center: any } | null>(null);
  // 지도 타입 버튼은 카카오 지도 DOM 갱신과 분리해서 직접 표시 상태를 맞춘다
  const activeMapTypeRef = useRef<MapViewType>("roadmap");
  const mapTypeButtonRefs = useRef<{
    desktop: Partial<Record<MapViewType, HTMLButtonElement | null>>;
    mobile: Partial<Record<MapViewType, HTMLButtonElement | null>>;
  }>({ desktop: {}, mobile: {} });
  // 전체 페이지 스크롤 컨테이너
  const landingScrollRef = useRef<HTMLElement | null>(null);
  // 서비스 섹션 요소
  const companySectionRef = useRef<HTMLElement | null>(null);
  // 서비스 섹션 현재 가시 여부
  const isCompanySectionVisibleRef = useRef(false);
  // 연혁 섹션 요소
  const historySectionRef = useRef<HTMLElement | null>(null);
  // 연혁 섹션 현재 가시 여부
  const isHistorySectionVisibleRef = useRef(false);
  // 데스크탑 오시는 길 블록 요소
  const desktopLocationBlockRef = useRef<HTMLDivElement | null>(null);
  // 모바일 오시는 길 섹션 요소
  const mobileLocationSectionRef = useRef<HTMLElement | null>(null);
  // 데스크탑 오시는 길 현재 가시 여부
  const isDesktopLocationVisibleRef = useRef(false);
  // 모바일 오시는 길 현재 가시 여부
  const isMobileLocationVisibleRef = useRef(false);
  // 소셜 팝업 스와이프 시작 X 좌표
  const socialTouchStartXRef = useRef<number | null>(null);
  // 메인 소셜 탭 컨테이너·버튼 refs (인디케이터 계산용)
  const mainSocialTabContainerRef = useRef<HTMLDivElement>(null);
  const mainSocialInstagramRef = useRef<HTMLButtonElement>(null);
  const mainSocialNaverRef = useRef<HTMLButtonElement>(null);
  const isMainSocialTabInitializedRef = useRef(false);

  // 현재 열린 소셜 게시물의 슬라이드 목록
  const activeSocialMediaSlides = getSocialMediaSlides(activeSocialMedia);
  // 슬라이드 총 개수
  const activeSocialMediaSlideCount = activeSocialMediaSlides.length;
  // 현재 활성 서비스 카드 데이터
  const activeService = serviceBlocks[activeServiceIndex];
  // 인덱스 범위 보정된 현재 슬라이드 인덱스
  const currentActiveSocialMediaIndex =
    activeSocialMediaSlideCount > 0
      ? Math.min(activeSocialMediaIndex, activeSocialMediaSlideCount - 1)
      : 0;
  // 현재 표시 중인 슬라이드 미디어
  const currentActiveSocialSlide =
    activeSocialMediaSlides[currentActiveSocialMediaIndex] ?? null;
  // 오시는 길 진입 애니메이션 클래스(a/b 교번)
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

  // 현재 슬라이드 기준 좌/우 이동 인덱스 계산 후 goToSlide 호출
  const moveSlide = (nextDirection: 1 | -1) => {
    // 전체 슬라이드 수 (순환 계산용)
    const total = heroSlides.length;
    // 이동 후 도달할 슬라이드 인덱스 (범위 초과 시 순환)
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

  // 점 네비게이션 클릭: 목표 인덱스에 따라 진입 방향을 결정하고 해당 슬라이드로 이동
  const jumpToSlide = (nextIndex: number) => {
    // 목표 인덱스가 현재보다 크면 오른쪽(→), 작으면 왼쪽(←) 방향
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

  // 소셜 팝업 스와이프 취소 시 시작 좌표 초기화
  const handleSocialMediaTouchCancel = () => {
    socialTouchStartXRef.current = null;
  };

  // 자동 재생 타이머(7초 간격)
  useEffect(() => {
    if (isPaused) {
      return;
    }

    // HERO_AUTOPLAY_DELAY_MS(7초) 후 다음 슬라이드로 자동 전환
    const timer = window.setTimeout(() => {
      // 다음 슬라이드 인덱스 (마지막이면 0으로 순환)
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

    // HERO_TRANSITION_DURATION_MS(950ms) 후 애니메이션 상태 및 이전 슬라이드 초기화
    const timer = window.setTimeout(() => {
      setIsAnimating(false);
      setPreviousIndex(null);
    }, HERO_TRANSITION_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [animationResetKey, isAnimating]);

  // 인스타그램 소셜 게시물 로드 (마운트 해제 후 상태 업데이트 방지)
  useEffect(() => {
    // 컴포넌트가 언마운트되면 setState 호출을 막기 위한 플래그
    let isMounted = true;

    // 인스타 API 응답 카드 가공, 실패 시 로컬 fallback 사용
    const loadSocialCards = async () => {
      try {
        // 인스타그램 피드 API 호출 (최대 6개 요청)
        const payload = await fetchInstagramFeed<InstagramMediaItem>({ limit: 6 });
        // 미디어가 없는 항목은 제외하고 최대 6개로 제한
        const sourceItems = (payload.data ?? [])
          .filter((item) => getSocialMediaSlides(item).length > 0)
          .slice(0, 6);
        // 영상/이미지 구분 없이 timestamp 최신순으로 정렬 후 6개 노출
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

  // 메인 소셜 탭 인디케이터 애니메이션
  useEffect(() => {
    const activeEl = activeMainSocialTab === "instagram" ? mainSocialInstagramRef.current : mainSocialNaverRef.current;
    const container = mainSocialTabContainerRef.current;
    if (!activeEl || !container) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    const targetLeft = activeRect.left - containerRect.left;
    const targetWidth = activeRect.width;

    if (!isMainSocialTabInitializedRef.current) {
      isMainSocialTabInitializedRef.current = true;
      setMainSocialIndicatorStyle({ left: targetLeft, width: targetWidth });
      return;
    }

    const isMovingRight = activeMainSocialTab === "naver";
    setMainSocialIndicatorStyle({
      left: isMovingRight ? targetLeft : targetLeft + targetWidth - 6,
      width: 6,
    });

    const tid = window.setTimeout(() => {
      setMainSocialIndicatorStyle({ left: targetLeft, width: targetWidth });
    }, 280);

    return () => clearTimeout(tid);
  }, [activeMainSocialTab]);

  // 메인 소셜 섹션 네이버 블로그 첫 페이지 로드
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch("/social/naver-blog?page=1");
        if (!res.ok) throw new Error();
        const data = await res.json() as { posts: NaverBlogPost[]; hasMore: boolean };
        if (isMounted) setNaverPostsMain(data.posts);
      } catch {
        // 로드 실패 시 빈 목록 유지
      } finally {
        if (isMounted) setIsNaverMainLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  // 소셜 상세 팝업 ESC 닫기
  useEffect(() => {
    if (!activeSocialMedia) {
      return;
    }

    // ESC: 팝업 닫기 / ArrowLeft·Right: 캐러셀 슬라이드 이동
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

  // 카카오 지도 SDK 로드 및 지도 초기화 (모바일/데스크탑 컨테이너 분기)
  useEffect(() => {
    const isMobileViewport = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
    // 뷰포트에 맞는 지도 컨테이너 선택 (모바일은 mobileMapContainerRef)
    const container = isMobileViewport ? mobileMapContainerRef.current : desktopMapContainerRef.current;
    if (!container) {
      return;
    }

    setIsMapReady(false);
    setMapError("");

    // 환경변수에서 카카오 지도 앱 키를 순서대로 탐색
    const appKey =
      process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ||
      process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY ||
      process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
    if (!appKey) {
      setMapError("카카오 지도 키가 설정되지 않았습니다.");
      return;
    }

    // 컴포넌트 언마운트 시 진행 중인 SDK 초기화를 취소하기 위한 플래그
    let cancelled = false;
    // 중복 script 태그 생성을 막기 위한 script 요소 ID
    const scriptId = "kakao-map-sdk-script";
    // Geocoder 실패 시 사용하는 더채움 본사 기본 좌표 (위도/경도)
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

        // 카카오 SDK 참조 단축 변수
        const kakao = window.kakao;
        // 기본 중심 좌표 (Geocoder 결과로 대체됨)
        const center = new kakao.maps.LatLng(defaultCenter.lat, defaultCenter.lng);
        // 카카오 지도 인스턴스 생성 (줌 레벨 4)
        const map = new kakao.maps.Map(nextTargetContainer, {
          center,
          level: 4,
        });
        // 더채움 본사 위치를 표시하는 커스텀 오버레이(핀) 생성
        const markerOverlay = new kakao.maps.CustomOverlay({
          content: createHeadOfficeMarkerContent(),
          position: center,
          xAnchor: 0.5,
          yAnchor: 0.72,
          zIndex: 3,
        });

        // 지도 중심과 마커를 주어진 좌표로 동기화하는 헬퍼 함수
        const keepMarkerCentered = (position: any) => {
          map.relayout();
          map.setCenter(position);
          markerOverlay.setPosition(position);
          markerOverlay.setMap(map);
        };

        if (kakao.maps.services?.Geocoder) {
          // 도로명 주소로 정확한 좌표를 조회하는 Geocoder 인스턴스
          const geocoder = new kakao.maps.services.Geocoder();
          geocoder.addressSearch(
            HEAD_OFFICE_ADDRESS,
            (result: { x: string; y: string }[], status: string) => {
              if (cancelled) {
                return;
              }

              const instanceRef = isMobileViewport ? mobileMapInstanceRef : desktopMapInstanceRef;
              if (
                status === kakao.maps.services.Status.OK &&
                Array.isArray(result) &&
                result.length > 0
              ) {
                // Geocoder 성공: 주소에 해당하는 위경도 좌표 생성
                const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                keepMarkerCentered(coords);
                instanceRef.current = { map, center: coords };
              } else {
                keepMarkerCentered(center);
                instanceRef.current = { map, center };
              }

              setIsMapReady(true);
            }
          );
          return;
        }

        keepMarkerCentered(center);
        (isMobileViewport ? mobileMapInstanceRef : desktopMapInstanceRef).current = { map, center };
        setIsMapReady(true);
      });
    };

    // 카카오 지도 SDK 스크립트 로드 실패 시 에러 메시지 설정
    const onScriptError = () => {
      if (!cancelled) {
        setMapError("카카오 지도 스크립트를 불러오지 못했습니다.");
      }
    };

    // 이미 로드된 script 태그가 있으면 재사용, 없으면 동적으로 생성하여 head에 추가
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

  // 지도 확대 버튼 핸들러
  const handleMapZoomIn = useCallback((isMobile: boolean) => {
    const inst = isMobile ? mobileMapInstanceRef.current : desktopMapInstanceRef.current;
    if (inst?.map) {
      const center = inst.map.getCenter();
      inst.map.setLevel(inst.map.getLevel() - 1, {
        anchor: center,
        animate: { duration: 250 },
      });
    }
  }, []);

  // 지도 축소 버튼 핸들러
  const handleMapZoomOut = useCallback((isMobile: boolean) => {
    const inst = isMobile ? mobileMapInstanceRef.current : desktopMapInstanceRef.current;
    if (inst?.map) {
      const center = inst.map.getCenter();
      inst.map.setLevel(inst.map.getLevel() + 1, {
        anchor: center,
        animate: { duration: 250 },
      });
    }
  }, []);

  // 지도 초기 위치/줌 레벨 복원 핸들러
  const handleMapReset = useCallback((isMobile: boolean) => {
    const inst = isMobile ? mobileMapInstanceRef.current : desktopMapInstanceRef.current;
    if (inst?.map && inst.center) {
      inst.map.setLevel(4);
      inst.map.setCenter(inst.center);
    }
  }, []);

  // 지도 타입 버튼의 선택 표시를 카카오 지도 제어와 같은 흐름에서 갱신한다
  const updateMapTypeButtonState = useCallback((nextType: MapViewType) => {
    activeMapTypeRef.current = nextType;

    (["desktop", "mobile"] as const).forEach((viewportType) => {
      (["roadmap", "skyview"] as const).forEach((mapType) => {
        const button = mapTypeButtonRefs.current[viewportType][mapType];
        if (!button) {
          return;
        }

        const isActive = mapType === nextType;
        button.setAttribute("aria-pressed", String(isActive));
        button.className = `h-9 px-3 text-xs font-semibold transition-colors ${
          isActive ? MAP_TYPE_BUTTON_ACTIVE_CLASS : MAP_TYPE_BUTTON_INACTIVE_CLASS
        }`;
      });
    });
  }, []);

  // 지도/스카이뷰 보기 전환 핸들러
  const handleMapTypeChange = useCallback((isMobile: boolean, nextType: MapViewType) => {
    const inst = isMobile ? mobileMapInstanceRef.current : desktopMapInstanceRef.current;
    const kakao = window.kakao;
    if (!inst?.map || !kakao?.maps?.MapTypeId) {
      return;
    }

    const skyviewMapType = kakao.maps.MapTypeId.SKYVIEW || kakao.maps.MapTypeId.HYBRID;
    const kakaoMapType =
      nextType === "skyview"
        ? skyviewMapType
        : kakao.maps.MapTypeId.ROADMAP;

    if (!kakaoMapType) {
      return;
    }

    inst.map.setMapTypeId(kakaoMapType);
    updateMapTypeButtonState(nextType);
  }, [updateMapTypeButtonState]);

  // 렌더링 보조 계산/포맷 함수
  // 현재 진입 슬라이드에 적용할 CSS 애니메이션 클래스 (방향에 따라 오른쪽/왼쪽 진입)
  const animationClass = isAnimating
    ? direction === 1
      ? "hero-enter-right"
      : "hero-enter-left"
    : "";

  // 이전 슬라이드에 적용할 퇴장 애니메이션 클래스 (방향에 따라 왼쪽/오른쪽 퇴장)
  const previousAnimationClass =
    isAnimating && previousIndex !== null
      ? direction === 1
        ? "hero-exit-left"
        : "hero-exit-right"
      : "";
  // 히어로 카피 텍스트 진입 애니메이션 클래스 (최초 진입 또는 슬라이드 전환 시 적용)
  const copyAnimationClass = isAnimating
    ? direction === 1
      ? "hero-copy-enter-right"
      : "hero-copy-enter-left"
    : isInitialCopyAnimating
      ? "hero-copy-enter-right"
      : "";

  // 현재 표시 중인 히어로 슬라이드 데이터
  const activeSlide = heroSlides[activeIndex];
  // 전환 중인 이전 히어로 슬라이드 데이터 (퇴장 애니메이션에 사용, 없으면 null)
  const previousSlide =
    previousIndex !== null ? heroSlides[previousIndex] : null;

  // 768px 기준 히어로 레이아웃 전환 감지
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

        if (isVisible && !isHistorySectionVisibleRef.current && entry.boundingClientRect.top >= -1) {
          setHistoryAnimationCycle((prev) => prev + 1);
        }

        isHistorySectionVisibleRef.current = isVisible;
        setIsHistorySection(isVisible);
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

  // 오시는 길 라벨을 동일 폭에서 양끝 정렬 (회사명·대표자 등 한국어 라벨 자간 균등 배분)
  const renderJustifiedLabel = (label: string) => {
    // 라벨 문자열을 개별 글자 배열로 분리해 각 글자를 균등 간격으로 배치
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

  // 오시는 길 지도 우측 컨트롤 버튼 영역
  const renderMapControls = (isMobile: boolean) => {
    const viewportType = isMobile ? "mobile" : "desktop";
    const mapTypeButtonClass = (mapType: MapViewType) =>
      `h-9 px-3 text-xs font-semibold transition-colors ${
        activeMapTypeRef.current === mapType
          ? MAP_TYPE_BUTTON_ACTIVE_CLASS
          : MAP_TYPE_BUTTON_INACTIVE_CLASS
      }`;

    return (
      <>
        <div className="absolute right-3 top-3 z-10 flex overflow-hidden rounded-md border border-[#d2b79a] bg-white shadow-sm">
          <button
            ref={(button) => {
              mapTypeButtonRefs.current[viewportType].roadmap = button;
            }}
            type="button"
            aria-label="지도 보기"
            aria-pressed={activeMapTypeRef.current === "roadmap"}
            onClick={() => handleMapTypeChange(isMobile, "roadmap")}
            className={mapTypeButtonClass("roadmap")}
          >
            지도
          </button>
          <div className="w-px bg-[#d2b79a]" />
          <button
            ref={(button) => {
              mapTypeButtonRefs.current[viewportType].skyview = button;
            }}
            type="button"
            aria-label="스카이뷰 보기"
            aria-pressed={activeMapTypeRef.current === "skyview"}
            onClick={() => handleMapTypeChange(isMobile, "skyview")}
            className={mapTypeButtonClass("skyview")}
          >
            스카이뷰
          </button>
        </div>
        <div className="absolute right-3 top-[3.65rem] z-10 flex flex-col overflow-hidden rounded-md border border-[#d2b79a] bg-white shadow-sm">
          <button
            type="button"
            aria-label="확대"
            onClick={() => handleMapZoomIn(isMobile)}
            className="flex h-8 w-8 items-center justify-center text-lg text-[#5a4a3a] transition-colors hover:bg-[#f4efe8] active:bg-[#efe6d8]"
          >+</button>
          <div className="h-px bg-[#d2b79a]" />
          <button
            type="button"
            aria-label="축소"
            onClick={() => handleMapZoomOut(isMobile)}
            className="flex h-8 w-8 items-center justify-center text-lg text-[#5a4a3a] transition-colors hover:bg-[#f4efe8] active:bg-[#efe6d8]"
          >−</button>
          <div className="h-px bg-[#d2b79a]" />
          <button
            type="button"
            aria-label="원래대로"
            onClick={() => handleMapReset(isMobile)}
            className="flex h-8 w-8 items-center justify-center text-[#5a4a3a] transition-colors hover:bg-[#f4efe8] active:bg-[#efe6d8]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
        </div>
      </>
    );
  };

  // 소셜 카드 호버 오버레이에 표시할 텍스트를 결정하는 함수 (caption 우선, 없으면 label, 150자 초과 시 말줄임)
  const getSocialOverlayText = (item: InstagramMediaItem) => {
    // caption(인스타 본문) 또는 label(폴백 데이터 레이블) 중 우선 사용
    const rawText = item.caption?.trim() || item.label || "";
    // 연속 공백을 단일 공백으로 정규화
    const normalizedText = rawText.replace(/\s+/g, " ").trim();
    // 오버레이에 표시할 최대 글자 수
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

  // 인스타그램 게시물 날짜 문자열을 소셜 팝업에 표시할 YYYY-MM-DD 형식으로 변환
  const formatMediaDate = (value?: string) => {
    if (!value) {
      return "";
    }

    // ISO 8601 형식 등 날짜 문자열을 Date 객체로 파싱
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();
    // 월은 0-based이므로 +1 후 2자리 패딩
    const month = String(date.getMonth() + 1).padStart(2, "0");
    // 일자 2자리 패딩
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 인스타그램 프로필 페이지 링크
  const instagramProfileHref = `https://www.instagram.com/${encodeURIComponent(
    (instagramUser || "thefull").trim()
  )}/`;

  // 화면 렌더링 영역
  return (
    <main
      id="main-landing-scroll"
      ref={landingScrollRef}
      className="main-page h-[100svh] overflow-x-hidden overflow-y-auto snap-y snap-mandatory scroll-smooth bg-[#FAFAF8] text-[#1b140f]"
    >
      {/* 히어로 섹션 */}
      <section className="relative h-[100svh] min-h-[100svh] snap-start overflow-hidden !py-0">
        <div className="absolute inset-0 z-0">
          {/* 미표시 슬라이드 이미지 프리로드 (화면에 보이지 않음) */}
          {/* 첫 번째 슬라이드만 priority — LCP 이미지. 나머지는 브라우저 유휴 시간에 로드 */}
          {heroSlides.map((slide, i) => (
            <Image
              key={`preload-${slide.image}`}
              src={slide.image}
              alt=""
              fill
              {...(i === 0 ? { priority: true } : { loading: "lazy" })}
              sizes="100vw"
              className="sr-only"
            />
          ))}
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

        {/* 공통 상단 헤더 (로고 + 좌측/우측 메뉴) */}
        <SiteHeader
          leftItems={leftMenu}
          rightItems={rightMenu}
        />

        <div className="relative z-10 mx-auto h-[100svh] max-w-6xl px-4">
          {/* 모바일 히어로 레이아웃 (768px 미만): 제목·설명 텍스트 + 컨트롤 버튼 + 점 네비게이션 */}
          {isDesktopHeroLayout === false && (
            <div className="hero-mobile-shell">
              {/* 모바일: 슬라이드 제목 및 설명 카피 영역 */}
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

              {/* 모바일: 슬라이드 컨트롤(이전/정지·재생/다음) + CTA 버튼 영역 */}
              <div className="hero-mobile-actions">
                <div className="hero-main-actions">
                  {/* 이전/정지·재생/다음 슬라이드 제어 버튼 그룹 */}
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

                  {/* 사업영역 페이지로 이동하는 더보기 CTA 버튼 */}
                  <a
                    href="/business_area"
                    className="hero-cta-button"
                  >
                    더보기
                  </a>
                  {/* 고객문의 페이지로 이동하는 문의하기 CTA 버튼 */}
                  <a
                    href="/contact"
                    className="hero-cta-button"
                  >
                    문의하기
                  </a>
                </div>

                {/* 모바일: 슬라이드 점(dot) 네비게이션 */}
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

          {/* 데스크탑 히어로 레이아웃 (768px 이상): 제목·설명 텍스트 + 컨트롤 버튼 + 점 네비게이션 */}
          {isDesktopHeroLayout === true && (
            <div className="hero-content-shell flex h-full flex-col items-center text-center text-white">
            {/* 데스크탑: 슬라이드 제목 및 설명 카피 영역 */}
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

            {/* 데스크탑: 컨트롤 버튼 + CTA + 점 네비게이션 영역 */}
            <div className="hero-action-zone flex w-full flex-col items-center">
              <div className="hero-main-actions">
                {/* 이전/정지·재생/다음 슬라이드 제어 버튼 그룹 */}
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

                {/* 사업영역 페이지로 이동하는 더보기 CTA 버튼 */}
                <a
                  href="/business_area"
                  className="hero-cta-button"
                >
                  더보기
                </a>
                {/* 고객문의 페이지로 이동하는 문의하기 CTA 버튼 */}
                <a
                  href="/contact"
                  className="hero-cta-button"
                >
                  문의하기
                </a>
              </div>

              {/* 데스크탑: 슬라이드 점(dot) 네비게이션 */}
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

        {/* 히어로 섹션 전용 CSS 애니메이션 및 레이아웃 인라인 스타일 정의 */}
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

      {/* 급식 솔루션 섹션 */}
      <section
        id="company"
        ref={companySectionRef}
        className="h-[100svh] snap-start !py-0 text-[#000000] flex flex-col relative bg-white"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <Image
            src="/images/main/main_background_1.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-white/95" />
        </div>
        {/* 급식 솔루션 섹션 제목 */}
        <div className="relative z-[1]">
          <SectionTitle englishLabel="Catering Solution">고객만족을 넘어 고객감동을 실현하는 맞춤형 급식 솔루션</SectionTitle>
        </div>

        {/* 급식 솔루션 본문 세로 정렬 래퍼 */}
        <div className="main-section-body-flex relative z-[1]">
          {/* 데스크탑: 위탁급식/식자재유통/메뉴개발 서비스 카드 3개를 세로로 배치 */}
          <div key={`main-services-desktop-${serviceAnimationCycle}`} className="main-services-wrap w-full">
          {serviceBlocks.map((item, index) => {
            // 서비스 카드는 순서대로 진입하도록 카드별 지연 시간을 적용
            const mediaDelay = `${(index * 0.35).toFixed(2)}s`;
            const copyDelay = `${(index * 0.35 + 0.06).toFixed(2)}s`;

            return (
              <article
                key={item.title}
                className={`service-block-${item.id} relative grid items-start gap-5 md:grid-cols-2 md:gap-10 ${
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
                    quality={80}
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
                      <span className="main-service-block-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
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
                  quality={80}
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

            {/* 모바일 서비스 카드 좌우 화살표 및 점 네비게이션 */}
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

      {/* 소셜 미디어 섹션: 인스타그램 게시물 그리드 및 네이버 블로그 목록 표시 */}
      <section
        id="social"
        className="relative h-[100svh] snap-start overflow-hidden bg-[#FAFAF8] !py-0 text-[#000000] flex flex-col"
      >
        {/* 소셜 섹션 배경 이미지와 화이트 오버레이 레이어 - 모바일에서 숨김 */}
        <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
          <Image
            src="/images/social/social_background.webp"
            alt=""
            fill
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-white/30" />
        </div>
        <div className="relative z-[1] flex h-full flex-col">
          {/* 소셜 섹션 제목 */}
          <SectionTitle englishLabel="Social Media">더채움 소식</SectionTitle>

          {/* SNS 전환 탭 행 (인스타그램/네이버 블로그 전환) - 화면 가운데 정렬 */}
          <div className="main-sns-tabs-row">
            <div ref={mainSocialTabContainerRef} className="social-sns-tabs">
              <button
                ref={mainSocialInstagramRef}
                type="button"
                className={`social-sns-tab${activeMainSocialTab === "instagram" ? " social-sns-tab--active" : ""}`}
                onClick={() => setActiveMainSocialTab("instagram")}
              >
                <Image src="/images/sns_logo/instagram.webp" alt="Instagram" width={28} height={28} className="social-sns-tab-logo" />
                <span>Instagram</span>
              </button>
              <span className="social-sns-tab-divider" aria-hidden="true">|</span>
              <button
                ref={mainSocialNaverRef}
                type="button"
                className={`social-sns-tab${activeMainSocialTab === "naver" ? " social-sns-tab--active" : ""}`}
                onClick={() => setActiveMainSocialTab("naver")}
              >
                <Image src="/images/sns_logo/naver_blog.webp" alt="Naver Blog" width={28} height={28} className="social-sns-tab-logo" />
                <span>Naver Blog</span>
              </button>
              {mainSocialIndicatorStyle && (
                <div className="social-sns-indicator" style={{ left: mainSocialIndicatorStyle.left, width: mainSocialIndicatorStyle.width }} />
              )}
            </div>
          </div>

          {/* 소셜 섹션 본문 세로 정렬 래퍼 */}
          <div className="main-section-body-flex" style={{ paddingBottom: "clamp(4rem, 12vh, 8rem)" }}>

            {/* 인스타그램 탭 콘텐츠: 6개 카드 그리드 (로딩 중에는 스켈레톤 카드 표시) */}
            <div className="main-instagram-content" style={{ display: activeMainSocialTab === "instagram" ? undefined : "none", width: "100%", marginBottom: "auto", paddingTop: "clamp(1rem, 2.5vh, 1.8rem)" }}>
            {/* 인스타그램 카드 그리드 최대 폭 제어 컨테이너 */}
            <div className="main-social-wrap mx-auto md:w-full md:max-w-[1240px] md:px-6">
            <div className="main-social-grid grid grid-cols-2 place-items-center md:grid-cols-3">
              {isSocialLoading &&
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={`social-skeleton-${index}`} className={index >= 4 ? "hidden md:block" : undefined}>
                    <div className="main-social-card main-social-card-item block w-full">
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#ece9e4]">
                        <div className="social-skeleton-shimmer" />
                      </div>
                    </div>
                  </div>
                ))}
              {!isSocialLoading &&
                socialMediaItems.map((item, index) => {
                  // 카드 썸네일에 표시할 첫 번째 미디어 데이터
                  const previewMedia = getSocialPreviewMedia(item);
                  // 캐러셀 게시물은 슬라이드 수를 배지로 표시 (1이면 숨김)
                  const slideCount = getSocialMediaSlides(item).length;
                  // 비디오 여부 (VIDEO 타입이면 재생 아이콘 표시)
                  const isVideo = previewMedia?.media_type === "VIDEO";
                  // 카드 호버 시 오버레이에 표시할 텍스트 (caption 또는 label, 최대 150자)
                  const overlayText = getSocialOverlayText(item);

                  if (!previewMedia) {
                    return null;
                  }

                  return (
                    <div key={item.id} className={index >= 4 ? "hidden md:block" : undefined}>
                    <button
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
                    </div>
                  );
                })}
            </div>
            </div>
            </div>{/* 인스타그램 탭 콘텐츠 닫기 */}

            {/* 네이버 블로그 탭 콘텐츠: 최신 게시물 3개 목록 표시 (로딩 중에는 스켈레톤 표시) */}
            <div style={{ display: activeMainSocialTab === "naver" ? undefined : "none", width: "100%" }}>
              <div className="main-naver-blog-wrap mx-auto w-full max-w-[800px] px-3 md:px-6">
                {isNaverMainLoading ? (
                  /* 네이버 블로그 스켈레톤 로딩 카드 3개 */
                  <div className="main-naver-blog-list">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={`main-naver-skeleton-${i}`} className="main-naver-blog-row main-naver-blog-row--skeleton">
                        <div className="main-naver-blog-thumb main-naver-blog-thumb--skeleton" />
                        <div className="main-naver-blog-content">
                          <div className="main-naver-blog-skeleton-date" />
                          <div className="main-naver-blog-skeleton-title" />
                          <div className="main-naver-blog-skeleton-desc" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : naverPostsMain.length === 0 ? (
                  <div className="social-naver-empty"><p>네이버 블로그 게시글을 불러올 수 없습니다.</p></div>
                ) : (
                  <div className="main-naver-blog-list">
                    {naverPostsMain.slice(0, 3).map((post, index) => (
                      <a
                        key={`${post.link}-${index}`}
                        href={post.link || NAVER_BLOG_HOME}
                        target="_blank"
                        rel="noreferrer"
                        className="main-naver-blog-row group"
                        aria-label={post.title}
                      >
                        <div className="main-naver-blog-thumb">
                          {post.thumbnail ? (
                            <img src={post.thumbnail} alt={post.title} className="main-naver-blog-thumb-img" loading="lazy" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="main-naver-blog-thumb-fallback">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="main-naver-blog-thumb-icon">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="main-naver-blog-content">
                          <div className="main-naver-blog-date">{formatBlogDate(post.pubDate)}</div>
                          <h3 className="main-naver-blog-title group-hover:underline">{post.title}</h3>
                          <div className="main-naver-blog-desc-wrap">
                            {post.paragraphs.slice(0, 1).map((para, i) => (
                              <p key={i} className="main-naver-blog-desc">{para}</p>
                            ))}
                          </div>
                          <span className="main-naver-blog-more">자세히 보기 →</span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {/* 네이버 블로그 전체 목록 페이지로 이동하는 버튼 */}
              <div className="mt-6 flex justify-center">
                <Link
                  href="/social?tab=naver"
                  className="group relative overflow-hidden border border-[#111111] px-14 py-4 text-xs font-semibold tracking-[0.35em] text-[#111111] transition-colors duration-300 hover:text-white"
                >
                  <span className="absolute inset-0 -translate-y-full bg-[#111111] transition-transform duration-300 group-hover:translate-y-0" />
                  <span className="relative">블로그 전체보기</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 소셜 상세 팝업: 선택한 게시물의 미디어(이미지/영상)와 본문·날짜·링크를 표시하는 전체 화면 오버레이 */}
      {activeSocialMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6 py-10"
          onClick={handleCloseSocialMedia}
        >
          {/* 소셜 팝업 내부 컨테이너: 모바일에서는 세로 스크롤, 데스크탑에서는 좌(미디어)/우(본문) 2컬럼 */}
          <div
            className="relative w-full max-w-5xl overflow-y-auto bg-[#f7f2e5] shadow-[0_40px_90px_rgba(0,0,0,0.4)] max-h-[88vh] md:grid md:h-[80vh] md:max-h-[80vh] md:grid-cols-[1fr_1fr] md:overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            {/* 소셜 팝업: 모바일 전용 상단 프로필 이미지·계정명 + 닫기 버튼 바 */}
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
            {/* 소셜 팝업: 미디어 영역 (이미지/영상) - 스와이프/화살표로 캐러셀 이동 가능 */}
            <div
              className="relative aspect-[3/4] w-full overflow-hidden bg-black md:aspect-auto md:h-full"
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
            {/* 소셜 팝업: 우측 본문/날짜/인스타그램 링크 패널 (데스크탑에서만 우측에 분리 표시) */}
            <div className="flex max-h-none flex-col gap-4 overflow-auto px-4 pb-4 pt-4 text-[#6b7a8f] md:h-full md:gap-6 md:p-6">
              {/* 소셜 팝업: 데스크탑 전용 상단 프로필 이미지·계정명 + 닫기 버튼 바 */}
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
              {/* 게시물 본문 텍스트 (URL은 하이퍼링크로 자동 변환) */}
              <p className="text-sm leading-relaxed whitespace-pre-line md:text-base">
                {renderSocialBodyText(activeSocialMedia.caption ?? activeSocialMedia.label ?? "")}
              </p>
              {/* 게시물 날짜 및 인스타그램 원문 링크 버튼 */}
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

      {/* 연혁 + 오시는 길 섹션: 데스크탑에서 연혁 타임라인과 오시는 길을 함께 표시, 모바일에서는 연혁만 표시 */}
      <section
        id="history"
        ref={historySectionRef}
        className="relative h-[100svh] snap-start !py-0 text-[#000000] flex flex-col"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {/* 연혁 + 오시는 길 섹션 배경화면 */}
          <Image
            src="/images/main/main_last_1.webp"
            alt=""
            fill
            sizes="100vw"
            className="page-bg-image"
          />
        </div>
        <div className="relative z-[1] flex flex-col h-full">
        {/* 연혁 섹션 제목 */}
        <SectionTitle key={`history-title-${historyAnimationCycle}`} wrapClassName="main-history-enter-down" englishLabel="Company History">연혁</SectionTitle>
        {/* 연혁/오시는 길 본문 세로 정렬 래퍼 */}
        <div className="main-section-body-flex">
          {/* 데스크탑: 연혁 좌/우 타임라인 컬럼 + 오시는 길 지도·정보 */}
          <div className="main-history-wrap">
            <div className="mx-auto w-full max-w-[1120px] px-3 md:px-6" style={{ position: "relative", top: "clamp(-2rem, -3.5vh, -1.5rem)" }}>
              {/* 연혁 좌/우 2컬럼 그리드 */}
              <div className="mt-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: "clamp(0.5rem, 1.2vw, 1.2rem)", rowGap: "clamp(1.5rem, 2.8vh, 2rem)" }}>
                {/* 연혁 좌측 컬럼: 2016~2021 항목 순서대로 타임라인 진입 애니메이션 */}
                <div key={`history-left-${historyAnimationCycle}`} className="main-history-col-left" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                  <div className="main-history-col-line" style={{ ["--col-line-duration" as string]: `${(historyLeft.length * 0.44).toFixed(2)}s` }} />
                  {historyLeft.map((item, index) => {
                    const itemDelay = `${(index * 0.44).toFixed(2)}s`;
                    const hlineDelay = `${(index * 0.44 + 0.24).toFixed(2)}s`;
                    const contentDelay = `${(index * 0.44 + 0.60).toFixed(2)}s`;
                    return (
                      <div key={item.year} className="main-history-row-item main-history-timeline-item-anim" style={{ animationDelay: itemDelay }}>
                        <div className="grid grid-cols-[120px_1fr] items-start gap-5 md:grid-cols-[136px_1fr] main-history-row-content" style={{ animationDelay: contentDelay }}>
                          <p className="main-history-year">{item.year}</p>
                          <div className="space-y-2 pt-0.5 text-left">
                            {item.lines.map((line) => (
                              <p key={`${item.year}-${line}`} className="main-history-line">{line}</p>
                            ))}
                          </div>
                        </div>
                        <div className="main-history-row-dot" style={{ animationDelay: itemDelay }} />
                        <div className="main-history-row-hline" style={{ animationDelay: hlineDelay }} />
                      </div>
                    );
                  })}
                </div>

                {/* 연혁 우측 컬럼: 2022~2025 항목 순서대로 타임라인 진입 애니메이션 */}
                <div key={`history-right-${historyAnimationCycle}`} className="main-history-col-right" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                  <div className="main-history-col-line" style={{ ["--col-line-duration" as string]: `${(historyRight.length * historyRightInterval).toFixed(2)}s` }} />
                  {historyRight.map((item, index) => {
                    const itemDelay = `${(index * historyRightInterval).toFixed(2)}s`;
                    const hlineDelay = `${(index * historyRightInterval + 0.24).toFixed(2)}s`;
                    const contentDelay = `${(index * historyRightInterval + 0.60).toFixed(2)}s`;
                    return (
                      <div key={item.year} className="main-history-row-item main-history-timeline-item-anim" style={{ animationDelay: itemDelay }}>
                        <div className="grid grid-cols-[120px_1fr] items-start gap-5 md:grid-cols-[136px_1fr] main-history-row-content" style={{ animationDelay: contentDelay }}>
                          <p className="main-history-year">{item.year}</p>
                          <div className="space-y-2 pt-0.5 text-left">
                            {item.lines.map((line) => (
                              <p key={`${item.year}-${line}`} className="main-history-line">{line}</p>
                            ))}
                          </div>
                        </div>
                        <div className="main-history-row-dot" style={{ animationDelay: itemDelay }} />
                        <div className="main-history-row-hline" style={{ animationDelay: hlineDelay }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 오시는 길 블록: 지도 + 회사 정보 (데스크탑 전용, 하단 진입 애니메이션 적용) */}
            <div id="location" ref={desktopLocationBlockRef} className={locationEnterUpClass}>
              {/* 오시는 길 섹션 제목 */}
              <SectionTitle wrapClassName="main-location-title-wrap" englishLabel="Location & Access">오시는 길</SectionTitle>
              <div className="mx-auto mt-4 w-full max-w-[1120px] px-3 md:px-6">
                {/* 오시는 길: 좌(카카오 지도) + 우(회사 정보) 2컬럼 레이아웃 */}
                <div className="grid gap-3 md:grid-cols-[1fr_1fr] md:grid-rows-[1fr_auto] md:gap-x-8">
                  {/* 카카오 지도 렌더링 영역 (로딩/에러 상태에 따라 스피너 또는 오류 메시지 표시) */}
                  <div className="main-map-frame relative overflow-hidden border border-[#d2b79a] bg-[#f4efe8] md:col-start-1 md:row-start-1">
                    <div ref={desktopMapContainerRef} className="h-full w-full" />
                    {isMapReady && renderMapControls(false)}
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

                  {/* 회사 기본 정보(회사명/사업자/대표자/설립일/소재지) 목록 */}
                  <div className="flex items-center md:col-start-2 md:row-start-1">
                    <div className="main-location-info">
                      <div className="grid grid-cols-[26px_92px_1fr] items-center gap-4 md:grid-cols-[26px_100px_1fr]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="main-location-label shrink-0"><rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                        <p className="main-location-label">{renderJustifiedLabel("회사명")}</p>
                        <p className="main-location-value">(주) 더채움</p>
                      </div>
                      <div className="grid grid-cols-[26px_92px_1fr] items-center gap-4 md:grid-cols-[26px_100px_1fr]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="main-location-label shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                        <p className="main-location-label">{renderJustifiedLabel("사업자명")}</p>
                        <p className="main-location-value">875 - 87 - 02546</p>
                      </div>
                      <div className="grid grid-cols-[26px_92px_1fr] items-center gap-4 md:grid-cols-[26px_100px_1fr]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="main-location-label shrink-0"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <p className="main-location-label">{renderJustifiedLabel("대표자")}</p>
                        <p className="main-location-value">최희영</p>
                      </div>
                      <div className="grid grid-cols-[26px_92px_1fr] items-center gap-4 md:grid-cols-[26px_100px_1fr]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="main-location-label shrink-0"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <p className="main-location-label">{renderJustifiedLabel("설립일")}</p>
                        <p className="main-location-value">2016. 01. 20</p>
                      </div>
                      <div className="grid grid-cols-[26px_92px_1fr] items-start gap-4 md:grid-cols-[26px_100px_1fr]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="main-location-label shrink-0 mt-0.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <p className="main-location-label pt-0.5">{renderJustifiedLabel("소재지")}</p>
                        <p className="main-location-value">경기도 수원시 세류로 32 404호 (본사)</p>
                      </div>
                    </div>
                  </div>
                  {/* 외부 지도 앱(네이버/카카오) 링크 버튼 - 지도 아래 좌측에 배치 */}
                  <div className="flex justify-center gap-2 md:col-start-1 md:row-start-2 md:self-start">
                    <a
                      href={`https://map.naver.com/v5/search/${encodeURIComponent(HEAD_OFFICE_ADDRESS)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-[#cbbca8] px-4 py-2 text-sm text-[#3a3a3a] transition-colors hover:bg-[#f0f9f0]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#03C75A"/><text x="12.5" y="17.2" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff" fontFamily="Arial,sans-serif">N</text></svg>
                      네이버 지도
                    </a>
                    <a
                      href={`https://map.kakao.com/link/search/${encodeURIComponent(HEAD_OFFICE_ADDRESS)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-[#cbbca8] px-4 py-2 text-sm text-[#3a3a3a] transition-colors hover:bg-[#fffbe6]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#FEE500"/><path d="M12 4.5C7.86 4.5 4.5 7.19 4.5 10.5c0 2.08 1.3 3.92 3.28 5.02l-.84 3.07 3.58-2.35c.47.08.96.12 1.48.12 4.14 0 7.5-2.69 7.5-6s-3.36-5.86-7.5-5.86z" fill="#3B1E1E"/></svg>
                      카카오 지도
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 모바일 연혁: 연도 순 합산 항목을 지그재그(좌/우 교번)로 나열하는 타임라인 */}
          <div className="main-history-mobile-wrap">
            <div
              key={`mobile-history-timeline-${historyAnimationCycle}`}
              className="main-history-mobile-timeline"
              style={{
                ["--mobile-history-line-duration" as string]: `${(historyTimelineItems.length * 0.18 + 0.35).toFixed(2)}s`,
              }}
            >
              {historyTimelineItems.map((item, index) => {
                // 홀수 인덱스는 오른쪽 정렬로 배치해 좌우 교번 레이아웃 구성
                const isRight = index % 2 === 1;
                const mobileHistoryDelay = `${(index * 0.18 + 0.12).toFixed(2)}s`;

                return (
                  <div
                    key={`mobile-history-${item.year}`}
                    className={`main-history-mobile-timeline-row ${
                      isRight ? "main-history-mobile-timeline-row-right" : ""
                    }`}
                    style={{ ["--mobile-history-delay" as string]: mobileHistoryDelay }}
                  >
                    <span className="main-history-mobile-timeline-dot" aria-hidden="true" />
                    <article
                      className="main-history-mobile-entry main-history-mobile-entry-anim"
                    >
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
        </div>
      </section>

      {/* 모바일 오시는 길 전용 섹션: 모바일에서만 표시 (md 이상에서는 숨김), 지도·회사정보·외부지도 링크 포함 */}
      <section
        ref={mobileLocationSectionRef}
        className="main-location-mobile-section relative h-[100svh] snap-start !py-0 text-[#000000] flex flex-col md:hidden"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <Image
            src="/images/main/main_last_1.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-white/770" />
        </div>
        <div className="relative z-[1] flex flex-col h-full">
        {/* 모바일 오시는 길 섹션 제목 */}
        <SectionTitle wrapClassName={locationEnterUpClass} englishLabel="Location & Access">오시는 길</SectionTitle>
        <div className="main-section-body-flex">
          {/* 모바일 오시는 길 래퍼: 하단 진입 애니메이션 적용 */}
          <div className={`main-location-mobile-wrap ${locationEnterUpClass}`}>
            {/* 모바일 오시는 길 카드: 지도 + 외부지도 링크 + 회사 정보 목록 */}
            <div className="main-location-mobile-card">
              {/* 모바일 카카오 지도 렌더링 영역 */}
              <div className="main-map-frame relative overflow-hidden border border-[#d2b79a] bg-[#f4efe8]">
                <div ref={mobileMapContainerRef} className="h-full w-full" />
                {isMapReady && renderMapControls(true)}
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

              {/* 모바일: 외부 지도 앱(네이버/카카오) 링크 버튼 */}
              <div className="flex justify-center gap-2">
                <a
                  href={`https://map.naver.com/v5/search/${encodeURIComponent(HEAD_OFFICE_ADDRESS)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#cbbca8] px-3 py-2 text-sm text-[#3a3a3a] transition-colors hover:bg-[#f0f9f0]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#03C75A"/><text x="12.5" y="17.2" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff" fontFamily="Arial,sans-serif">N</text></svg>
                  네이버 지도
                </a>
                <a
                  href={`https://map.kakao.com/link/search/${encodeURIComponent(HEAD_OFFICE_ADDRESS)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#cbbca8] px-3 py-2 text-sm text-[#3a3a3a] transition-colors hover:bg-[#fffbe6]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#FEE500"/><path d="M12 4.5C7.86 4.5 4.5 7.19 4.5 10.5c0 2.08 1.3 3.92 3.28 5.02l-.84 3.07 3.58-2.35c.47.08.96.12 1.48.12 4.14 0 7.5-2.69 7.5-6s-3.36-5.86-7.5-5.86z" fill="#3B1E1E"/></svg>
                  카카오 지도
                </a>
              </div>

              {/* 모바일: 회사 기본 정보(회사명/사업자/대표자/설립일/소재지) 목록 */}
              <div className="main-location-info">
                <div className="grid grid-cols-[26px_80px_1fr] items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="main-location-label shrink-0"><rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  <p className="main-location-label">{renderJustifiedLabel("회사명")}</p>
                  <p className="main-location-value">(주) 더채움</p>
                </div>
                <div className="grid grid-cols-[26px_80px_1fr] items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="main-location-label shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                  <p className="main-location-label">{renderJustifiedLabel("사업자명")}</p>
                  <p className="main-location-value">875 - 87 - 02546</p>
                </div>
                <div className="grid grid-cols-[26px_80px_1fr] items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="main-location-label shrink-0"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <p className="main-location-label">{renderJustifiedLabel("대표자")}</p>
                  <p className="main-location-value">최희영</p>
                </div>
                <div className="grid grid-cols-[26px_80px_1fr] items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="main-location-label shrink-0"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <p className="main-location-label">{renderJustifiedLabel("설립일")}</p>
                  <p className="main-location-value">2016. 01. 20</p>
                </div>
                <div className="grid grid-cols-[26px_80px_1fr] items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="main-location-label shrink-0 mt-0.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <p className="main-location-label pt-0.5">{renderJustifiedLabel("소재지")}</p>
                  <p className="main-location-value">경기도 수원시 세류로 32 404호 (본사)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>
      {/* 페이지 최상단으로 스크롤하는 플로팅 버튼 */}
      <ScrollToTopButton targetId="main-landing-scroll" horizontal={isHistorySection} />
      <SiteFooter snap />
    </main>
  );
};

export default MainLanding;
