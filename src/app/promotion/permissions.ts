import { getPromotionManageAccess } from "@/app/lib/adminAccess";

// 홍보 화면: 데이터 조회 로직
export const getPromotionManagePermission = async () => {
  // 홍보 글쓰기/관리 노출 여부는 ERP 로그인 세션 + web_position(P/A) 기준으로 판별
  return getPromotionManageAccess();
};
