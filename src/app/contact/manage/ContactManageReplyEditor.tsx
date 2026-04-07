"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ActionFeedbackModal from "@/app/components/Common/ActionFeedbackModal";
import ActionConfirmModal from "@/app/components/Common/ActionConfirmModal";
import { toPublicWebApiUrl } from "@/app/lib/publicWebApi";
import {
  isCkEditorContentMeaningful,
  toCkEditorDataFromStoredContent,
} from "../editorTextUtils";

// 문의관리 상세에서 답변 입력창 초기값으로 쓰는 데이터 모델
type ContactInquiryReplyRecord = {
  id: number;
  inquiryId: number;
  content: string;
  userId: string;
  registeredAt: string;
  modifiedBy: string;
  modifiedAt: string;
};

// 문의관리 상세 답변 에디터 props 모델
type ContactManageReplyEditorProps = {
  inquiryId: number;
  initialReply: ContactInquiryReplyRecord | null;
  inquiryTitle: string;
  inquiryContent: string;
  erpUserId?: string;
};

// 문의관리 상세 답변 저장/삭제 결과 모달 모델
type ReplyFeedbackModalState = {
  open: boolean;
  tone: "success" | "error";
  heading: string;
  message: string;
  caption: string;
  nextPath: string;
  shouldRefresh: boolean;
};

// 문의관리 상세 답변 메일 미리보기 모달 상태 모델
type ReplyPreviewModalState = {
  open: boolean;
  subject: string;
  html: string;
  from: string;
  to: string;
};

// 문의관리 상세: 답변 CKEditor5 컴포넌트를 클라이언트에서만 로드
const ContactManageReplyCkEditor = dynamic(() => import("@/app/promotion/PromotionCkEditor"), {
  ssr: false,
  loading: () => <div className="contact-manage-reply-ckeditor-loading">에디터를 불러오는 중입니다.</div>,
});

