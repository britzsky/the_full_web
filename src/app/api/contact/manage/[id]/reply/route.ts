import { NextResponse } from "next/server";
import { isCkEditorContentMeaningful } from "@/app/contact/editorTextUtils";
import {
  getContactInquiryReplyByInquiryId,
  upsertContactInquiryReply,
} from "@/app/contact/inquiryStore";
import { getContactManageAccess, getSessionUserId } from "@/app/lib/adminAccess";

export const runtime = "nodejs";

// 문의 답변 API 요청 본문 타입
type ContactReplyPayload = {
  content: string;
  userId?: string;
};

// 동적 라우트 id 문자열을 양의 정수로 변환
const parseId = (value: string) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// 문자열 입력값 공백 제거
const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// 문의 답변 작성 user_id를 세션/헤더/본문 순서로 결정
const resolveReplyUserId = async (request: Request, bodyUserId: unknown) => {
  const sessionUserId = await getSessionUserId();
  const headerUserId =
    normalizeText(request.headers.get("x-erp-user-id")) || normalizeText(request.headers.get("x-user-id"));
  const requestBodyUserId = normalizeText(bodyUserId);

  return sessionUserId || headerUserId || requestBodyUserId || "admin";
};

// 문의관리 상세 답변 조회 API
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
    const reply = await getContactInquiryReplyByInquiryId(inquiryId);
    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "답변 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 문의관리 상세 답변 저장/수정 API
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const canManage = await getContactManageAccess();
  if (!canManage) {
    return NextResponse.json({ error: "로그인 세션이 필요합니다." }, { status: 403 });
  }

  const { id: idParam } = await context.params;
  const inquiryId = parseId(idParam);
  if (!inquiryId) {
    return NextResponse.json({ error: "문의 번호가 올바르지 않습니다." }, { status: 400 });
  }

  let body: Partial<ContactReplyPayload>;
  try {
    body = (await request.json()) as Partial<ContactReplyPayload>;
  } catch {
    return NextResponse.json({ error: "요청 본문(JSON) 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const content = normalizeText(body.content);
  if (!isCkEditorContentMeaningful(content)) {
    return NextResponse.json({ error: "답변 내용을 입력해 주세요." }, { status: 400 });
  }

  try {
    const resolvedUserId = await resolveReplyUserId(request, body.userId);
    const reply = await upsertContactInquiryReply(inquiryId, {
      content,
      userId: resolvedUserId,
    });

    return NextResponse.json({
      message: "답변이 저장되었습니다.",
      reply,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "답변 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
