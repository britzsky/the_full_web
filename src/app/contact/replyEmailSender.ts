import "server-only";

import * as nodemailer from "nodemailer";
import type { SendMailOptions } from "nodemailer";
import { toCkEditorDataFromStoredContent, toPlainTextFromCkEditor } from "./editorTextUtils";

// 고객문의 답변 메일 발송/미리보기 입력 모델
export type SendContactReplyEmailInput = {
  toEmail: string;
  inquiryId: number;
  inquiryTitle?: string;
  inquiryContent?: string;
  businessName?: string;
  managerName?: string;
  replyContent: string;
  replyUserId: string;
};

type InlineImageAttachment = NonNullable<SendMailOptions["attachments"]>[number];

// 문자열 입력 공백 정규화 유틸
const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// SMTP 계정 정보 env에서 로드
const SMTP_AUTH_USER = normalizeText(process.env.CONTACT_REPLY_SMTP_USER);
const SMTP_AUTH_PASS = normalizeText(process.env.CONTACT_REPLY_SMTP_PASSWORD);

// SMTP 전송 설정(지오유 메일 서버)
const SMTP_CONFIG = {
  host: "smtp.zioyou.com",
  port: 465,
  secure: true,
  auth: {
    user: SMTP_AUTH_USER,
    pass: SMTP_AUTH_PASS,
  },
};

// 메일 발신자/회신주소 기본값
const MAIL_FROM = normalizeText(process.env.CONTACT_REPLY_MAIL_FROM) || `"더채움" <${SMTP_AUTH_USER}>`;
const MAIL_REPLY_TO = normalizeText(process.env.CONTACT_REPLY_MAIL_REPLY_TO) || SMTP_AUTH_USER;
// 메일 본문 로고 URL 설정(첨부 없이 PNG URL로만 렌더)
const MAIL_LOGO_URL = normalizeText(process.env.CONTACT_REPLY_LOGO_URL);
const MAIL_LOGO_PUBLIC_PATH = "/images/logo/thefull_logo.png";
// 메일/미리보기 공통 로고 렌더 높이(px)
const MAIL_LOGO_HEIGHT_PX = 70;
// 메일/미리보기 공통 로고 인라인 스타일
const MAIL_LOGO_INLINE_STYLE = `display:block;height:${MAIL_LOGO_HEIGHT_PX}px;width:auto;`;
const MAIL_BASE_URL = normalizeText(
  process.env.NEXT_PUBLIC_THE_FULL_WEB_BASE_URL || process.env.THE_FULL_WEB_BASE_URL || process.env.NEXTAUTH_URL
).replace(/\/+$/g, "");
const MAIL_LOGO_FALLBACK_PUBLIC_URL = MAIL_BASE_URL ? `${MAIL_BASE_URL}${MAIL_LOGO_PUBLIC_PATH}` : "";
type ContactReplyLogoRenderMode = "email" | "preview";

// 메일 발신/수신 메타 정보 모델
type ContactReplyEnvelope = {
  from: string;
  to: string;
  replyTo: string;
};

// 이메일/미리보기에서 Pretendard 계열을 우선 사용하기 위한 public 폰트 CSS 경로
const PRETENDARD_VARIABLE_CSS_PATH = "/fonts/pretendardvariable.css";
const PRETENDARD_STATIC_CSS_PATH = "/fonts/pretendard.css";
// 메일 클라이언트가 웹폰트를 막아도 한글이 깨지지 않도록 시스템 폰트를 함께 지정
const MAIL_SAFE_FONT_STACK =
  "'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo','Noto Sans KR',Arial,Helvetica,sans-serif";
const MAIL_PREFERRED_FONT_STACK = `'Pretendard Variable','Pretendard',${MAIL_SAFE_FONT_STACK}`;

const SCRIPT_TAG_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const STYLE_TAG_PATTERN = /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi;
const EVENT_HANDLER_ATTR_PATTERN = /\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const JAVASCRIPT_URL_ATTR_PATTERN = /\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi;
const URL_ATTR_PATTERN = /\s(href|src)\s*=\s*(["'])([^"']*)\2/gi;
const DATA_IMAGE_ATTR_PATTERN = /(<img\b[^>]*?\bsrc\s*=\s*["'])(data:image\/[a-zA-Z0-9.+-]+;base64,[^"']+)(["'][^>]*>)/gi;
const DATA_IMAGE_URI_PATTERN = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=\r\n]+)$/i;

// HTML 특수문자 이스케이프
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// 줄바꿈(\n)을 HTML <br />로 변환
const toHtmlWithLineBreaks = (value: string) => escapeHtml(value).replace(/\r?\n/g, "<br />");

