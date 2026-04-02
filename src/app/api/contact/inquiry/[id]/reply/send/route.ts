import { NextResponse } from "next/server";
import { getAdminAccess, getSessionUserId } from "@/app/lib/adminAccess";
import { isCkEditorContentMeaningful } from "@/app/contact/editorTextUtils";
import { getContactInquiryById } from "@/app/contact/inquiryStore";
import { sendContactReplyEmail } from "@/app/contact/replyEmailSender";

export const runtime = "nodejs";

// 문의 답변 메일 송부 API 요청 본문 타입
type ContactReplySendPayload = {
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

// 요청 헤더(Referer)에서 user_id 파라미터를 추출
const getUserIdFromReferer = (request: Request) => {
  const referer = normalizeText(request.headers.get("referer"));
  if (!referer) {
    return "";
  }

  try {
    const url = new URL(referer);
    return normalizeText(url.searchParams.get("erp_user_id")) || normalizeText(url.searchParams.get("user_id"));
  } catch {
    return "";
  }
};

// 문의 답변 작성 user_id를 세션/헤더/본문 순서로 결정
const resolveReplyUserId = async (request: Request, bodyUserId: unknown) => {
  const sessionUserId = await getSessionUserId();
  const headerUserId =
    normalizeText(request.headers.get("x-erp-user-id")) || normalizeText(request.headers.get("x-user-id"));
  const refererUserId = getUserIdFromReferer(request);
  const requestBodyUserId = normalizeText(bodyUserId);

  return sessionUserId || headerUserId || refererUserId || requestBodyUserId || "admin";
};

// 문의관리 상세: 답변 메일 송부 API(저장 로직과 분리)
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const canManage = await getAdminAccess();
  if (!canManage) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { id: idParam } = await context.params;
  const inquiryId = parseId(idParam);
  if (!inquiryId) {
    return NextResponse.json({ error: "문의 번호가 올바르지 않습니다." }, { status: 400 });
  }

  let body: Partial<ContactReplySendPayload>;
  try {
    body = (await request.json()) as Partial<ContactReplySendPayload>;
  } catch {
    return NextResponse.json({ error: "요청 본문(JSON) 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const content = normalizeText(body.content);
  if (!isCkEditorContentMeaningful(content)) {
    return NextResponse.json({ error: "답변 내용을 입력해 주세요." }, { status: 400 });
  }

  const inquiry = await getContactInquiryById(inquiryId);
  if (!inquiry) {
    return NextResponse.json({ error: "문의 정보를 찾을 수 없습니다." }, { status: 404 });
  }

  const resolvedUserId = await resolveReplyUserId(request, body.userId);

  try {
    const mailResult = await sendContactReplyEmail({
      toEmail: inquiry.email,
      inquiryId,
      inquiryTitle: inquiry.title,
      inquiryContent: inquiry.inquiryContent,
      businessName: inquiry.businessName,
      managerName: inquiry.managerName,
      replyContent: content,
      replyUserId: resolvedUserId,
    });

    return NextResponse.json({
      message: "이메일이 발송되었습니다.",
      emailSync: {
        sent: true,
        messageId: mailResult.messageId,
        accepted: (mailResult.accepted || []).map((item: unknown) => String(item)),
        rejected: (mailResult.rejected || []).map((item: unknown) => String(item)),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "이메일 송부 중 오류가 발생했습니다.",
        emailSync: {
          sent: false,
        },
      },
      { status: 500 }
    );
  }
}
