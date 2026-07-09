"use client";

// 인스타그램 API 응답의 사용자 정보 필드
type InstagramApiUser = {
  username?: string;
  profile_picture_url?: string;
};

// 인스타그램 API 응답 공통 형태
export type InstagramApiPayload<TItem = unknown> = {
  user?: InstagramApiUser;
  data?: TItem[];
  paging?: {
    cursors?: {
      after?: string;
    };
    next?: string;
  };
};

// 인스타그램 피드 조회
// HTTPS 환경에서 Mixed Content 차단을 방지하기 위해
// 브라우저가 백엔드를 직접 호출하지 않고 Next.js 프록시 라우트(/api/instagram)를 경유한다.
export const fetchInstagramFeed = async <TItem = unknown>(options?: { limit?: number; after?: string }) => {
  const params = new URLSearchParams();
  if (options?.limit) {
    params.set("limit", String(options.limit));
  }
  if (options?.after) {
    params.set("after", options.after);
  }

  const queryString = params.toString();
  const url = queryString ? `/instagram-proxy?${queryString}` : "/instagram-proxy";

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("인스타그램 피드를 불러오지 못했습니다.");
  }

  return (await response.json()) as InstagramApiPayload<TItem>;
};
