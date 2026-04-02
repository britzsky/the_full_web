"use client";

import { useEffect } from "react";
import styles from "./ActionFeedbackModal.module.css";

// 공통 확인 모달 전달값
type ActionConfirmModalProps = {
  open: boolean;
  heading?: string;
  message: string;
  caption?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

// 공통 확인 모달 컴포넌트
export default function ActionConfirmModal({
  open,
  heading = "확인 필요",
  message,
  caption = "",
  cancelLabel = "취소",
  confirmLabel = "확인",
  onCancel,
  onConfirm,
}: ActionConfirmModalProps) {
  // 공통 확인 모달: 열림 상태에서 Enter/Escape 키로 확인/취소 처리
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onCancel, onConfirm]);

  if (!open) {
    return null;
  }

  return (
    // 공통 확인 모달: 배경 오버레이 + 접근성 대화상자 루트
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="action-confirm-modal-heading">
      {/* 공통 확인 모달: 카드 본문 컨테이너 */}
      <div className={styles.modal}>
        {/* 공통 확인 모달: 상단 브랜드 텍스트 */}
        <p className={styles.eyebrow}>THE FULL</p>
        {/* 공통 확인 모달: 확인 아이콘 + 제목 영역 */}
        <div className={styles.head}>
          <span className={`${styles.badge} ${styles.badgeConfirm}`}>?</span>
          <h3 id="action-confirm-modal-heading" className={styles.heading}>
            {heading}
          </h3>
        </div>
        {/* 공통 확인 모달: 핵심 확인 메시지 */}
        <p className={styles.message}>{message}</p>
        {/* 공통 확인 모달: 선택 보조 안내 문구 */}
        {caption && <p className={styles.caption}>{caption}</p>}
        {/* 공통 확인 모달: 취소/확인 버튼 영역 */}
        <div className={styles.actionsDual}>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={styles.confirmButton} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
