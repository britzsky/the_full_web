// 문의관리 API 경로 분리:
// /api/contact/inquiry_management/{id}/reply 는 기존 답변 저장 핸들러를 재사용합니다.
export { GET, POST } from "@/app/api/contact/inquiry/[id]/reply/route";
