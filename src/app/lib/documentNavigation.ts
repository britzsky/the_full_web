"use client";

// 문서 이동 대상 경로 문자열 정리
const normalizePath = (value: string) => value.trim();

// 브라우저 문서 이동으로 처리해 실제 이동 URL이 네트워크 탭에 남도록 한다.
export const navigateWithDocumentRequest = (path: string, options?: { replace?: boolean }) => {
  const nextPath = normalizePath(path);
  if (!nextPath || typeof window === "undefined") {
    return;
  }

  if (options?.replace) {
    window.location.replace(nextPath);
    return;
  }

  window.location.assign(nextPath);
};

// 현재 페이지를 문서 기준으로 다시 읽어 최신 상태를 반영한다.
export const reloadCurrentDocument = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.location.reload();
};
