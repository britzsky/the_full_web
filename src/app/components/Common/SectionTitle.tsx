import { ReactNode } from "react";

// 섹션 제목 컴포넌트에서 받는 텍스트/태그/추가 클래스 옵션
type SectionTitleProps = {
  children: ReactNode;
  wrapClassName?: string;
  titleClassName?: string;
  as?: "h1" | "h2";
};

// 공통 컴포넌트: SectionTitle 함수 로직
export default function SectionTitle({
  children,
  wrapClassName = "",
  titleClassName = "",
  as = "h2",
}: SectionTitleProps) {
  // 호출부에서 지정한 h1/h2 태그를 동적으로 선택
  const HeadingTag = as;

  return (
    <div className={`main-section-title-wrap ${wrapClassName}`.trim()}>
      <HeadingTag className={`main-section-title !text-left ${titleClassName}`.trim()}>
        {children}
      </HeadingTag>
    </div>
  );
}

