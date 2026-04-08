import { handleErpSessionBridge } from "@/app/lib/erpSessionBridge";

// ERP 문의관리/문의답변 이동 시 공개 웹 쿠키를 먼저 맞추는 브리지 라우트
export const POST = handleErpSessionBridge;
