"use client";

// 브라우저에서 사용할 공개 API 베이스 주소 정규화
const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// 공개 API 공통 에러 페이로드 모델
type PublicApiErrorPayload = {
  error?: string;
};

// 공개 API 응답 래퍼 모델
export type PublicApiResponse<T> = {
  ok: boolean;
  status: number;
  payload: T | PublicApiErrorPayload;
};

// 브라우저 현재 호스트를 기준으로 web_api 8090 주소 생성
const getRuntimeWebApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return "http://127.0.0.1:8090";
  }

  const protocol = /^https?:$/iu.test(window.location.protocol) ? window.location.protocol : "http:";
  const hostname = normalizeText(window.location.hostname) || "127.0.0.1";
  return `${protocol}//${hostname}:8090`;
};

// 브라우저 번들에서 읽을 공개 API 주소 반환
export const getPublicWebApiBaseUrl = () => {
  const raw = normalizeText(process.env.NEXT_PUBLIC_WEB_API_BASE_URL);

  const baseUrl = raw || getRuntimeWebApiBaseUrl();
  return baseUrl.replace(/\/+$/, "");
};

// 상대 API 경로를 공개 API 절대 주소로 변환
export const toPublicWebApiUrl = (path: string) => {
  const normalizedPath = normalizeText(path);
  if (!normalizedPath) {
    return "";
  }

  if (/^https?:\/\//iu.test(normalizedPath)) {
    return normalizedPath;
  }

  const baseUrl = getPublicWebApiBaseUrl();
  return `${baseUrl}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
};

// 공개 API 요청 헤더를 브라우저 fetch 규칙에 맞게 구성
const buildPublicApiHeaders = (init?: RequestInit) => {
  const headers = new Headers(init?.headers ?? undefined);
  const method = normalizeText(init?.method).toUpperCase();
  const hasBody = init?.body !== undefined && init?.body !== null;

  if (!headers.has("Content-Type") && hasBody && method !== "GET" && method !== "HEAD") {
    headers.set("Content-Type", "application/json");
  }

  return headers;
};

// 클라이언트에서 공개 API JSON 응답을 공통 형태로 조회
export const requestPublicWebApi = async <T>(path: string, init?: RequestInit): Promise<PublicApiResponse<T>> => {
  const response = await fetch(toPublicWebApiUrl(path), {
    ...init,
    cache: "no-store",
    headers: buildPublicApiHeaders(init),
  });

  const payload = (await response.json().catch(() => ({}))) as T | PublicApiErrorPayload;

  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
};

// 공개 API 에러 메시지를 공통 규칙으로 추출
export const getPublicApiErrorMessage = (payload: unknown, fallbackMessage: string) => {
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const message = normalizeText((payload as PublicApiErrorPayload).error);
    if (message) {
      return message;
    }
  }

  return fallbackMessage;
};
