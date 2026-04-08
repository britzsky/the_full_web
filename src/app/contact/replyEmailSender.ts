import "server-only";

import * as nodemailer from "nodemailer";
import type { SendMailOptions } from "nodemailer";
import sharp from "sharp";
import { toCkEditorDataFromStoredContent } from "./editorTextUtils";

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
  editorContentWidthPx?: number;
  smtpPassword?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpAuthUser?: string;
  mailFrom?: string;
  mailReplyTo?: string;
};

type InlineImageAttachment = NonNullable<SendMailOptions["attachments"]>[number];

// 문자열 입력 공백 정규화 유틸
const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

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

// 메일 헤더/미리보기 문자열을 함께 관리하는 주소 모델
type ContactReplyMailAddress = {
  name: string;
  address: string;
  text: string;
  header: string;
};

type ContactReplyMailRuntimeConfig = {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  authUser: string;
  authPass: string;
  from: string;
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
const FIGURE_BLOCK_PATTERN = /<figure\b[^>]*>[\s\S]*?<\/figure>/gi;
const ATTR_TEMPLATE_MAP = {
  class: /\sclass\s*=\s*(["'])([\s\S]*?)\1/i,
  style: /\sstyle\s*=\s*(["'])([\s\S]*?)\1/i,
  width: /\swidth\s*=\s*(["']?)(\d+)(?:px)?\1/i,
  height: /\sheight\s*=\s*(["']?)(\d+)(?:px)?\1/i,
} as const;
const IMAGE_FIGURE_TAG_PATTERN = /<figure\b[^>]*\bclass\s*=\s*(["'])[\s\S]*?\bimage\b[\s\S]*?\1[^>]*>/gi;
const IMAGE_TAG_PATTERN = /<img\b[^>]*>/gi;
const WIDTH_PERCENT_PATTERN = /(?:^|;)\s*width\s*:\s*([0-9]+(?:\.[0-9]+)?)%/i;
const WIDTH_PIXEL_PATTERN = /(?:^|;)\s*(?:width|max-width)\s*:\s*([0-9]+(?:\.[0-9]+)?)px/i;
const HTML_ENTITY_TEXT_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&#160;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": "\"",
  "&#39;": "'",
};
const MAX_INLINE_IMAGE_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAIL_ASCII_TEXT_PATTERN = /^[\x20-\x7E]*$/;
const HANGUL_TEXT_PATTERN = /[\uAC00-\uD7A3]/;

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

// latin1로 잘못 읽힌 UTF-8 한글 문자열을 가능한 경우 원래 한글로 복원
const repairBrokenUtf8Text = (value: string) => {
  const normalized = normalizeText(value);
  if (!normalized || HANGUL_TEXT_PATTERN.test(normalized) || MAIL_ASCII_TEXT_PATTERN.test(normalized)) {
    return normalized;
  }

  try {
    const repaired = Buffer.from(normalized, "latin1").toString("utf8").trim();
    return HANGUL_TEXT_PATTERN.test(repaired) ? repaired : normalized;
  } catch {
    return normalized;
  }
};

// 비ASCII 문자가 포함된 메일 헤더 텍스트를 UTF-8 base64 형식으로 인코딩
const encodeMailHeaderText = (value: string) => {
  const normalized = normalizeText(value);
  if (!normalized || MAIL_ASCII_TEXT_PATTERN.test(normalized)) {
    return normalized;
  }

  return `=?UTF-8?B?${Buffer.from(normalized, "utf8").toString("base64")}?=`;
};

// 표시명/주소 조합을 전송용 헤더 문자열로 변환
const buildMailAddressHeader = (name: string, address: string) => {
  const normalizedAddress = normalizeText(address);
  if (!normalizedAddress) {
    return "";
  }

  const normalizedName = normalizeText(name);
  if (!normalizedName) {
    return normalizedAddress;
  }

  return `${encodeMailHeaderText(normalizedName)} <${normalizedAddress}>`;
};

// "표시명 <주소>" 문자열을 미리보기/전송에서 함께 쓸 수 있게 분리
const parseContactReplyMailAddress = (value: string): ContactReplyMailAddress => {
  const normalized = repairBrokenUtf8Text(value);
  if (!normalized) {
    return {
      name: "",
      address: "",
      text: "",
      header: "",
    };
  }

  const addressStartIndex = normalized.lastIndexOf("<");
  const addressEndIndex = normalized.lastIndexOf(">");
  if (addressStartIndex < 0 || addressEndIndex <= addressStartIndex) {
    return {
      name: "",
      address: normalized,
      text: normalized,
      header: normalized,
    };
  }

  const address = normalizeText(normalized.slice(addressStartIndex + 1, addressEndIndex));
  const name = normalizeText(normalized.slice(0, addressStartIndex).replace(/^"(.*)"$/, "$1"));
  const text = name ? `${name} <${address}>` : address;

  return {
    name,
    address,
    text,
    header: buildMailAddressHeader(name, address),
  };
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

// 태그 속성값 조회
const getTagAttributeValue = (tag: string, attributeName: keyof typeof ATTR_TEMPLATE_MAP) => {
  const matched = tag.match(ATTR_TEMPLATE_MAP[attributeName]);
  return matched?.[2]?.trim() || "";
};

// 태그 속성 제거
const removeTagAttribute = (tag: string, attributeName: keyof typeof ATTR_TEMPLATE_MAP) =>
  tag.replace(ATTR_TEMPLATE_MAP[attributeName], "");

// style 문자열 끝 세미콜론/공백 정리
const normalizeInlineStyle = (value: string) =>
  normalizeText(value)
    .replace(/\s*;\s*/g, "; ")
    .replace(/;+\s*$/g, "")
    .trim();

// 태그 style 속성 갱신
const setTagStyleAttribute = (tag: string, styleValue: string) => {
  const normalizedStyle = normalizeInlineStyle(styleValue);
  if (!normalizedStyle) {
    return removeTagAttribute(tag, "style");
  }

  if (ATTR_TEMPLATE_MAP.style.test(tag)) {
    return tag.replace(ATTR_TEMPLATE_MAP.style, ` style="${normalizedStyle}"`);
  }

  return tag.replace(/\/?>$/, (suffix) => ` style="${normalizedStyle}"${suffix}`);
};

// 기존 style에 이메일 미리보기/발송용 스타일을 이어붙임
const appendTagStyles = (tag: string, styles: string[]) => {
  const currentStyle = getTagAttributeValue(tag, "style");
  const mergedStyle = [currentStyle, ...styles].filter(Boolean).join("; ");
  return setTagStyleAttribute(tag, mergedStyle);
};

// 태그 style/width 속성에서 실제 표시 폭(px) 추출
const getTagWidthPx = (tag: string) => {
  const styleValue = getTagAttributeValue(tag, "style");
  const styleMatched = styleValue.match(WIDTH_PIXEL_PATTERN);
  if (styleMatched) {
    const parsed = Number(styleMatched[1]);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed);
    }
  }

  const widthValue = getTagAttributeValue(tag, "width");
  if (!widthValue) {
    return 0;
  }

  const parsed = Number(widthValue);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
};

// 인라인 style의 width:% 값을 px로 변환
const convertWidthPercentStyleToPixels = (styleValue: string, baseWidthPx: number) => {
  if (!styleValue || !Number.isFinite(baseWidthPx) || baseWidthPx <= 0) {
    return "";
  }

  const matched = styleValue.match(WIDTH_PERCENT_PATTERN);
  if (!matched) {
    return "";
  }

  const percent = Number(matched[1]);
  if (!Number.isFinite(percent) || percent <= 0) {
    return "";
  }

  return `${Math.round((baseWidthPx * percent) / 100)}px`;
};

// 이미지 figure 클래스 기준으로 정렬용 인라인 스타일 생성
const buildEmailFigureStyles = (className: string) => {
  const classNames = className.split(/\s+/).filter(Boolean);
  const styles = ["display:block", "max-width:100%"];

  if (classNames.some((name) => name === "image-style-align-center" || name === "image-style-block-align-center")) {
    styles.push("margin:0 auto 18px");
    return styles;
  }

  if (classNames.some((name) => name === "image-style-align-right" || name === "image-style-block-align-right")) {
    styles.push("margin:0 0 18px auto");
    return styles;
  }

  if (classNames.some((name) => name === "image-style-align-left" || name === "image-style-block-align-left")) {
    styles.push("margin:0 auto 18px 0");
    return styles;
  }

  styles.push("margin:0 0 18px");
  return styles;
};

// 답변 본문의 CKEditor 이미지 태그를 메일용 인라인 스타일로 보정
const normalizeReplyImageMarkup = (html: string, editorContentWidthPx?: number) => {
  const safeBaseWidthPx = Number.isFinite(editorContentWidthPx) ? Number(editorContentWidthPx) : 0;

  let normalized = html.replace(IMAGE_FIGURE_TAG_PATTERN, (tag) => {
    const className = getTagAttributeValue(tag, "class");
    const currentStyle = getTagAttributeValue(tag, "style");
    const widthPx = convertWidthPercentStyleToPixels(currentStyle, safeBaseWidthPx);
    const figureStyles = buildEmailFigureStyles(className);

    if (widthPx) {
      figureStyles.push(`width:${widthPx}`);
      figureStyles.push(`max-width:${widthPx}`);
    }

    return appendTagStyles(tag, figureStyles);
  });

  normalized = normalized.replace(IMAGE_TAG_PATTERN, (tag) => {
    const widthValue = getTagAttributeValue(tag, "width");
    const nextTag = removeTagAttribute(removeTagAttribute(tag, "width"), "height");
    const currentStyle = getTagAttributeValue(nextTag, "style");
    const hasWidthStyle = /\b(?:width|max-width)\s*:/i.test(currentStyle);
    const imageStyles = ["display:block", "margin:0", "height:auto", "border:0", "max-width:100%"];

    if (!hasWidthStyle && widthValue) {
      imageStyles.push("width:100%");
      imageStyles.push(`max-width:${widthValue}px`);
    }

    return appendTagStyles(nextTag, imageStyles);
  });

  return normalized;
};

const buildReplyContentHtml = (value: string, editorContentWidthPx?: number) =>
  normalizeReplyImageMarkup(sanitizeReplyHtml(toCkEditorDataFromStoredContent(value)), editorContentWidthPx);

// 텍스트 메일 본문용 HTML 엔티티를 기본 문자로 되돌림
const decodeHtmlEntitiesForText = (value: string) =>
  value.replace(/&nbsp;|&#160;|&amp;|&lt;|&gt;|&quot;|&#39;/gi, (matched) => HTML_ENTITY_TEXT_MAP[matched.toLowerCase()] || matched);

// 텍스트 메일 본문용으로 CKEditor HTML을 안전한 평문으로 정리
const toPlainTextForMail = (value: string) =>
  decodeHtmlEntitiesForText(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
      .replace(/<(p|div|li|h[1-6])[^>]*>/gi, "")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const buildReplyContentText = (value: string) => {
  const normalizedHtml = toCkEditorDataFromStoredContent(value);
  if (!normalizedHtml) {
    return "";
  }

  try {
    return toPlainTextForMail(normalizedHtml);
  } catch {
    return normalizeText(value);
  }
};

const getImageExtension = (contentType: string) => {
  const normalized = normalizeText(contentType).toLowerCase();
  const fallback = normalized.startsWith("image/") ? normalized.slice(6) : "png";
  const extension = fallback.replace(/[^a-z0-9]/g, "");
  return extension || "png";
};

const parseDataImageUri = (dataUri: string) => {
  const normalizedDataUri = dataUri.replace(/\s+/g, "");
  const lowerDataUri = normalizedDataUri.toLowerCase();
  if (!lowerDataUri.startsWith("data:image/")) {
    return null;
  }

  const commaIndex = normalizedDataUri.indexOf(",");
  if (commaIndex <= 0) {
    return null;
  }

  const metadata = normalizedDataUri.slice(5, commaIndex);
  const lowerMetadata = metadata.toLowerCase();
  if (!lowerMetadata.endsWith(";base64")) {
    return null;
  }

  const contentType = metadata.slice(0, metadata.length - 7).toLowerCase();
  const base64Payload = normalizedDataUri.slice(commaIndex + 1).replace(/\s+/g, "");
  if (!base64Payload) {
    return null;
  }

  return {
    normalizedDataUri,
    contentType,
    buffer: Buffer.from(base64Payload, "base64"),
  };
};

// 메일 첨부 전 원본 이미지를 표시 폭 기준으로 축소
const resizeInlineImageBuffer = async (buffer: Buffer, contentType: string, targetWidthPx: number) => {
  if (!Number.isFinite(targetWidthPx) || targetWidthPx <= 0) {
    return {
      buffer,
      contentType,
    };
  }

  try {
    const imagePipeline = sharp(buffer, { failOnError: false }).rotate();
    const metadata = await imagePipeline.metadata();
    if (!metadata.width || metadata.width <= targetWidthPx) {
      return {
        buffer,
        contentType,
      };
    }

    let resized = imagePipeline.resize({
      width: targetWidthPx,
      withoutEnlargement: true,
    });

    const format = normalizeText(metadata.format).toLowerCase();
    if (format === "jpeg" || format === "jpg") {
      resized = resized.jpeg({ quality: 82, mozjpeg: true });
      return {
        buffer: await resized.toBuffer(),
        contentType: "image/jpeg",
      };
    }

    if (format === "png") {
      resized = resized.png({ compressionLevel: 9 });
      return {
        buffer: await resized.toBuffer(),
        contentType: "image/png",
      };
    }

    if (format === "webp") {
      resized = resized.webp({ quality: 82 });
      return {
        buffer: await resized.toBuffer(),
        contentType: "image/webp",
      };
    }

    return {
      buffer: await resized.toBuffer(),
      contentType,
    };
  } catch {
    return {
      buffer,
      contentType,
    };
  }
};

const formatAttachmentBytesInMb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);

// img 태그 안 src 속성의 quoted 값을 찾는다.
const findImageSrcAttribute = (fullTag: string) => {
  const lowerTag = fullTag.toLowerCase();
  let searchIndex = 0;

  while (searchIndex < fullTag.length) {
    const srcIndex = lowerTag.indexOf("src", searchIndex);
    if (srcIndex < 0) {
      return null;
    }

    const prevChar = lowerTag[srcIndex - 1] || "";
    if (prevChar && /[a-z0-9:_-]/i.test(prevChar)) {
      searchIndex = srcIndex + 3;
      continue;
    }

    let cursor = srcIndex + 3;
    while (cursor < fullTag.length && /\s/.test(fullTag[cursor])) {
      cursor += 1;
    }

    if (fullTag[cursor] !== "=") {
      searchIndex = srcIndex + 3;
      continue;
    }

    cursor += 1;
    while (cursor < fullTag.length && /\s/.test(fullTag[cursor])) {
      cursor += 1;
    }

    const quote = fullTag[cursor];
    if (quote !== "\"" && quote !== "'") {
      searchIndex = srcIndex + 3;
      continue;
    }

    const valueStartIndex = cursor + 1;
    const valueEndIndex = fullTag.indexOf(quote, valueStartIndex);
    if (valueEndIndex < 0) {
      return null;
    }

    return {
      srcValue: fullTag.slice(valueStartIndex, valueEndIndex),
      valueStartIndex,
      valueEndIndex,
    };
  }

  return null;
};

// HTML 문자열에서 다음 data:image 인라인 img 태그를 찾는다.
const findNextInlineDataImageTag = (html: string, startIndex: number) => {
  const lowerHtml = html.toLowerCase();
  let searchIndex = Math.max(0, startIndex);

  while (searchIndex < html.length) {
    const tagStartIndex = lowerHtml.indexOf("<img", searchIndex);
    if (tagStartIndex < 0) {
      return null;
    }

    const tagEndIndex = html.indexOf(">", tagStartIndex);
    if (tagEndIndex < 0) {
      return null;
    }

    const fullTag = html.slice(tagStartIndex, tagEndIndex + 1);
    const srcAttribute = findImageSrcAttribute(fullTag);
    if (!srcAttribute || !srcAttribute.srcValue.toLowerCase().startsWith("data:image/")) {
      searchIndex = tagEndIndex + 1;
      continue;
    }

    return {
      tagStartIndex,
      tagEndIndex: tagEndIndex + 1,
      fullTag,
      dataUri: srcAttribute.srcValue,
      srcValueStartIndex: srcAttribute.valueStartIndex,
      srcValueEndIndex: srcAttribute.valueEndIndex,
    };
  }

  return null;
};

const replaceInlineDataImages = async (
  html: string,
  attachments: InlineImageAttachment[],
  cidByKey: Map<string, string>,
  imageSequenceRef: { current: number },
  cidSeed: number,
  fallbackWidthPx = 0
) => {
  let nextHtml = "";
  let lastIndex = 0;

  for (
    let matched = findNextInlineDataImageTag(html, lastIndex);
    matched;
    matched = findNextInlineDataImageTag(html, lastIndex)
  ) {
    nextHtml += html.slice(lastIndex, matched.tagStartIndex);

    const parsed = parseDataImageUri(matched.dataUri);
    if (!parsed) {
      nextHtml += matched.fullTag;
      lastIndex = matched.tagEndIndex;
      continue;
    }

    const targetWidthPx = getTagWidthPx(matched.fullTag) || fallbackWidthPx;
    const cacheKey = `${parsed.normalizedDataUri}::${targetWidthPx}`;
    let cid = cidByKey.get(cacheKey);

    if (!cid) {
      imageSequenceRef.current += 1;
      cid = `contact-reply-inline-${cidSeed}-${imageSequenceRef.current}@thefull`;
      cidByKey.set(cacheKey, cid);

      const resized = await resizeInlineImageBuffer(parsed.buffer, parsed.contentType, targetWidthPx);
      attachments.push({
        filename: `contact-reply-image-${imageSequenceRef.current}.${getImageExtension(resized.contentType)}`,
        content: resized.buffer,
        cid,
        contentType: resized.contentType,
        contentDisposition: "inline",
      });
    }

    const replacementTag =
      matched.fullTag.slice(0, matched.srcValueStartIndex) +
      `cid:${cid}` +
      matched.fullTag.slice(matched.srcValueEndIndex);

    nextHtml += replacementTag;
    lastIndex = matched.tagEndIndex;
  }

  nextHtml += html.slice(lastIndex);
  return nextHtml;
};

const extractInlineImageAttachments = async (html: string): Promise<{ html: string; attachments: InlineImageAttachment[] }> => {
  const attachments: InlineImageAttachment[] = [];
  const cidByDataUri = new Map<string, string>();
  const cidSeed = Date.now();
  const imageSequenceRef = { current: 0 };
  let convertedHtml = "";
  let lastIndex = 0;
  const figurePattern = new RegExp(FIGURE_BLOCK_PATTERN.source, "gi");

  for (let matched = figurePattern.exec(html); matched; matched = figurePattern.exec(html)) {
    const figureBlock = matched[0];
    convertedHtml += html.slice(lastIndex, matched.index);

    const figureStartTag = figureBlock.match(/^<figure\b[^>]*>/i)?.[0] || "";
    const figureWidthPx = getTagWidthPx(figureStartTag);
    convertedHtml += await replaceInlineDataImages(
      figureBlock,
      attachments,
      cidByDataUri,
      imageSequenceRef,
      cidSeed,
      figureWidthPx
    );
    lastIndex = matched.index + figureBlock.length;
  }

  convertedHtml += html.slice(lastIndex);
  convertedHtml = await replaceInlineDataImages(convertedHtml, attachments, cidByDataUri, imageSequenceRef, cidSeed);

  const totalAttachmentBytes = attachments.reduce((sum, item) => {
    return sum + (Buffer.isBuffer(item.content) ? item.content.length : 0);
  }, 0);

  if (totalAttachmentBytes > MAX_INLINE_IMAGE_ATTACHMENT_BYTES) {
    throw new Error(
      `답변 메일 이미지 용량이 ${formatAttachmentBytesInMb(totalAttachmentBytes)}MB라서 발송할 수 없습니다. ` +
      "에디터에서 보이는 크기만 줄여서는 원본 파일 용량이 줄지 않으니, 이미지를 더 작은 파일로 다시 넣어 주세요."
    );
  }

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

// 요청별 SMTP 인증 계정/발신 정보 결정
const resolveContactReplyMailRuntimeConfig = (input: SendContactReplyEmailInput): ContactReplyMailRuntimeConfig => {
  const inputSmtpPort = Number(input.smtpPort);
  const smtpHost = normalizeText(input.smtpHost);
  const authUser = normalizeText(input.smtpAuthUser);
  const authPass = normalizeText(input.smtpPassword);
  const from = normalizeText(input.mailFrom);
  const replyTo = normalizeText(input.mailReplyTo);
  const smtpSecure = typeof input.smtpSecure === "boolean" ? input.smtpSecure : null;

  if (!smtpHost || !Number.isFinite(inputSmtpPort) || inputSmtpPort <= 0 || smtpSecure === null) {
    throw new Error("문의 답변 SMTP 서버 설정이 올바르지 않습니다.");
  }

  if (!authUser || !authPass) {
    throw new Error("문의 답변 SMTP 계정 정보가 올바르지 않습니다.");
  }

  if (!from || !replyTo) {
    throw new Error("문의 답변 메일 발신 정보가 올바르지 않습니다.");
  }

  return {
    smtpHost,
    smtpPort: inputSmtpPort,
    smtpSecure,
    authUser,
    authPass,
    from,
    replyTo,
  };
};

// 메일 발신/수신 메타 정보 생성(미리보기/실발송 공통)
const buildEnvelope = (
  input: SendContactReplyEmailInput,
  runtimeConfig: ContactReplyMailRuntimeConfig
): ContactReplyEnvelope => {
  const fromAddress = parseContactReplyMailAddress(runtimeConfig.from);
  const replyToAddress = parseContactReplyMailAddress(runtimeConfig.replyTo);

  return {
    from: fromAddress.text || runtimeConfig.from,
    to: normalizeText(input.toEmail),
    replyTo: replyToAddress.text || runtimeConfig.replyTo,
  };
};

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
  const safeReplyContent = buildReplyContentHtml(input.replyContent, input.editorContentWidthPx) || "-";
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
        <style>
          .contact-reply-email-body figure.image { display:block; max-width:100%; margin:0 0 18px; }
          .contact-reply-email-body figure.image img { display:block; max-width:100%; height:auto; margin:0; border:0; }
          .contact-reply-email-body figure.image.image-style-align-center,
          .contact-reply-email-body figure.image.image-style-block-align-center { margin-left:auto; margin-right:auto; }
          .contact-reply-email-body figure.image.image-style-align-right,
          .contact-reply-email-body figure.image.image-style-block-align-right { margin-left:auto; margin-right:0; }
          .contact-reply-email-body figure.image.image-style-align-left,
          .contact-reply-email-body figure.image.image-style-block-align-left { margin-left:0; margin-right:auto; }
        </style>
      </head>
      <body class="contact-reply-email-body" style="margin:0;padding:0;background-color:#f3f5f8;font-family:${resolvedFontFamily};-webkit-text-size-adjust:100%;text-size-adjust:100%;">
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
  const runtimeConfig = resolveContactReplyMailRuntimeConfig(input);
  const subject = buildSubject(normalizeText(input.inquiryTitle));
  const text = buildTextBody(input);
  const html = buildHtmlBody(input, logoMode);
  const envelope = buildEnvelope(input, runtimeConfig);

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

  const runtimeConfig = resolveContactReplyMailRuntimeConfig(input);
  const fromAddress = parseContactReplyMailAddress(runtimeConfig.from);
  const replyToAddress = parseContactReplyMailAddress(runtimeConfig.replyTo);

  const transporter = nodemailer.createTransport({
    host: runtimeConfig.smtpHost,
    port: runtimeConfig.smtpPort,
    secure: runtimeConfig.smtpSecure,
    auth: {
      user: runtimeConfig.authUser,
      pass: runtimeConfig.authPass,
    },
  });
  const preview = buildContactReplyEmailPreview(input, { logoMode: "email" });
  const prepared = await extractInlineImageAttachments(preview.html);

  const info = await transporter.sendMail({
    from: fromAddress.header || runtimeConfig.from,
    to: toEmail,
    replyTo: replyToAddress.header || runtimeConfig.replyTo,
    subject: encodeMailHeaderText(preview.subject) || preview.subject,
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
