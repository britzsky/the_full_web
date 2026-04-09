// 운영 ERP IP 도메인
const PROD_ERP_HOST = "52.64.151.137";
// 운영 공개 웹 도메인
const PROD_PUBLIC_WEB_ORIGIN = "http://n.thefull.kr";

// 브라우저/서버 공용 문자열 정규화
const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// 공개 웹 주소 판별에 사용할 후보 URL을 순서대로 조회한다.
export const resolvePublicWebBaseUrlFromEnv = (...candidates: Array<string | undefined>) => {
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeText(candidate);
    if (!normalizedCandidate) {
      continue;
    }

    try {
      const parsedUrl = new URL(normalizedCandidate);

      // 운영 ERP IP가 잡힌 환경이면 공개 웹 도메인으로 연결한다.
      if (parsedUrl.hostname === PROD_ERP_HOST) {
        return PROD_PUBLIC_WEB_ORIGIN;
      }

      // 이미 공개 웹 도메인이면 그대로 사용한다.
      if (parsedUrl.hostname === "n.thefull.kr" || parsedUrl.hostname === "www.n.thefull.kr") {
        return PROD_PUBLIC_WEB_ORIGIN;
      }

      // 그 외에는 같은 호스트의 로컬 공개 웹 포트를 사용한다.
      return `${parsedUrl.protocol}//${parsedUrl.hostname}:8081`;
    } catch (error) {
      // URL 파싱에 실패한 값은 건너뛴다.
    }
  }

  return "http://localhost:8081";
};

// 브라우저에서 직접 호출할 web_api 주소를 정규화
const normalizePublicWebApiBaseUrl = (value: string) =>
  normalizeText(value)
    .replace(/\/+$/, "")
    .replace(/^(https?:\/\/(?:127\.0\.0\.1|localhost|52\.64\.151\.137|n\.thefull\.kr))$/iu, "$1:8090")
    .replace(/^(https?:\/\/(?:127\.0\.0\.1|localhost|52\.64\.151\.137|n\.thefull\.kr)):8081$/iu, "$1:8090")
    .replace(/^(https?:\/\/(?:127\.0\.0\.1|localhost)):3001$/iu, "$1:8090")
    .replace(/^(https?:\/\/(?:127\.0\.0\.1|localhost)):3000$/iu, "$1:8090");

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

// 브라우저에서 사용할 공개 API 상대 경로 정규화
const getBrowserApiPath = (path: string) => (path.startsWith("/") ? path : `/${path}`);

// 브라우저에서 직접 호출할 web_api 베이스 주소 계산
const getPublicWebApiBaseUrl = () => {
  const configuredBaseUrl = normalizePublicWebApiBaseUrl(process.env.NEXT_PUBLIC_BASE_URL ?? "");
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (typeof window !== "undefined") {
    return normalizePublicWebApiBaseUrl(window.location.origin);
  }

  return "";
};

// 클라이언트 공개 API 경로를 브라우저/절대주소 입력 규칙에 맞게 정규화
export const toPublicWebApiUrl = (path: string) => {
  const normalizedPath = normalizeText(path);
  if (!normalizedPath) {
    return "";
  }

  if (/^https?:\/\//iu.test(normalizedPath)) {
    return normalizedPath;
  }

  const apiPath = getBrowserApiPath(normalizedPath);
  const baseUrl = getPublicWebApiBaseUrl();
  return baseUrl ? `${baseUrl}${apiPath}` : apiPath;
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
