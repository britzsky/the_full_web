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

// 문자열 입력값 공백 제거
const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

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
