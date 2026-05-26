import "server-only";

type InternalUserMailAuthPayload = {
  user_id?: unknown;
  password?: unknown;
};

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// ERP API 기본 주소를 환경변수 또는 웹훅 URL 기준으로 해석한다.
// 웹훅 URL에 nginx 라우팅 경로(/ERP 등)가 포함된 경우 이를 ERP_API_BASE_URL에 추가한다.
// (운영 환경에서 포트 8080이 nginx일 때 /ERP/ 하위 경로만 Spring Boot로 프록시되므로)
const getErpApiBaseUrl = () => {
  const configuredBaseUrl = normalizeText(process.env.ERP_API_BASE_URL);
  const webhookUrl = normalizeText(process.env.ERP_INQUIRY_WEBHOOK_URL);

  // 웹훅 URL에서 nginx 프록시 경로 세그먼트 추출 (예: /ERP/ContactInquiryWebhook → /ERP)
  let contextPath = "";
  if (webhookUrl) {
    try {
      const segments = new URL(webhookUrl).pathname.split("/").filter(Boolean);
      contextPath = segments.length > 1 ? `/${segments[0]}` : "";
    } catch {
      // ignore
    }
  }

  if (configuredBaseUrl) {
    // ERP_API_BASE_URL이 설정된 경우 웹훅 경로 세그먼트를 추가
    // 로컬: ERP_INQUIRY_WEBHOOK_URL 미설정 → contextPath="" → "http://localhost:8080"
    // 운영: webhookUrl에 /ERP 포함 → contextPath="/ERP" → "http://localhost:8080/ERP"
    return configuredBaseUrl.replace(/\/+$/, "") + contextPath;
  }

  if (webhookUrl) {
    try {
      const parsed = new URL(webhookUrl);
      return `http://localhost${parsed.port ? `:${parsed.port}` : ""}${contextPath}`;
    } catch {
      return webhookUrl.replace(/\/+$/, "");
    }
  }

  return "";
};

// ERP 내부 API로 user_id 기준 조회
export const resolveErpMailAuthPassword = async (userId: string, fallbackPassword = "") => {
  const normalizedUserId = normalizeText(userId);
  const normalizedFallbackPassword = normalizeText(fallbackPassword);
  if (!normalizedUserId) {
    return normalizedFallbackPassword;
  }

  const erpApiBaseUrl = getErpApiBaseUrl();
  if (!erpApiBaseUrl) {
    return normalizedFallbackPassword;
  }

  try {
    // new URL(path, base) 는 절대 경로(/로 시작)일 때 base의 경로를 무시하므로 문자열 직접 결합
    const endpointUrl = `${erpApiBaseUrl}/Internal/User/MailAuth`;
    const endpoint = new URL(endpointUrl);
    endpoint.searchParams.set("user_id", normalizedUserId);

    const internalApiSecret = normalizeText(process.env.ERP_INTERNAL_API_SECRET);
    const headers: HeadersInit = {};
    if (internalApiSecret) {
      headers["X-THEFULL-INTERNAL-SECRET"] = internalApiSecret;
    }

    const response = await fetch(endpoint.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      return normalizedFallbackPassword;
    }

    const payload = (await response.json()) as InternalUserMailAuthPayload;
    const responseUserId = normalizeText(payload.user_id);
    if (responseUserId && responseUserId !== normalizedUserId) {
      return normalizedFallbackPassword;
    }

    return normalizeText(payload.password) || normalizedFallbackPassword;
  } catch {
    return normalizedFallbackPassword;
  }
};
