import "server-only";

type ErpUserMailAuthPayload = {
  user_id?: unknown;
  password?: unknown;
};

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// the_full_web_api를 통해 ERP 사용자 메일 계정 비밀번호를 조회한다.
export const resolveErpMailAuthPassword = async (userId: string, fallbackPassword = "") => {
  const normalizedUserId = normalizeText(userId);
  const normalizedFallbackPassword = normalizeText(fallbackPassword);
  if (!normalizedUserId) {
    return normalizedFallbackPassword;
  }

  const webApiBaseUrl = normalizeText(process.env.WEB_API_BASE_URL);
  if (!webApiBaseUrl) {
    return normalizedFallbackPassword;
  }

  try {
    const endpoint = new URL(`${webApiBaseUrl.replace(/\/+$/, "")}/contact/manage/user/mail-auth`);
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

    const payload = (await response.json()) as ErpUserMailAuthPayload;
    const responseUserId = normalizeText(payload.user_id);
    if (responseUserId && responseUserId !== normalizedUserId) {
      return normalizedFallbackPassword;
    }

    return normalizeText(payload.password) || normalizedFallbackPassword;
  } catch {
    return normalizedFallbackPassword;
  }
};
