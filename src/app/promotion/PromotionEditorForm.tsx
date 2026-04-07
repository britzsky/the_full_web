"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import ActionFeedbackModal from "@/app/components/Common/ActionFeedbackModal";
import { toPublicWebApiUrl } from "@/app/lib/publicWebApi";

// 홍보 화면: PromotionEditorMode 타입 모델
type PromotionEditorMode = "create" | "edit";

// 홍보 화면: PromotionEditorFormValues 타입 모델
type PromotionEditorFormValues = {
  title: string;
  author: string;
  content: string;
};

// 홍보 화면: 컴포넌트 전달값
type PromotionEditorFormProps = {
  mode: PromotionEditorMode;
  postId?: number;
  initialValues?: Partial<PromotionEditorFormValues>;
};

// 홍보 화면: 저장 결과 모달 상태값
type FeedbackModalState = {
  open: boolean;
  tone: "success" | "error";
  heading: string;
  message: string;
  caption: string;
  nextPath: string;
};

// 홍보 화면: CKEditor 동적 로드 컴포넌트
const PromotionCkEditor = dynamic(() => import("./PromotionCkEditor"), {
  ssr: false,
  loading: () => <div className="promotion-ckeditor-loading">에디터를 불러오는 중입니다.</div>,
});

// 홍보 화면: data URL 이미지 주소 패턴
const dataUrlImagePattern = /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/;
// 홍보 화면: 외부 URL 이미지 주소 패턴
const urlImagePattern = /^https?:\/\/\S+$/;
// 홍보 화면: HTML 본문 판별 패턴
const htmlTagPattern = /<\/?[a-z][^>]*>/i;

// 홍보 화면: 폼 문자열 기본값 변환
const toFormValue = (value: string | undefined, fallback = "") => {
  if (typeof value !== "string") {
    return fallback;
  }
  return value;
};

// 홍보 화면: HTML 텍스트 이스케이프
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

// 홍보 화면: HTML 속성값 이스케이프
const escapeHtmlAttribute = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// 홍보 화면: 본문 문단 HTML 변환
const toParagraphHtml = (text: string) => `<p>${escapeHtml(text).replace(/\n/g, "<br />")}</p>`;

// 홍보 화면: 본문 이미지 HTML 변환(CKEditor figure 구조)
const toImageHtml = (src: string, alt: string) =>
  `<figure class="image"><img src="${escapeHtmlAttribute(src)}" alt="${escapeHtmlAttribute(alt)}" /></figure>`;

// 홍보 화면: 이미지 소스 유효성 검사(향후 DB 저장 경로 URL 대응)
const isValidImageSrc = (value: string) =>
  dataUrlImagePattern.test(value) || urlImagePattern.test(value) || value.startsWith("/");

// 홍보 화면: 에디터 HTML 정규화
const normalizeEditorHtml = (value: string) => {
  const normalized = toFormValue(value)
    .replace(/\u200B/g, "")
    .trim();

  if (!normalized) {
    return "";
  }

  const reduced = normalized
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/\s+/g, "");

  if (!reduced) {
    return "";
  }

  return normalized;
};

// 홍보 화면: 본문 입력 유효성 판별
const hasMeaningfulContent = (value: string) => {
  const normalized = normalizeEditorHtml(value);
  if (!normalized) {
    return false;
  }

  if (/<img\b/i.test(normalized)) {
    return true;
  }

  const textOnly = normalized
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return textOnly.length > 0;
};

// 홍보 화면: 저장 본문 파싱(HTML 본문/레거시 마크다운 본문)
const parsePromotionContent = (content: string) => {
  const raw = toFormValue(content).trim();
  if (!raw) {
    return "";
  }

  // 홍보 화면: HTML 본문은 그대로 편집기로 전달
  if (htmlTagPattern.test(raw)) {
    return raw;
  }

  // 홍보 화면: 레거시 마크다운 본문을 CKEditor 호환 HTML로 변환
  const blocks = raw
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
  const htmlBlocks: string[] = [];

  blocks.forEach((block) => {
    let cursor = 0;
    const matches = Array.from(block.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g));

    if (matches.length === 0) {
      htmlBlocks.push(toParagraphHtml(block));
      return;
    }

    matches.forEach((match) => {
      const matchStart = match.index ?? 0;
      const matchText = match[0] ?? "";
      const beforeText = block.slice(cursor, matchStart).trim();
      if (beforeText) {
        htmlBlocks.push(toParagraphHtml(beforeText));
      }

      const alt = (match[1] ?? "").trim() || "첨부 이미지";
      const src = (match[2] ?? "").trim();
      if (src && isValidImageSrc(src)) {
        htmlBlocks.push(toImageHtml(src, alt));
      }

      cursor = matchStart + matchText.length;
    });

    const afterText = block.slice(cursor).trim();
    if (afterText) {
      htmlBlocks.push(toParagraphHtml(afterText));
    }
  });

  return htmlBlocks.join("\n");
};