const toAbsoluteUrl = (value: string) => {
  const url = normalizeText(value);
  if (!url || !MAIL_BASE_URL) {
    return url;
  }

  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#|cid:)/i.test(url)) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${MAIL_BASE_URL}${url}`;
  }

  return url;
};

// 미리보기 iframe과 실제 발송 메일 head에 Pretendard 폰트 CSS 링크를 삽입
const buildPretendardFontLinks = () => {
  const variableCssUrl = escapeHtml(toAbsoluteUrl(PRETENDARD_VARIABLE_CSS_PATH) || PRETENDARD_VARIABLE_CSS_PATH);
  const staticCssUrl = escapeHtml(toAbsoluteUrl(PRETENDARD_STATIC_CSS_PATH) || PRETENDARD_STATIC_CSS_PATH);

  return `
        <link rel="stylesheet" href="${variableCssUrl}" />
        <link rel="stylesheet" href="${staticCssUrl}" />
      `;
};

const sanitizeReplyHtml = (value: string) => {
  if (!value) {
    return "";
  }

  let sanitized = value;
  sanitized = sanitized.replace(SCRIPT_TAG_PATTERN, "");
  sanitized = sanitized.replace(STYLE_TAG_PATTERN, "");
  sanitized = sanitized.replace(EVENT_HANDLER_ATTR_PATTERN, "");
  sanitized = sanitized.replace(
    JAVASCRIPT_URL_ATTR_PATTERN,
    (_full, attrName: string, quote: string) => ` ${attrName}=${quote}#${quote}`
  );
  sanitized = sanitized.replace(URL_ATTR_PATTERN, (_full, attrName: string, quote: string, rawUrl: string) => {
    const nextUrl = toAbsoluteUrl(rawUrl);
    return ` ${attrName}=${quote}${nextUrl}${quote}`;
  });

  return sanitized;
};

const buildReplyContentHtml = (value: string) => sanitizeReplyHtml(toCkEditorDataFromStoredContent(value));

const buildReplyContentText = (value: string) => {
  const normalizedHtml = toCkEditorDataFromStoredContent(value);
  if (!normalizedHtml) {
    return "";
  }
  return toPlainTextFromCkEditor(normalizedHtml).replace(/\n{3,}/g, "\n\n").trim();
};

const getImageExtension = (contentType: string) => {
  const normalized = normalizeText(contentType).toLowerCase();
  const fallback = normalized.startsWith("image/") ? normalized.slice(6) : "png";
  const extension = fallback.replace(/[^a-z0-9]/g, "");
  return extension || "png";
};

const extractInlineImageAttachments = (html: string): { html: string; attachments: InlineImageAttachment[] } => {
  const attachments: InlineImageAttachment[] = [];
  const cidByDataUri = new Map<string, string>();
  const cidSeed = Date.now();
  let imageSequence = 0;

  const convertedHtml = html.replace(DATA_IMAGE_ATTR_PATTERN, (full, prefix: string, dataUri: string, suffix: string) => {
    const normalizedDataUri = dataUri.replace(/\s+/g, "");
    const parsed = DATA_IMAGE_URI_PATTERN.exec(normalizedDataUri);
    if (!parsed) {
      return full;
    }

    const contentType = parsed[1].toLowerCase();
    const base64Payload = parsed[2].replace(/\s+/g, "");
    if (!base64Payload) {
      return full;
    }

    let cid = cidByDataUri.get(normalizedDataUri);
    if (!cid) {
      imageSequence += 1;
      cid = `contact-reply-inline-${cidSeed}-${imageSequence}@thefull`;
      cidByDataUri.set(normalizedDataUri, cid);
      attachments.push({
        filename: `contact-reply-image-${imageSequence}.${getImageExtension(contentType)}`,
        content: Buffer.from(base64Payload, "base64"),
        cid,
        contentType,
        contentDisposition: "inline",
      });
    }

    return `${prefix}cid:${cid}${suffix}`;
  });

  return {
    html: convertedHtml,
    attachments,
  };
};

// 담당자명 마스킹(앞/뒤 글자만 노출, 중간은 * 처리)
const maskManagerName = (value: unknown) => {
  const name = normalizeText(value);
  if (!name) {
    return "고객";
  }

  const chars = Array.from(name);
  if (chars.length === 1) {
    return `${chars[0]}*`;
  }
  if (chars.length === 2) {
    return `${chars[0]}*`;
  }

  return `${chars[0]}${"*".repeat(chars.length - 2)}${chars[chars.length - 1]}`;
};

