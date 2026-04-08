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
};

// 브라우저에서 the_full_web_api 인스타그램 공개 API 호출
export const fetchInstagramFeed = async <TItem = unknown>() => {
  const response = await requestPublicWebApi<TItem[]>("/instagram");
  if (!response.ok) {
    throw new Error("Instagram API request failed.");
  }

  return response.payload as InstagramApiPayload<TItem>;
};
