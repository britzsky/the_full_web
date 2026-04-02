import { cookies } from "next/headers";

// 홍보 화면: 데이터 조회 로직
export const getPromotionManagePermission = async () => {
// 홍보 화면: cookieStore 정의
  const cookieStore = await cookies();
// 홍보 화면: cookieEnabled 정의
  const cookieEnabled =
    cookieStore.get("promotion_admin")?.value === "1" || cookieStore.get("thefull_admin")?.value === "1";

  // TODO: 추후 로그인 세션 권한 검사로 교체
  const envEnabled = (process.env.NEXT_PUBLIC_PROMOTION_EDITOR ?? "true") === "true";
  return cookieEnabled || envEnabled;
};
