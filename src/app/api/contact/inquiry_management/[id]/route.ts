// 문의관리 API 경로 분리:
// /api/contact/inquiry_management/{id} 는 기존 삭제 핸들러를 재사용합니다.
export { GET, DELETE } from "@/app/api/contact/inquiry/[id]/route";
