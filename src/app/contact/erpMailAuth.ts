import "server-only";

type InternalUserMailAuthPayload = {
  user_id?: unknown;
  password?: unknown;
};

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// ERP API 기본 주소를 환경변수 또는 웹훅 URL 기준으로 해석한다.
const getErpApiBaseUrl = () => {
  const configuredBaseUrl = normalizeText(process.env.ERP_API_BASE_URL);
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  const webhookUrl = normalizeText(process.env.ERP_INQUIRY_WEBHOOK_URL);
  if (webhookUrl) {
    try {
      return new URL(webhookUrl).origin.replace(/\/+$/, "");
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
    const endpoint = new URL("/Internal/User/MailAuth", `${erpApiBaseUrl}/`);
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
