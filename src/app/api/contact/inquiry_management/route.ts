import { NextResponse } from "next/server";
import { getAdminAccess } from "@/app/lib/adminAccess";
import { listContactInquiry } from "@/app/contact/inquiryStore";

// 문의관리 API: 문의 목록 조회
export async function GET() {
  const canManage = await getAdminAccess();
  if (!canManage) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const inquiry = await listContactInquiry();
    return NextResponse.json({ inquiry });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "문의 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
