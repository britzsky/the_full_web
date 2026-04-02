// 고객문의 화면: 일반 텍스트를 CKEditor 데이터(html)로 변환
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const HTML_TAG_PATTERN = /<\/?[a-z][^>]*>/i;
const MEDIA_TAG_PATTERN = /<(img|video|audio|iframe|object|embed|svg|canvas|table)\b/i;

// 고객문의 화면: 저장된 평문을 CKEditor 표시용 문단/줄바꿈 html로 변환
export const toCkEditorDataFromPlainText = (value: string) => {
  const normalized = typeof value === "string" ? value.replace(/\r\n/g, "\n").replace(/\r/g, "\n") : "";
  if (!normalized.trim()) {
    return "";
  }

  // 문의관리 상세: DB에 저장된 개행을 CKEditor에서 최대한 동일하게 복원
  return `<p>${escapeHtml(normalized).replace(/\n/g, "<br />")}</p>`;
};

// 고객문의 화면: 저장된 답변이 HTML인지 판단
export const isCkEditorHtml = (value: string) => {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) {
    return false;
  }
  return HTML_TAG_PATTERN.test(normalized);
};

// 문의관리 상세: 저장된 답변(평문/HTML)을 CKEditor 표시용 HTML로 정규화
export const toCkEditorDataFromStoredContent = (value: string) => {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) {
    return "";
  }

  if (isCkEditorHtml(normalized)) {
    return normalized;
  }

  return toCkEditorDataFromPlainText(normalized);
};

// 고객문의 화면: CKEditor html 값을 기존 저장 로직용 평문으로 정규화
export const toPlainTextFromCkEditor = (value: string) => {
  const raw = typeof value === "string" ? value : "";
  if (!raw.trim()) {
    return "";
  }

  const normalizedHtml = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<(p|div|li|h[1-6])[^>]*>/gi, "");

  if (typeof window === "undefined") {
    return normalizedHtml
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const container = document.createElement("div");
  container.innerHTML = normalizedHtml;
  return (container.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

// 고객문의 화면: CKEditor 답변에 실질적인 내용(텍스트/미디어)이 있는지 확인
export const isCkEditorContentMeaningful = (value: string) => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return false;
  }

  if (MEDIA_TAG_PATTERN.test(raw)) {
    return true;
  }

  const plain = toPlainTextFromCkEditor(raw)
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/\u00a0/g, " ")
    .trim();

  return plain.length > 0;
};
