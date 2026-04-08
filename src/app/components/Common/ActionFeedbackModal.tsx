"use client";

import { createPortal } from "react-dom";
import styles from "./ActionFeedbackModal.module.css";

// 공통 완료/오류 모달 톤
type ActionFeedbackTone = "success" | "error";

// 공통 완료/오류 모달 전달값
type ActionFeedbackModalProps = {
  open: boolean;
  tone?: ActionFeedbackTone;
  heading?: string;
  message: string;
  caption?: string;
  confirmLabel?: string;
  onConfirm: () => void;
};

// 공통 완료/오류 모달 컴포넌트
export default function ActionFeedbackModal({
  open,
  tone = "success",
  heading = tone === "success" ? "처리 완료" : "처리 실패",
  message,
  caption = "",
  confirmLabel = "확인",
  onConfirm,
}: ActionFeedbackModalProps) {
  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    // 공통 완료/오류 모달: 배경 오버레이 + 접근성 대화상자 루트
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="action-feedback-modal-heading">
      {/* 공통 완료/오류 모달: 카드 본문 컨테이너 */}
      <div className={styles.modal}>
        {/* 공통 완료/오류 모달: 상단 브랜드 텍스트 */}
        <p className={styles.eyebrow}>THE FULL</p>
        {/* 공통 완료/오류 모달: 상태 아이콘 + 제목 영역 */}
        <div className={styles.head}>
          <span className={`${styles.badge} ${tone === "error" ? styles.badgeError : styles.badgeSuccess}`}>
            {tone === "error" ? "!" : "OK"}
          </span>
          <h3 id="action-feedback-modal-heading" className={styles.heading}>
            {heading}
          </h3>
        </div>
        {/* 공통 완료/오류 모달: 핵심 결과 메시지 */}
        <p className={styles.message}>{message}</p>
        {/* 공통 완료/오류 모달: 선택 보조 안내 문구 */}
        {caption && <p className={styles.caption}>{caption}</p>}
        {/* 공통 완료/오류 모달: 확인 버튼 영역 */}
        <div className={styles.actions}>
          <button type="button" className={styles.confirmButton} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
