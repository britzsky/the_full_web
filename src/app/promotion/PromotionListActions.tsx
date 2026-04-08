"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ActionConfirmModal from "@/app/components/Common/ActionConfirmModal";
import PageNavigationLink from "@/app/components/Common/PageNavigationLink";
import { toPublicWebApiUrl } from "@/app/lib/publicWebApi";

// 홍보 화면: 컴포넌트 전달값
type PromotionListActionsProps = {
  postId: number;
  editHref: string;
};

// 홍보 화면: 상태값
export default function PromotionListActions({ postId, editHref }: PromotionListActionsProps) {
// 홍보 화면: router 정의
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

// 홍보 화면: 이벤트 처리 로직
  const handleDelete = () => {
    if (isDeleting || isDeleteConfirmOpen) {
      return;
    }

    setIsDeleteConfirmOpen(true);
  };

// 홍보 화면: 삭제 확인 모달 취소 이벤트 처리
  const handleDeleteCancel = () => {
    if (isDeleting) {
      return;
    }
    setIsDeleteConfirmOpen(false);
  };

// 홍보 화면: 삭제 확인 모달 확인 이벤트 처리
  const handleDeleteConfirm = async () => {
    if (isDeleting) {
      return;
    }

    setIsDeleteConfirmOpen(false);

    setIsDeleting(true);
    try {
// 홍보 화면: response 정의
      const response = await fetch(toPublicWebApiUrl(`/promotion/posts/${postId}`), {
        method: "DELETE",
      });
// 홍보 화면: payload 정의
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "삭제 중 오류가 발생했습니다.");
      }

      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    // 홍보 목록 화면: 행 단위 수정/삭제 버튼 묶음 영역
    <div className="promotion-row-actions">
      <PageNavigationLink href={editHref} className="promotion-row-action-link">
        수정
      </PageNavigationLink>
      <button
        type="button"
        className="promotion-row-action-button"
        onClick={handleDelete}
        disabled={isDeleting || isDeleteConfirmOpen}
      >
        {isDeleting ? "삭제중..." : "삭제"}
      </button>

      {/* 홍보 목록 화면: 게시글 삭제 확인 모달 영역 */}
      <ActionConfirmModal
        open={isDeleteConfirmOpen}
        heading="게시글 삭제"
        message="해당 게시글을 삭제하시겠습니까?"
        caption="삭제 후에는 되돌릴 수 없습니다."
        cancelLabel="취소"
        confirmLabel="삭제"
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
