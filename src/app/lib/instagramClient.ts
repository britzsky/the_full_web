"use client";

import { requestPublicWebApi } from "@/app/lib/publicWebApi";

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

// 브라우저에서 the_full_web_api 인스타그램 공개 API 호출
export const fetchInstagramFeed = async <TItem = unknown>(options?: { limit?: number; after?: string }) => {
  const params = new URLSearchParams();
  if (options?.limit) {
    params.set("limit", String(options.limit));
  }
  if (options?.after) {
    params.set("after", options.after);
  }

  const queryString = params.toString();
  const response = await requestPublicWebApi<InstagramApiPayload<TItem>>(
    queryString ? `/instagram?${queryString}` : "/instagram"
  );
  if (!response.ok) {
    throw new Error("Instagram API request failed.");
  }

  return response.payload as InstagramApiPayload<TItem>;
};
