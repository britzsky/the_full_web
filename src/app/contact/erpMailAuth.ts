import "server-only";

type ErpUserMailAuthPayload = {
  user_id?: unknown;
  password?: unknown;
};

export type ErpMailAuthDebug = {
  userId: string;
  webApiBaseUrl: string;
  status?: number;
  payloadPreview?: string;
  error?: string;
};

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// the_full_web_api를 통해 ERP 사용자 메일 계정 비밀번호를 조회한다.
export const resolveErpMailAuthPassword = async (
  userId: string,
  fallbackPassword = ""
): Promise<{ password: string; _debug: ErpMailAuthDebug }> => {
  const normalizedUserId = normalizeText(userId);
  const normalizedFallbackPassword = normalizeText(fallbackPassword);
  const webApiBaseUrl = normalizeText(process.env.WEB_API_BASE_URL);

  const baseDebug: ErpMailAuthDebug = { userId: normalizedUserId, webApiBaseUrl };

  if (!normalizedUserId) {
    return { password: normalizedFallbackPassword, _debug: { ...baseDebug, error: "userId empty" } };
  }

  if (!webApiBaseUrl) {
    return { password: normalizedFallbackPassword, _debug: { ...baseDebug, error: "WEB_API_BASE_URL not set" } };
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

    const rawText = await response.text();
    const debug: ErpMailAuthDebug = {
      ...baseDebug,
      status: response.status,
      payloadPreview: rawText.slice(0, 200),
    };

    if (!response.ok) {
      return { password: normalizedFallbackPassword, _debug: { ...debug, error: `HTTP ${response.status}` } };
    }

    let payload: ErpUserMailAuthPayload = {};
    try {
      payload = JSON.parse(rawText) as ErpUserMailAuthPayload;
    } catch {
      return { password: normalizedFallbackPassword, _debug: { ...debug, error: "JSON parse failed" } };
    }

    const responseUserId = normalizeText(payload.user_id);
    if (responseUserId && responseUserId !== normalizedUserId) {
      return { password: normalizedFallbackPassword, _debug: { ...debug, error: "user_id mismatch" } };
    }

    const password = normalizeText(payload.password) || normalizedFallbackPassword;
    return { password, _debug: debug };
  } catch (e) {
    return {
      password: normalizedFallbackPassword,
      _debug: { ...baseDebug, error: e instanceof Error ? e.message : String(e) },
    };
  }
};