// 홍보 화면: PromotionEditorForm 함수 로직
export default function PromotionEditorForm({ mode, postId, initialValues }: PromotionEditorFormProps) {
  // 홍보 화면: router 정의
  const router = useRouter();

  // 홍보 화면: 초기 본문 HTML 변환값
  const initialContentHtml = useMemo(() => parsePromotionContent(toFormValue(initialValues?.content)), [initialValues]);

  // 홍보 화면: 입력 폼 상태값
  const [formValues, setFormValues] = useState<PromotionEditorFormValues>({
    title: toFormValue(initialValues?.title),
    author: toFormValue(initialValues?.author, "더채움"),
    content: initialContentHtml,
  });

  // 홍보 화면: 폼 제출 진행 상태값
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 홍보 화면: 저장 결과 모달 상태값
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>({
    open: false,
    tone: "success",
    heading: "",
    message: "",
    caption: "",
    nextPath: "/promotion",
  });

  // 홍보 화면: 텍스트 입력 이벤트 처리
  const handleValueChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  // 홍보 화면: 본문 에디터 입력 이벤트 처리
  const handleEditorChange = (contentHtml: string) => {
    setFormValues((prev) => ({ ...prev, content: contentHtml }));
  };

  // 홍보 화면: 폼 제출 이벤트 처리
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || feedbackModal.open) {
      return;
    }

    // 홍보 화면: endpoint 정의
    const endpoint = toPublicWebApiUrl(
      mode === "create" ? "/api/promotion/posts" : `/api/promotion/posts/${postId}`
    );
    // 홍보 화면: method 정의
    const method = mode === "create" ? "POST" : "PATCH";

    // 홍보 화면: 최종 본문 저장값(이미지 리사이즈 정보 포함 HTML)
    const composedContent = normalizeEditorHtml(formValues.content);

    if (!formValues.title.trim() || !hasMeaningfulContent(composedContent)) {
      setFeedbackModal({
        open: true,
        tone: "error",
        heading: "입력 확인",
        message: "제목과 내용을 입력해 주세요.",
        caption: "필수 항목을 확인한 뒤 다시 시도해 주세요.",
        nextPath: "",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 홍보 화면: response 정의
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formValues,
          // 홍보 화면: 최종 본문 저장값(향후 DB 이미지 경로 포함 가능 필드)
          content: composedContent,
        }),
      });

      // 홍보 화면: payload 정의
      const payload = (await response.json().catch(() => ({}))) as {
        post?: { id: number };
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "요청 처리 중 오류가 발생했습니다.");
      }

      // 홍보 화면: nextPostId 정의(수정 완료 시 상세 이동 대상)
      const nextPostId = payload.post?.id ?? postId;
      if (mode === "edit" && !nextPostId) {
        throw new Error("게시글 이동 정보가 올바르지 않습니다.");
      }

      const successMessage =
        payload.message ?? (mode === "create" ? "게시글이 등록되었습니다." : "게시글이 수정되었습니다.");

      setFeedbackModal({
        open: true,
        tone: "success",
        heading: "처리 완료",
        message: successMessage,
        caption:
          mode === "create"
            ? "확인을 누르면 홍보 목록으로 이동합니다."
            : "확인을 누르면 게시글 화면으로 이동합니다.",
        nextPath: mode === "create" ? "/promotion" : `/promotion/${nextPostId}`,
      });
    } catch (error) {
      setFeedbackModal({
        open: true,
        tone: "error",
        heading: "처리 실패",
        message: error instanceof Error ? error.message : "요청 처리 중 오류가 발생했습니다.",
        caption: "잠시 후 다시 시도해 주세요.",
        nextPath: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 홍보 화면: 저장 결과 모달 확인 버튼 이벤트 처리
  const handleCompletionConfirm = () => {
    if (!feedbackModal.open) {
      return;
    }

    const shouldMove = feedbackModal.tone === "success" && Boolean(feedbackModal.nextPath);
    const nextPath = feedbackModal.nextPath;
    setFeedbackModal((prev) => ({ ...prev, open: false }));

    if (shouldMove) {
      router.replace(nextPath);
      router.refresh();
    }
  };

  return (
    // 홍보 화면: 글작성/수정 폼 루트
    <form className="promotion-editor-form" onSubmit={handleSubmit}>
      {/* 홍보 화면: 제목/작성자 입력 영역 */}
      <div className="promotion-form-grid">
        <label className="promotion-form-label" htmlFor="title">
          제목
        </label>
        <input
          id="title"
          name="title"
          value={formValues.title}
          onChange={handleValueChange}
          className="promotion-form-field"
          required
        />

        <label className="promotion-form-label" htmlFor="author">
          작성자
        </label>
        <input
          id="author"
          name="author"
          value={formValues.author}
          onChange={handleValueChange}
          className="promotion-form-field"
          required
        />
      </div>

      {/* 홍보 화면: CKEditor 본문 편집 영역 */}
      <div className="promotion-form-block">
        <label className="promotion-form-label" htmlFor="promotion-ckeditor">
          내용
        </label>
        <div id="promotion-ckeditor" className="promotion-form-ckeditor-shell" aria-label="내용 편집기">
          <PromotionCkEditor
            value={formValues.content}
            onChange={handleEditorChange}
            disabled={isSubmitting}
            placeholder="내용을 입력해 주세요. 이미지 업로드 후 크기(25/50/75/원본) 조절이 가능합니다."
          />
        </div>
      </div>

      {/* 홍보 화면: 상태 문구/하단 액션 버튼 영역 */}
      <div className="promotion-form-actions">
        <div className="promotion-form-actions-right">
          <Link href="/promotion" className="promotion-button promotion-button-outline">
            취소
          </Link>
          <button
            type="submit"
            className="promotion-button promotion-button-dark"
            disabled={isSubmitting || feedbackModal.open}
          >
            {isSubmitting ? (mode === "create" ? "등록중..." : "수정중...") : mode === "create" ? "등록" : "수정"}
          </button>
        </div>
      </div>

      {/* 홍보 화면: 등록/수정 완료 결과 모달 영역 */}
      <ActionFeedbackModal
        open={feedbackModal.open}
        tone={feedbackModal.tone}
        heading={feedbackModal.heading}
        message={feedbackModal.message}
        caption={feedbackModal.caption}
        onConfirm={handleCompletionConfirm}
      />
    </form>
  );
}
