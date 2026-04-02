// 문의관리 API 경로 분리:
// /api/contact/inquiry_management/{id}/reply/send 는 기존 답변 메일 송부 핸들러를 재사용합니다.
export { POST } from "@/app/api/contact/inquiry/[id]/reply/send/route";
