import "server-only";

import type {
  PromotionPost,
  PromotionPostInput,
  PromotionPostSummary,
  PromotionPostUpdate,
  PromotionSearchField,
} from "./types";

// the_full_web_api 홍보 게시글 응답 모델
type PromotionApiPost = {
  id?: number | string;
  title?: string;
  content?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
};

// 백엔드 공통 에러 페이로드 모델
type ApiErrorPayload = {
  error?: string;
};

// API 응답 래퍼 모델
type ApiResponse<T> = {
  ok: boolean;
  status: number;
  payload: T | ApiErrorPayload;
};

// 문자열 입력값 공백 정리
const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// 숫자형 id 파싱(양의 정수만 허용)
const toPositiveInt = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

// 배열 응답 안전 변환
const toArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

// 홍보 검색 구분값 정규화
const toSearchField = (value: unknown): PromotionSearchField => {
  const normalized = normalizeText(value);
  if (normalized === "content" || normalized === "all") {
    return normalized;
  }
  return "title";
};

// the_full_web_api 베이스 URL(미설정 시 로컬 기본값 사용)
const getApiBaseUrl = () => {
  const raw = normalizeText(process.env.THE_FULL_WEB_API_BASE_URL ?? process.env.WEB_API_BASE_URL);
  // 8090 변경시: .env.local과 함께 이 fallback 포트도 8090으로 변경
  const baseUrl = raw || "http://127.0.0.1:8081";
  return baseUrl.replace(/\/+$/, "");
};

// API 에러 메시지 추출 유틸
const getApiErrorMessage = (payload: unknown, fallbackMessage: string) => {
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const message = normalizeText((payload as ApiErrorPayload).error);
    if (message) {
      return message;
    }
  }
  return fallbackMessage;
};

// the_full_web_api 호출 공통 유틸
const requestWebApi = async <T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> => {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as T | ApiErrorPayload;
  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
};

// 목록용 게시글 요약 변환
const toSummary = (row?: PromotionApiPost): PromotionPostSummary | null => {
  if (!row) {
    return null;
  }

  const id = toPositiveInt(row.id);
  if (!id) {
    return null;
  }

  return {
    id,
    title: normalizeText(row.title),
    author: normalizeText(row.author) || "더채움",
    createdAt: normalizeText(row.createdAt),
  };
};

// 상세용 게시글 변환
const toPost = (row?: PromotionApiPost): PromotionPost | null => {
  const summary = toSummary(row);
  if (!summary || !row) {
    return null;
  }

  const updatedAt = normalizeText(row.updatedAt);

  return {
    ...summary,
    content: normalizeText(row.content),
    updatedAt: updatedAt || summary.createdAt,
  };
};

// 홍보 목록 조회 API 호출
export const listPromotionPosts = async (options?: {
  query?: string;
  field?: PromotionSearchField;
}) => {
  const query = normalizeText(options?.query);
  const field = toSearchField(options?.field);
  const searchParams = new URLSearchParams();

  if (query) {
    searchParams.set("q", query);
  }
  if (field) {
    searchParams.set("field", field);
  }

  const queryString = searchParams.toString();
  const path = queryString ? `/api/promotion/posts?${queryString}` : "/api/promotion/posts";
  const response = await requestWebApi<{ posts?: PromotionApiPost[] }>(path);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(response.payload, "게시글 목록 조회 중 오류가 발생했습니다."));
  }

  return toArray<PromotionApiPost>((response.payload as { posts?: PromotionApiPost[] }).posts)
    .map((post) => toSummary(post))
    .filter((post): post is PromotionPostSummary => Boolean(post));
};

// 홍보 상세 조회 API 호출
export const getPromotionPostById = async (id: number) => {
  const postId = toPositiveInt(id);
  if (!postId) {
    return null;
  }

  const response = await requestWebApi<{ post?: PromotionApiPost }>(`/api/promotion/posts/${postId}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(getApiErrorMessage(response.payload, "게시글 조회 중 오류가 발생했습니다."));
  }

  return toPost((response.payload as { post?: PromotionApiPost }).post);
};

// 상세 하단 이전글/다음글 조회 API 호출
export const getPromotionAdjacentPosts = async (id: number) => {
  const postId = toPositiveInt(id);
  if (!postId) {
    return { previous: null, next: null };
  }

  const response = await requestWebApi<{ adjacent?: { previous?: PromotionApiPost | null; next?: PromotionApiPost | null } }>(
    `/api/promotion/posts/${postId}/adjacent`
  );

  if (response.status === 404) {
    return { previous: null, next: null };
  }
  if (!response.ok) {
    throw new Error(getApiErrorMessage(response.payload, "인접 게시글 조회 중 오류가 발생했습니다."));
  }

  const adjacent = (response.payload as {
    adjacent?: { previous?: PromotionApiPost | null; next?: PromotionApiPost | null };
  }).adjacent;

  return {
    previous: toSummary(adjacent?.previous ?? undefined),
    next: toSummary(adjacent?.next ?? undefined),
  };
};

// 홍보 게시글 등록 API 호출
export const createPromotionPost = async (input: PromotionPostInput) => {
  const title = normalizeText(input.title);
  const content = normalizeText(input.content);
  const author = normalizeText(input.author) || "더채움";

  if (!title || !content) {
    throw new Error("제목과 내용을 입력해 주세요.");
  }

  const response = await requestWebApi<{ post?: PromotionApiPost }>("/api/promotion/posts", {
    method: "POST",
    body: JSON.stringify({
      title,
      content,
      author,
    }),
  });

  if (!response.ok) {
    throw new Error(getApiErrorMessage(response.payload, "게시글 등록 중 오류가 발생했습니다."));
  }

  const created = toPost((response.payload as { post?: PromotionApiPost }).post);
  if (!created) {
    throw new Error("등록된 게시글 조회에 실패했습니다.");
  }

  return created;
};

// 홍보 게시글 수정 API 호출
export const updatePromotionPost = async (id: number, input: PromotionPostUpdate) => {
  const postId = toPositiveInt(id);
  if (!postId) {
    return null;
  }

  const payload: PromotionPostUpdate = {};
  if (input.title !== undefined) {
    payload.title = normalizeText(input.title);
  }
  if (input.content !== undefined) {
    payload.content = normalizeText(input.content);
  }
  if (input.author !== undefined) {
    payload.author = normalizeText(input.author);
  }

  const response = await requestWebApi<{ post?: PromotionApiPost }>(`/api/promotion/posts/${postId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(getApiErrorMessage(response.payload, "게시글 수정 중 오류가 발생했습니다."));
  }

  return toPost((response.payload as { post?: PromotionApiPost }).post);
};

// 홍보 게시글 소프트삭제 API 호출
export const deletePromotionPost = async (id: number) => {
  const postId = toPositiveInt(id);
  if (!postId) {
    return false;
  }

  const response = await requestWebApi<{ message?: string }>(`/api/promotion/posts/${postId}`, {
    method: "DELETE",
  });

  if (response.status === 404) {
    return false;
  }
  if (!response.ok) {
    throw new Error(getApiErrorMessage(response.payload, "게시글 삭제 중 오류가 발생했습니다."));
  }

  return true;
};
