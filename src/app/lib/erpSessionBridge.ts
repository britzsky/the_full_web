import { NextRequest, NextResponse } from "next/server";
import { resolvePublicWebBaseUrlFromEnv } from "@/app/lib/publicWebApi";

// ERP와 공개 웹이 함께 읽는 사용자 식별 쿠키 키 목록
const SHARED_USER_COOKIE_KEYS = ["erp_user_id", "login_user_id", "user_id", "thefull_user_id"];
// ERP와 공개 웹이 함께 읽는 세션 식별 쿠키 키 목록
const SHARED_SESSION_COOKIE_KEYS = ["login_session_id"];
// ERP와 공개 웹이 함께 읽는 권한 코드 쿠키 키 목록
const SHARED_WEB_POSITION_COOKIE_KEYS = ["login_web_position", "web_position", "thefull_web_position"];
// 기존 화면 호환을 위해 함께 맞춰 두는 관리자 쿠키 키 목록
const SHARED_ADMIN_COOKIE_KEYS = ["thefull_admin", "promotion_admin"];

// 문자열 입력값 공백 제거
const normalizeText = (value: FormDataEntryValue | null) => (typeof value === "string" ? value.trim() : "");
// 권한 코드는 대문자로 정규화
const normalizeWebPosition = (value: FormDataEntryValue | null) => normalizeText(value).toUpperCase();

// 외부 주소로 빠지지 않게 공개 웹 내부 경로만 허용
const normalizeRedirectPath = (value: FormDataEntryValue | null) => {
  const normalized = normalizeText(value);

  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return "/";
  }

  return normalized;
};

// 기존 ERP 관리자 판별 기준을 공개 웹 브리지에서도 그대로 사용
const isSharedAdminUser = (position: string, department: string) =>
  position === "0" || position === "1" || department === "6";

// ERP에서 넘어온 세션 정보를 현재 공개 웹 도메인 쿠키로 저장하고 목적 화면으로 이동시킨다.
export async function handleErpSessionBridge(request: NextRequest) {
  const formData = await request.formData();
  const userId = normalizeText(formData.get("user_id"));
  const sessionId = normalizeText(formData.get("session_id"));
  const webPosition = normalizeWebPosition(formData.get("web_position")) || "N";
  const position = normalizeText(formData.get("position"));
  const department = normalizeText(formData.get("department"));
  const redirectPath = normalizeRedirectPath(formData.get("redirect_path"));
  const publicWebOrigin = resolvePublicWebBaseUrlFromEnv(
    process.env.THE_FULL_WEB_BASE_URL,
    process.env.NEXT_PUBLIC_THE_FULL_WEB_BASE_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.NEXTAUTH_URL,
    process.env.WEB_API_BASE_URL,
    process.env.ERP_INQUIRY_WEBHOOK_URL
  );

  const response = NextResponse.redirect(new URL(redirectPath, `${publicWebOrigin}/`), { status: 303 });

  if (!userId || !sessionId) {
    return response;
  }

  SHARED_USER_COOKIE_KEYS.forEach((cookieKey) => {
    response.cookies.set(cookieKey, userId, {
      path: "/",
      sameSite: "lax",
    });
  });

  SHARED_SESSION_COOKIE_KEYS.forEach((cookieKey) => {
    response.cookies.set(cookieKey, sessionId, {
      path: "/",
      sameSite: "lax",
    });
  });

  SHARED_WEB_POSITION_COOKIE_KEYS.forEach((cookieKey) => {
    response.cookies.set(cookieKey, webPosition, {
      path: "/",
      sameSite: "lax",
    });
  });

  if (isSharedAdminUser(position, department)) {
    SHARED_ADMIN_COOKIE_KEYS.forEach((cookieKey) => {
      response.cookies.set(cookieKey, "1", {
        path: "/",
        sameSite: "lax",
      });
    });
  } else {
    SHARED_ADMIN_COOKIE_KEYS.forEach((cookieKey) => {
      response.cookies.set(cookieKey, "", {
        path: "/",
        sameSite: "lax",
        maxAge: 0,
      });
    });
  }

  return response;
}