// 상단 로고 HTML 생성(미리보기는 public 경로, 이메일은 외부 URL > 기본 URL > 텍스트 순 fallback)
const buildLogoMarkup = (mode: ContactReplyLogoRenderMode) => {
  if (mode === "preview") {
    return `<img src="${MAIL_LOGO_PUBLIC_PATH}" alt="더채움 로고" style="${MAIL_LOGO_INLINE_STYLE}" />`;
  }

  if (MAIL_LOGO_URL) {
    return `<img src="${escapeHtml(MAIL_LOGO_URL)}" alt="더채움 로고" style="${MAIL_LOGO_INLINE_STYLE}" />`;
  }

  if (MAIL_LOGO_FALLBACK_PUBLIC_URL) {
    return `<img src="${escapeHtml(MAIL_LOGO_FALLBACK_PUBLIC_URL)}" alt="더채움 로고" style="${MAIL_LOGO_INLINE_STYLE}" />`;
  }

  return `<span style="font-size:24px;font-weight:800;letter-spacing:0.04em;color:#111111;">더채움</span>`;
};

// 메일 제목 생성(문의 제목 있으면 suffix 추가)
const buildSubject = (inquiryTitle: string) => {
  const title = normalizeText(inquiryTitle);
  if (!title) {
    return "[더채움] 고객문의 답변 안내";
  }
  return `[더채움] 고객문의 답변 안내 - ${title}`;
};

// 메일 발신/수신 메타 정보 생성(미리보기/실발송 공통)
const buildEnvelope = (input: SendContactReplyEmailInput): ContactReplyEnvelope => ({
  from: MAIL_FROM,
  to: normalizeText(input.toEmail),
  replyTo: MAIL_REPLY_TO,
});

// 텍스트 메일 본문 생성(plain text fallback)
const buildTextBody = (input: SendContactReplyEmailInput) => {
  const maskedManagerName = maskManagerName(input.managerName);
  const replyText = buildReplyContentText(input.replyContent) || "-";
  const lines = [
    "[ 더채움 고객문의 답변 ]",
    "",
    `${maskedManagerName} 님, 안녕하세요.`,
    "문의해 주신 내용에 대한 답변을 안내드립니다.",
    "",
    "------------------------------------------------------------",
    "안녕하세요, 더채움입니다.",
    "",
    replyText,
    "",
    `답변작성자: ${normalizeText(input.replyUserId) || "-"}`,
    "",
    "감사합니다.",
    "더채움 드림",
    "",
    "------------------------------------------------------------",
    "고객님께서 문의하신 내용입니다.",
    `제목: ${normalizeText(input.inquiryTitle) || "-"}`,
    normalizeText(input.inquiryContent) || "-",
  ];

  return lines.join("\n");
};

