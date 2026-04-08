import { NextResponse } from "next/server";
import { deleteContactInquiry, getContactInquiryById } from "@/app/contact/inquiryStore";
import { getContactManageAccess, getSessionUserId } from "@/app/lib/adminAccess";

// 동적 라우트 id 문자열을 양의 정수로 변환
const parseId = (value: string) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// 문자열 입력값 공백 제거
const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// 문의관리 상세 조회 API
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const canManage = await getContactManageAccess();
  if (!canManage) {
    return NextResponse.json({ error: "로그인 세션이 필요합니다." }, { status: 403 });
  }

  const { id: idParam } = await context.params;
  const inquiryId = parseId(idParam);
  if (!inquiryId) {
    return NextResponse.json({ error: "문의 번호가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const inquiry = await getContactInquiryById(inquiryId);
    if (!inquiry) {
      return NextResponse.json({ error: "문의 내역을 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ inquiry });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "문의 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 문의관리 상세 삭제 API
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const canManage = await getContactManageAccess();
  if (!canManage) {
    return NextResponse.json({ error: "로그인 세션이 필요합니다." }, { status: 403 });
  }

  const { id: idParam } = await context.params;
  const inquiryId = parseId(idParam);
  if (!inquiryId) {
    return NextResponse.json({ error: "문의 번호가 올바르지 않습니다." }, { status: 400 });
  }

  let deletedBy = "admin";
  try {
    const body = (await request.json().catch(() => ({}))) as { deletedBy?: string };
    const sessionUserId = await getSessionUserId();
    deletedBy = sessionUserId || normalizeText(body.deletedBy) || "admin";
  } catch {
    const sessionUserId = await getSessionUserId();
    deletedBy = sessionUserId || "admin";
  }

  try {
    const deleted = await deleteContactInquiry(inquiryId, deletedBy);
    if (!deleted) {
      return NextResponse.json({ error: "문의 내역을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ message: "문의가 삭제되었습니다." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "문의 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
