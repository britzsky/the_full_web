import "server-only";

// the_full_web_api가 반환하는 ERP 사용자 메일 인증 응답 형태
type ErpUserMailAuthPayload = {
  user_id?: unknown;
  password?: unknown;
};

// 메일 인증 조회 디버그 정보 (문제 발생 시 원인 파악용)
export type ErpMailAuthDebug = {
  userId: string;
  webApiBaseUrl: string;
  status?: number;
  payloadPreview?: string;
  error?: string;
};

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// ERP 사용자의 SMTP 비밀번호를 the_full_web_api(Spring Boot)를 통해 조회
// - 조회 성공: the_full.tb_user.password 반환
// - 조회 실패: fallbackPassword(기본값 "") 반환
// - SMTP 설정 위치: the_full_web_api/src/main/resources/application-secret-*.properties
//   (contact.reply.smtp.host / port / secure / user-domain)
export const resolveErpMailAuthPassword = async (
  userId: string,
  // 조회 실패 시 사용할 대체 비밀번호 (기본값: 빈 문자열 → SMTP 인증 오류 처리됨)
  fallbackPassword = ""
): Promise<{ password: string; _debug: ErpMailAuthDebug }> => {
  // 공백 제거된 userId
  const normalizedUserId = normalizeText(userId);
  // 공백 제거된 대체 비밀번호
  const normalizedFallbackPassword = normalizeText(fallbackPassword);
  // the_full_web_api 베이스 URL (환경변수 WEB_API_BASE_URL)
  const webApiBaseUrl = normalizeText(process.env.WEB_API_BASE_URL);

  // 디버그 기본 정보 (오류 발생 시 원인 추적용)
  const baseDebug: ErpMailAuthDebug = { userId: normalizedUserId, webApiBaseUrl };

  // userId 없으면 조회 불가 → 대체 비밀번호 반환
  if (!normalizedUserId) {
    return { password: normalizedFallbackPassword, _debug: { ...baseDebug, error: "userId empty" } };
  }

  // WEB_API_BASE_URL 환경변수 미설정 시 조회 불가
  if (!webApiBaseUrl) {
    return { password: normalizedFallbackPassword, _debug: { ...baseDebug, error: "WEB_API_BASE_URL not set" } };
  }

  try {
    // the_full_web_api의 메일 인증 조회 엔드포인트
    const endpoint = new URL(`${webApiBaseUrl.replace(/\/+$/, "")}/contact/manage/user/mail-auth`);
    endpoint.searchParams.set("user_id", normalizedUserId);

    // 내부 API 시크릿 (ERP_INTERNAL_API_SECRET 환경변수)
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
      // 응답 앞 200자만 저장 (비밀번호 전체 노출 방지)
      payloadPreview: rawText.slice(0, 200),
    };

    // HTTP 오류 응답 시 대체 비밀번호 반환
    if (!response.ok) {
      return { password: normalizedFallbackPassword, _debug: { ...debug, error: `HTTP ${response.status}` } };
    }

    let payload: ErpUserMailAuthPayload = {};
    try {
      payload = JSON.parse(rawText) as ErpUserMailAuthPayload;
    } catch {
      return { password: normalizedFallbackPassword, _debug: { ...debug, error: "JSON parse failed" } };
    }

    // 응답의 user_id가 요청한 userId와 다르면 잘못된 응답으로 간주
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