// HTML 메일 본문 생성(카드형 템플릿)
const buildHtmlBody = (input: SendContactReplyEmailInput, logoMode: ContactReplyLogoRenderMode = "email") => {
  const maskedManagerName = maskManagerName(input.managerName);
  const safeMaskedManagerName = escapeHtml(maskedManagerName);
  const safeInquiryTitle = escapeHtml(normalizeText(input.inquiryTitle) || "-");
  const safeInquiryContent = toHtmlWithLineBreaks(normalizeText(input.inquiryContent) || "-");
  const safeReplyContent = buildReplyContentHtml(input.replyContent) || "-";
  // 미리보기와 실제 발송 메일의 타이포를 동일하게 맞춰 화면과 메일 간 차이를 줄인다.
  const bodyFontSize = "16px";
  const bodyFontWeight = "400";
  const headingFontWeight = "800";
  const resolvedFontFamily = MAIL_PREFERRED_FONT_STACK;

  return `
    <!doctype html>
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>더채움 고객문의 답변</title>
        ${buildPretendardFontLinks()}
      </head>
      <body style="margin:0;padding:0;background-color:#f3f5f8;font-family:${resolvedFontFamily};-webkit-text-size-adjust:100%;text-size-adjust:100%;">
        <div style="margin:0;padding:28px 14px;background-color:#f3f5f8;font-family:${resolvedFontFamily};line-height:1.7;color:#111111;text-rendering:optimizeLegibility;-webkit-text-size-adjust:100%;text-size-adjust:100%;font-size:${bodyFontSize};font-weight:${bodyFontWeight};-webkit-font-smoothing:antialiased;">
          <div style="max-width:720px;margin:0 auto;">
            <div style="background:#ffffff;border:1px solid #e4e8ee;border-radius:18px;overflow:hidden;box-shadow:0 12px 26px rgba(17,17,17,0.06);">
              <div style="padding:22px 28px 14px;border-bottom:1px solid #edf0f5;">
                ${buildLogoMarkup(logoMode)}
              </div>

              <div style="padding:26px 28px 30px;">
                <h1 style="margin:0 0 22px;font-size:30px;line-height:1.2;font-weight:800;letter-spacing:-0.03em;color:#0f1728;">
                  [ 더채움 고객문의 답변 ]
                </h1>

                <h3 style="margin:0 0 2px;font-size:${bodyFontSize};line-height:1.7;font-weight:${headingFontWeight};color:#0f1728;">
                  ${safeMaskedManagerName} 님, 안녕하세요.
                </h3>
                <p style="margin:0 0 20px;font-size:${bodyFontSize};line-height:1.7;font-weight:${headingFontWeight};color:#0f1728;">
                  문의해 주신 내용에 대한 답변을 안내드립니다.
                </p>

                <hr style="margin:0 0 20px;border:0;border-top:1px solid #d9dde5;" />

                <p style="margin:0 0 8px;font-size:${bodyFontSize};line-height:1.5;">안녕하세요, 더채움입니다.</p>
                <div style="margin:0 0 18px;font-size:${bodyFontSize};line-height:1.5;color:#1f2937;">
                  ${safeReplyContent}
                </div>

                <p style="margin:0 0 20px;font-size:${bodyFontSize};line-height:1.7;">
                  감사합니다.<br />더채움 드림
                </p>
                <hr style="margin:0 0 5px;border:0;border-top:1px solid #d9dde5;" />
              </div>
            </div>

            <div style="margin-top:16px;background:#ffffff;border:1px solid #e4e8ee;border-radius:18px;padding:22px 28px;box-shadow:0 8px 20px rgba(17,17,17,0.04);">
              <h2 style="margin:0 0 14px;font-size:${bodyFontSize};line-height:1.7;font-weight:${headingFontWeight};color:#0f1728;">
                고객님께서 문의하신 내용입니다.
              </h2>
              <hr style="margin:0 0 20px;border:0;border-top:1px solid #d9dde5;" />
              <h3 style="margin:0 0 8px;font-size:${bodyFontSize};line-height:1.7;font-weight:${headingFontWeight};color:#111111;">제목</h3>
              <p style="margin:0 0 16px;font-size:${bodyFontSize};line-height:1.7;color:#1f2937;">${safeInquiryTitle}</p>
              <h3 style="margin:0 0 8px;font-size:${bodyFontSize};line-height:1.7;font-weight:${headingFontWeight};color:#111111;">문의내용</h3>
              <div style="margin:0 0 20px;font-size:${bodyFontSize};line-height:1.7;color:#1f2937;white-space:normal;">
                ${safeInquiryContent}
              </div>
              <hr style="margin:0 0 5px;border:0;border-top:1px solid #d9dde5;" />
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

// 고객문의 답변 메일 미리보기 payload 생성(관리화면 미리보기/실발송 공통)
export const buildContactReplyEmailPreview = (
  input: SendContactReplyEmailInput,
  options?: { logoMode?: ContactReplyLogoRenderMode }
) => {
  const logoMode = options?.logoMode ?? "email";
  const subject = buildSubject(normalizeText(input.inquiryTitle));
  const text = buildTextBody(input);
  const html = buildHtmlBody(input, logoMode);
  const envelope = buildEnvelope(input);

  return {
    subject,
    text,
    html,
    envelope,
  };
};

// 고객문의 답변 메일 발송 함수
export const sendContactReplyEmail = async (input: SendContactReplyEmailInput) => {
  const toEmail = normalizeText(input.toEmail);
  if (!toEmail) {
    throw new Error("문의자 이메일이 없어 메일을 발송할 수 없습니다.");
  }

  if (!SMTP_AUTH_USER) {
    throw new Error("CONTACT_REPLY_SMTP_USER 환경변수를 설정해 주세요.");
  }

  if (!SMTP_AUTH_PASS) {
    throw new Error("CONTACT_REPLY_SMTP_PASSWORD 환경변수를 설정해 주세요.");
  }

  const transporter = nodemailer.createTransport(SMTP_CONFIG);
  const preview = buildContactReplyEmailPreview(input, { logoMode: "email" });
  const prepared = extractInlineImageAttachments(preview.html);

  const info = await transporter.sendMail({
    from: MAIL_FROM,
    to: toEmail,
    replyTo: MAIL_REPLY_TO,
    subject: preview.subject,
    text: preview.text,
    html: prepared.html,
    attachments: prepared.attachments,
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
};
