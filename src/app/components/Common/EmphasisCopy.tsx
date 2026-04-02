// 공통 컴포넌트: 컴포넌트 전달값
type EmphasisCopyProps = {
  html: string;
  className?: string;
  as?: "p" | "div";
};

// 공통 컴포넌트: 상태값
export default function EmphasisCopy({
  html,
  className = "",
  as = "p",
}: EmphasisCopyProps) {
// 공통 컴포넌트: Tag 정의
  const Tag = as;

  return (
    <Tag
      className={`common-emphasis-copy ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

