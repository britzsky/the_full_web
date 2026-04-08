import { NextResponse } from "next/server";
import { isCkEditorContentMeaningful } from "@/app/contact/editorTextUtils";
import { resolveErpMailAuthPassword } from "@/app/contact/erpMailAuth";
import {
  getContactInquiryById,
  markContactInquiryAnswered,
  resolveContactReplyMailRuntimeConfig,
} from "@/app/contact/inquiryStore";
import { sendContactReplyEmail } from "@/app/contact/replyEmailSender";
import { getContactManageAccess, getSessionUserId } from "@/app/lib/adminAccess";

export const runtime = "nodejs";

// 문의 답변 메일 송부 API 요청 본문 타입
type ContactReplySendPayload = {
  content: string;
  userId?: string;
  editorContentWidthPx?: number;
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

// 문의관리 상세 답변 메일 송부 API
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
  const resolvedSmtpPassword = await resolveErpMailAuthPassword(resolvedUserId);

  try {
    const smtpRuntimeConfig = await resolveContactReplyMailRuntimeConfig({
      userId: resolvedUserId,
    });
    const mailResult = await sendContactReplyEmail({
      toEmail: inquiry.email,
      inquiryId,
      inquiryTitle: inquiry.title,
      inquiryContent: inquiry.inquiryContent,
      businessName: inquiry.businessName,
      managerName: inquiry.managerName,
      replyContent: content,
      replyUserId: resolvedUserId,
      editorContentWidthPx: Number(body.editorContentWidthPx),
      smtpPassword: resolvedSmtpPassword,
      smtpHost: smtpRuntimeConfig.smtpHost,
      smtpPort: smtpRuntimeConfig.smtpPort,
      smtpSecure: smtpRuntimeConfig.smtpSecure,
      smtpAuthUser: smtpRuntimeConfig.smtpUser,
      mailFrom: smtpRuntimeConfig.mailFrom,
      mailReplyTo: smtpRuntimeConfig.mailReplyTo,
    });
    let answerSync: { completed: boolean; error?: string } = { completed: false };
    try {
      // 답변 메일 발송이 끝난 뒤에만 문의 답변여부를 완료 상태로 반영
      await markContactInquiryAnswered(inquiryId, resolvedUserId);
      answerSync = { completed: true };
    } catch (error) {
      console.error("[contact-manage-reply-send-answer-sync]", error);
      answerSync = {
        completed: false,
        error: error instanceof Error ? error.message : "답변 완료 상태 반영 중 오류가 발생했습니다.",
      };
    }

    return NextResponse.json({
      message: "이메일이 발송되었습니다.",
      emailSync: {
        sent: true,
        messageId: mailResult.messageId,
        accepted: (mailResult.accepted || []).map((item: unknown) => String(item)),
        rejected: (mailResult.rejected || []).map((item: unknown) => String(item)),
      },
      answerSync,
    });
  } catch (error) {
    console.error("[contact-manage-reply-send]", error);
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
