import "server-only";

import { cookies } from "next/headers";

// 관리자 권한 확인에 사용하는 쿠키 키
export const ADMIN_COOKIE_NAME = "thefull_admin";

// 로그인 사용자 식별에 사용하는 쿠키 키 후보
const SESSION_USER_COOKIE_KEYS = [
  "erp_user_id",
  "user_id",
  "login_user_id",
  "thefull_user_id",
  "thefull_user",
];

// 로그인 세션 식별에 사용하는 쿠키 키 후보
const SESSION_ID_COOKIE_KEYS = [
  "login_session_id",
  "thefull_session_id",
  "session_id",
];

// 문의관리 권한 판별에 사용하는 web_position 쿠키 키 후보
const SESSION_WEB_POSITION_COOKIE_KEYS = [
  "login_web_position",
  "web_position",
  "thefull_web_position",
];

// 문자열 입력값 공백 제거
const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");
// 문의관리 권한 코드는 대문자로 정규화
const normalizeWebPosition = (value: unknown) => normalizeText(value).toUpperCase();

// 문자열 환경값을 boolean 성격으로 변환
const isEnabled = (value: string | undefined) => {
  if (!value) {
    return false;
  }

// 공통 유틸: normalized 정의
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
};

// 로그인 세션 쿠키에서 user_id를 조회(없으면 빈 문자열)
export const getSessionUserId = async () => {
  const cookieStore = await cookies();
  for (const cookieKey of SESSION_USER_COOKIE_KEYS) {
    const userId = normalizeText(cookieStore.get(cookieKey)?.value);
    if (userId) {
      return userId;
    }
  }
  return "";
};

// 로그인 세션 쿠키에서 session_id를 조회(없으면 빈 문자열)
export const getSessionId = async () => {
  const cookieStore = await cookies();
  for (const cookieKey of SESSION_ID_COOKIE_KEYS) {
    const sessionId = normalizeText(cookieStore.get(cookieKey)?.value);
    if (sessionId) {
      return sessionId;
    }
  }
  return "";
};

// 로그인 세션 쿠키에서 web_position 권한 코드를 조회(없으면 빈 문자열)
export const getSessionWebPosition = async () => {
  const cookieStore = await cookies();
  for (const cookieKey of SESSION_WEB_POSITION_COOKIE_KEYS) {
    const webPosition = normalizeWebPosition(cookieStore.get(cookieKey)?.value);
    if (webPosition) {
      return webPosition;
    }
  }
  return "";
};

// ERP 로그인 세션 존재 여부는 user_id + session_id 쿠키 기준으로 판별
export const getErpSessionAccess = async () => {
  const [sessionUserId, sessionId] = await Promise.all([getSessionUserId(), getSessionId()]);
  return Boolean(sessionUserId && sessionId);
};

// 문의관리 접근 여부는 ERP 로그인 세션 + web_position(I/A) 기준으로 판별
export const getContactManageAccess = async () => {
  const [hasErpSession, webPosition] = await Promise.all([getErpSessionAccess(), getSessionWebPosition()]);
  return hasErpSession && (webPosition === "I" || webPosition === "A");
};

// 홍보 관리 접근 여부는 ERP 로그인 세션 + web_position(P/A) 기준으로 판별
export const getPromotionManageAccess = async () => {
  const [hasErpSession, webPosition] = await Promise.all([getErpSessionAccess(), getSessionWebPosition()]);
  return hasErpSession && (webPosition === "P" || webPosition === "A");
};

// 관리자 권한(쿠키/환경변수) 최종 판별
export const getAdminAccess = async () => {
// 공통 유틸: cookieStore 정의
  const cookieStore = await cookies();
// 공통 유틸: adminCookieEnabled 정의
  const adminCookieEnabled = cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";
// 공통 유틸: legacyPromotionCookieEnabled 정의
  const legacyPromotionCookieEnabled = cookieStore.get("promotion_admin")?.value === "1";

  // 개발 중 임시로 관리자 권한을 항상 열어두는 스위치
  const envEnabled =
    isEnabled(process.env.ADMIN_ALWAYS_ON) || isEnabled(process.env.NEXT_PUBLIC_PROMOTION_EDITOR);

  return adminCookieEnabled || legacyPromotionCookieEnabled || envEnabled;
};