// 문의관리 상세: 답변 저장/문의 삭제 UI 컴포넌트
export default function ContactManageReplyEditor({
  inquiryId,
  initialReply,
  inquiryTitle,
  inquiryContent,
  erpUserId = "",
}: ContactManageReplyEditorProps) {
  const router = useRouter();
  const normalizedErpUserId = erpUserId.trim();
  const userId = normalizedErpUserId || initialReply?.userId || "admin";
  const initialStoredContent = toCkEditorDataFromStoredContent(initialReply?.content || "");
  const [content, setContent] = useState(initialStoredContent);
  const [savedContent, setSavedContent] = useState(initialStoredContent);
  // 문의관리 상세: 에디터 표시값(html)과 저장/송부값(html)을 분리해 커서 점프를 방지
  const [editorContent, setEditorContent] = useState(initialStoredContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSplitViewOpen, setIsSplitViewOpen] = useState(false);
  const [previewModal, setPreviewModal] = useState<ReplyPreviewModalState>({
    open: false,
    subject: "",
    html: "",
    from: "",
    to: "",
  });
  const [feedbackModal, setFeedbackModal] = useState<ReplyFeedbackModalState>({
    open: false,
    tone: "success",
    heading: "",
    message: "",
    caption: "",
    nextPath: "",
    shouldRefresh: false,
  });

  useEffect(() => {
    // 문의관리 상세: URL로 전달받은 user_id를 세션 쿠키로 유지
    if (!normalizedErpUserId) {
      return;
    }
    document.cookie = `erp_user_id=${encodeURIComponent(normalizedErpUserId)}; Path=/; SameSite=Lax`;
  }, [normalizedErpUserId]);

  useEffect(() => {
    // 문의관리 상세: 서버에서 다시 읽은 답변 본문을 에디터/저장 상태에 동기화
    const nextStoredContent = toCkEditorDataFromStoredContent(initialReply?.content || "");
    setContent(nextStoredContent);
    setSavedContent(nextStoredContent);
    setEditorContent(nextStoredContent);
  }, [initialReply?.content]);

  useEffect(() => {
    // 문의관리 상세: 이메일 미리보기 모달 열림 상태에서 ESC 키 닫기 지원
    if (!previewModal.open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      setPreviewModal((prev) => ({ ...prev, open: false }));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewModal.open]);

  const handleSaveReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving || isSendingEmail || isPreviewLoading || previewModal.open || feedbackModal.open || isDeleteConfirmOpen) {
      return;
    }

    const normalizedContent = content.trim();
    if (!isCkEditorContentMeaningful(normalizedContent)) {
      setFeedbackModal({
        open: true,
        tone: "error",
        heading: "저장 실패",
        message: "답변 내용을 입력해 주세요.",
        caption: "텍스트 또는 이미지를 포함해 답변을 작성해 주세요.",
        nextPath: "",
        shouldRefresh: false,
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(toPublicWebApiUrl(`/api/contact/manage/${inquiryId}/reply`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          content: normalizedContent,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "답변 저장 중 오류가 발생했습니다.");
      }

      setFeedbackModal({
        open: true,
        tone: "success",
        heading: "저장 완료",
        message: payload.message ?? "답변이 저장되었습니다.",
        caption: "확인을 누르면 최신 답변 상태로 갱신됩니다.",
        nextPath: "",
        shouldRefresh: true,
      });
      // 문의관리 상세: 저장 성공 직후에는 현재 편집값을 최신 저장본 기준으로 갱신
      setContent(normalizedContent);
      setEditorContent(normalizedContent);
      setSavedContent(normalizedContent);
    } catch (error) {
      setFeedbackModal({
        open: true,
        tone: "error",
        heading: "저장 실패",
        message: error instanceof Error ? error.message : "답변 저장 중 오류가 발생했습니다.",
        caption: "잠시 후 다시 시도해 주세요.",
        nextPath: "",
        shouldRefresh: false,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteInquiry = async () => {
    if (isDeleting || isSaving || isSendingEmail || isPreviewLoading || previewModal.open || feedbackModal.open || isDeleteConfirmOpen) {
      return;
    }

    setIsDeleteConfirmOpen(true);
  };

  // 문의관리 상세: 삭제 확인 모달 취소 이벤트 처리
  const handleDeleteCancel = () => {
    if (isDeleting) {
      return;
    }
    setIsDeleteConfirmOpen(false);
  };

  // 문의관리 상세: 삭제 확인 모달 확인 이벤트 처리
  const handleDeleteConfirm = async () => {
    if (isDeleting || isSaving || isSendingEmail || isPreviewLoading || previewModal.open || feedbackModal.open) {
      return;
    }

    setIsDeleteConfirmOpen(false);

    setIsDeleting(true);

    try {
      const response = await fetch(toPublicWebApiUrl(`/api/contact/manage/${inquiryId}`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deletedBy: userId,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "문의 삭제 중 오류가 발생했습니다.");
      }

      setFeedbackModal({
        open: true,
        tone: "success",
        heading: "삭제 완료",
        message: payload.message ?? "문의가 삭제되었습니다.",
        caption: "확인을 누르면 문의관리 목록으로 이동합니다.",
        nextPath: "/contact/manage",
        shouldRefresh: true,
      });
    } catch (error) {
      setFeedbackModal({
        open: true,
        tone: "error",
        heading: "삭제 실패",
        message: error instanceof Error ? error.message : "문의 삭제 중 오류가 발생했습니다.",
        caption: "잠시 후 다시 시도해 주세요.",
        nextPath: "",
        shouldRefresh: false,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 문의관리 상세: 결과 모달 확인 버튼 이벤트 처리
  const handleFeedbackConfirm = () => {
    const nextPath = feedbackModal.nextPath;
    const shouldRefresh = feedbackModal.shouldRefresh;
    setFeedbackModal((prev) => ({ ...prev, open: false }));

    if (nextPath) {
      router.push(nextPath);
    }
    if (shouldRefresh) {
      router.refresh();
    }
  };

  // 문의관리 상세: 답변 메일 템플릿 미리보기 로드 이벤트 처리
  const handlePreviewOpen = async () => {
    if (
      isPreviewLoading ||
      isSaving ||
      isSendingEmail ||
      isDeleting ||
      feedbackModal.open ||
      isDeleteConfirmOpen ||
      previewModal.open
    ) {
      return;
    }

    const normalizedContent = content.trim();
    const normalizedSavedContent = savedContent.trim();
    if (!isCkEditorContentMeaningful(normalizedContent)) {
      setFeedbackModal({
        open: true,
        tone: "error",
        heading: "미리보기 실패",
        message: "답변 내용을 입력해 주세요.",
        caption: "텍스트 또는 이미지를 포함해 답변을 작성해 주세요.",
        nextPath: "",
        shouldRefresh: false,
      });
      return;
    }

    // 문의관리 상세: 문자열 완전일치 비교로 변경사항 감지(띄어쓰기/특수문자 포함)
    if (normalizedContent !== normalizedSavedContent) {
      setFeedbackModal({
        open: true,
        tone: "error",
        heading: "저장 필요",
        message: "답변 내용이 변경되었습니다. \n 이메일 송부 전에 먼저 답변을 저장해 주세요.",
        caption: "띄어쓰기/특수문자 변경도 저장 대상입니다.",
        nextPath: "",
        shouldRefresh: false,
      });
      return;
    }

    setIsPreviewLoading(true);
    try {
      const response = await fetch(`/api/contact/manage/${inquiryId}/reply/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          content: normalizedContent,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        subject?: string;
        html?: string;
        envelope?: {
          from?: string;
          to?: string;
        };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "이메일 미리보기를 불러오는 중 오류가 발생했습니다.");
      }

      setPreviewModal({
        open: true,
        subject: payload.subject ?? "",
        html: payload.html ?? "",
        from: payload.envelope?.from ?? "",
        to: payload.envelope?.to ?? "",
      });
    } catch (error) {
      setFeedbackModal({
        open: true,
        tone: "error",
        heading: "미리보기 실패",
        message: error instanceof Error ? error.message : "이메일 미리보기를 불러오는 중 오류가 발생했습니다.",
        caption: "잠시 후 다시 시도해 주세요.",
        nextPath: "",
        shouldRefresh: false,
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // 문의관리 상세: 미리보기 모달 닫기 이벤트 처리
  const handlePreviewClose = () => {
    if (isPreviewLoading || isSendingEmail) {
      return;
    }
    setPreviewModal((prev) => ({ ...prev, open: false }));
  };

  // 문의관리 상세: 미리보기 모달에서 이메일 발송 실행
  const handleSendReplyEmail = async () => {
    if (
      isSendingEmail ||
      isSaving ||
      isDeleting ||
      isPreviewLoading ||
      feedbackModal.open ||
      isDeleteConfirmOpen ||
      !previewModal.open
    ) {
      return;
    }

    const normalizedContent = content.trim();
    const normalizedSavedContent = savedContent.trim();
    if (!isCkEditorContentMeaningful(normalizedContent)) {
      setFeedbackModal({
        open: true,
        tone: "error",
        heading: "발송 실패",
        message: "답변 내용을 입력해 주세요.",
        caption: "텍스트 또는 이미지를 포함해 답변을 작성해 주세요.",
        nextPath: "",
        shouldRefresh: false,
      });
      return;
    }

    // 문의관리 상세: 방어적으로 한 번 더 저장본과 비교해 미저장 상태 송부 차단
    if (normalizedContent !== normalizedSavedContent) {
      setFeedbackModal({
        open: true,
        tone: "error",
        heading: "저장 필요",
        message: "답변 내용이 변경되었습니다. \n 이메일 송부 전에 먼저 답변을 저장해 주세요.",
        caption: "띄어쓰기/특수문자 변경도 저장 대상입니다.",
        nextPath: "",
        shouldRefresh: false,
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await fetch(`/api/contact/manage/${inquiryId}/reply/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          content: normalizedContent,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
        emailSync?: {
          sent?: boolean;
          error?: string;
        };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "이메일 발송 중 오류가 발생했습니다.");
      }

      if (payload.emailSync?.sent === false) {
        throw new Error(payload.emailSync.error || payload.message || "이메일 발송에 실패했습니다.");
      }

      setPreviewModal((prev) => ({ ...prev, open: false }));
      setFeedbackModal({
        open: true,
        tone: "success",
        heading: "발송 완료",
        message: payload.message ?? "이메일이 발송되었습니다.",
        caption: "답변 저장은 별도로 진행해 주세요.",
        nextPath: "",
        shouldRefresh: false,
      });
    } catch (error) {
      setFeedbackModal({
        open: true,
        tone: "error",
        heading: "발송 실패",
        message: error instanceof Error ? error.message : "이메일 발송 중 오류가 발생했습니다.",
        caption: "잠시 후 다시 시도해 주세요.",
        nextPath: "",
        shouldRefresh: false,
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <section className="contact-manage-reply-section">
      <div className="contact-manage-reply-head">
        <h2 className="contact-manage-reply-title">답변 관리</h2>
        <button
          type="button"
          className="contact-manage-reply-button contact-manage-reply-button-toggle"
          onClick={() => setIsSplitViewOpen((prev) => !prev)}
          aria-pressed={isSplitViewOpen}
        >
          {isSplitViewOpen ? "원래대로 보기" : "문의 내용과 좌우로 보기"}
        </button>
      </div>

      <div
        className={`contact-manage-reply-layout${isSplitViewOpen ? " contact-manage-reply-layout-split" : ""}`}
      >
        {isSplitViewOpen && (
          <aside className="contact-manage-reply-inquiry-panel" aria-label="문의 내용 확인 영역">
            <div className="contact-manage-reply-inquiry-block">
              <p className="contact-manage-reply-inquiry-label">문의 제목</p>
              <p className="contact-manage-reply-inquiry-title">{inquiryTitle || "-"}</p>
            </div>
            <div className="contact-manage-reply-inquiry-block">
              <p className="contact-manage-reply-inquiry-label">문의 내용</p>
              <div className="contact-manage-reply-inquiry-content">
                {inquiryContent || "-"}
              </div>
            </div>
          </aside>
        )}

        <form className="contact-manage-reply-form" onSubmit={handleSaveReply}>
          <div className="contact-manage-reply-field">
            <label className="contact-manage-reply-label">
              답변 작성자
            </label>
            <div className="contact-manage-reply-author-row">
              <p className="contact-manage-reply-author-fixed">더채움</p>
              <p className="contact-manage-reply-user-id">{userId}</p>
            </div>
          </div>

          <div className="contact-manage-reply-field">
            <label className="contact-manage-reply-label" htmlFor="contactReplyContent">
              답변 내용
            </label>
            <div className="contact-manage-reply-editor-box">
              {/* 문의관리 상세: 기존 required 검증 흐름 유지를 위한 프록시 textarea */}
              <textarea
                id="contactReplyContent"
                name="content"
                value={isCkEditorContentMeaningful(content) ? "filled" : ""}
                onChange={() => {}}
                className="contact-manage-reply-editor-validation-proxy"
                tabIndex={-1}
                aria-hidden="true"
                required
              />
              <div className="contact-manage-reply-ckeditor-shell" aria-label="답변 내용 편집기">
                <ContactManageReplyCkEditor
                  value={editorContent}
                  // 문의관리 상세: 입력값은 html 상태로 유지해 이미지/서식을 저장/발송에 반영
                  onChange={(nextValue) => {
                    setEditorContent(nextValue);
                    setContent(nextValue);
                  }}
                  disabled={
                    isSaving ||
                    isSendingEmail ||
                    isDeleting ||
                    isPreviewLoading ||
                    previewModal.open ||
                    feedbackModal.open ||
                    isDeleteConfirmOpen
                  }
                  placeholder="문의에 대한 답변을 입력해 주세요."
                />
              </div>
            </div>
          </div>

          <div className="contact-manage-reply-actions">
            <button
              type="button"
              className="contact-manage-reply-button contact-manage-reply-button-outline"
              onClick={handleDeleteInquiry}
              disabled={
                isDeleting ||
                isSaving ||
                isSendingEmail ||
                isPreviewLoading ||
                previewModal.open ||
                feedbackModal.open ||
                isDeleteConfirmOpen
              }
            >
              {isDeleting ? "삭제중..." : "문의삭제"}
            </button>
            <div className="contact-manage-reply-actions-right">
              <button
                type="button"
                className="contact-manage-reply-button contact-manage-reply-button-preview"
                onClick={handlePreviewOpen}
                disabled={isPreviewLoading || isSaving || isSendingEmail || isDeleting || feedbackModal.open || isDeleteConfirmOpen}
              >
                {isPreviewLoading ? "미리보기 불러오는 중..." : "이메일 미리보기(발송)"}
              </button>
              <button
                type="submit"
                className="contact-manage-reply-button contact-manage-reply-button-dark"
                disabled={
                  isSaving ||
                  isSendingEmail ||
                  isDeleting ||
                  isPreviewLoading ||
                  previewModal.open ||
                  feedbackModal.open ||
                  isDeleteConfirmOpen
                }
              >
                {isSaving ? "저장중..." : "답변저장"}
              </button>
            </div>
          </div>

          {/* 고객문의 관리 화면: 답변 저장/삭제 결과 모달 영역 */}
          <ActionFeedbackModal
            open={feedbackModal.open}
            tone={feedbackModal.tone}
            heading={feedbackModal.heading}
            message={feedbackModal.message}
            caption={feedbackModal.caption}
            onConfirm={handleFeedbackConfirm}
          />

          {/* 고객문의 관리 화면: 문의 삭제 확인 모달 영역 */}
          <ActionConfirmModal
            open={isDeleteConfirmOpen}
            heading="문의 삭제"
            message="이 문의를 삭제하시겠습니까?"
            caption="삭제 후에는 되돌릴 수 없습니다."
            cancelLabel="취소"
            confirmLabel="삭제"
            onCancel={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
          />

          {previewModal.open && (
            <div className="contact-manage-preview-backdrop" role="dialog" aria-modal="true" aria-labelledby="reply-preview-title">
              <div className="contact-manage-preview-modal">
                <div className="contact-manage-preview-header">
                  <h3 id="reply-preview-title" className="contact-manage-preview-title">이메일 미리보기</h3>
                  <div className="contact-manage-preview-header-actions">
                    <button
                      type="button"
                      className="contact-manage-preview-close"
                      onClick={handlePreviewClose}
                      disabled={isPreviewLoading || isSendingEmail}
                    >
                      닫기
                    </button>
                    <button
                      type="button"
                      className="contact-manage-preview-send"
                      onClick={handleSendReplyEmail}
                      disabled={isPreviewLoading || isSendingEmail || isSaving || isDeleting}
                    >
                      {isSendingEmail ? "발송중..." : "이메일 발송"}
                    </button>
                  </div>
                </div>
                <p className="contact-manage-preview-subject">{previewModal.subject}</p>
                <div className="contact-manage-preview-body">
                  <div className="contact-manage-preview-layout">
                    <aside className="contact-manage-preview-envelope-card" aria-label="메일 발신/수신 정보">
                      <h4 className="contact-manage-preview-envelope-title">메일 정보</h4>
                      <dl className="contact-manage-preview-envelope-list">
                        <div className="contact-manage-preview-envelope-row">
                          <dt>보낸사람</dt>
                          <dd>{previewModal.from || "-"}</dd>
                        </div>
                        <div className="contact-manage-preview-envelope-row">
                          <dt>받는사람</dt>
                          <dd>{previewModal.to || "-"}</dd>
                        </div>
                      </dl>
                    </aside>
                    <div className="contact-manage-preview-iframe-wrap">
                      <iframe
                        title="답변 메일 미리보기"
                        className="contact-manage-preview-iframe"
                        srcDoc={previewModal.html}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
