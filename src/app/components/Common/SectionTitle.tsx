import { ReactNode } from "react";

// 섹션 제목 컴포넌트에서 받는 텍스트/태그/추가 클래스 옵션
type SectionTitleProps = {
  children: ReactNode;
  wrapClassName?: string;
  titleClassName?: string;
  as?: "h1" | "h2";
  englishLabel?: string;
};

// 공통 컴포넌트: SectionTitle 함수 로직
export default function SectionTitle({
  children,
  wrapClassName = "",
  titleClassName = "",
  as = "h2",
  englishLabel,
}: SectionTitleProps) {
  // 호출부에서 지정한 h1/h2 태그를 동적으로 선택
  const HeadingTag = as;

  return (
    <div className={`main-section-title-wrap ${wrapClassName}`.trim()}>
      {/* englishLabel이 있을 때만 한글 제목 위에 짧은 바를 표시 */}
      {englishLabel && (
        <span
          aria-hidden="true"
          style={{
            display: "block",
            width: "2cm",
            height: "4px",
            backgroundColor: "var(--main-body-bar-color)",
            opacity: 0.4,
            marginBottom: "0.4rem",
          }}
        />
      )}
      {/* 한글 제목과 영문 보조 텍스트를 하단 기준으로 가로 정렬 */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem" }}>
        <HeadingTag className={`main-section-title !text-left ${titleClassName}`.trim()} style={{ margin: 0 }}>
          {children}
        </HeadingTag>
        {/* 영문 보조 텍스트: 한글 제목 오른쪽, 글자 하단 기준 정렬 */}
        {englishLabel && (
          <span
            style={{
              fontSize: "0.8rem",
              letterSpacing: "0.12em",
              color: "#80848b",
              fontWeight: 400,
              lineHeight: 1,
              paddingBottom: "0.2em",
              flexShrink: 0,
            }}
          >
            {englishLabel}
          </span>
        )}
      </div>
    </div>
  );
}

