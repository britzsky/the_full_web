import Image, { type ImageProps } from "next/image";

// 공통 로고: 색상 버전 타입
export type TheFullLogoVariant = "default" | "white";
// 공통 로고: 파일 포맷 타입
export type TheFullLogoFormat = "png" | "svg";

// 공통 로고: 파일 경로의 공통 베이스 경로
const LOGO_BASE_PATH = "/images/logo";
// 공통 로고: variant별 파일명(확장자 제외)
const LOGO_FILE_NAME_MAP: Record<TheFullLogoVariant, string> = {
  default: "thefull_logo",
  white: "thefull_logo_white",
};
// 공통 로고: 기본 variant (미지정 시 사용)
const DEFAULT_LOGO_VARIANT: TheFullLogoVariant = "default";
// 공통 로고: 기본 format (여기 한 번만 바꾸면 전체 기본값 반영)
const DEFAULT_LOGO_FORMAT: TheFullLogoFormat = "svg";

// 공통 로고 경로 생성 함수: variant/format 조합으로 최종 src 반환
export const resolveTheFullLogoSrc = (
  variant: TheFullLogoVariant = DEFAULT_LOGO_VARIANT,
  format: TheFullLogoFormat = DEFAULT_LOGO_FORMAT
) => `${LOGO_BASE_PATH}/${LOGO_FILE_NAME_MAP[variant]}.${format}`;

// 공통 로고 컴포넌트 props
type TheFullLogoProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string;
  alt?: string;
  variant?: TheFullLogoVariant;
  format?: TheFullLogoFormat;
};

// 공통 로고 컴포넌트: 페이지별 하드코딩 대신 variant/format만 전달해서 사용
export default function TheFullLogo({
  src,
  alt = "더채움 로고",
  variant = DEFAULT_LOGO_VARIANT,
  format = DEFAULT_LOGO_FORMAT,
  ...imageProps
}: TheFullLogoProps) {
  // src가 직접 들어오면 우선 사용, 없으면 공통 규칙으로 경로 생성
  const resolvedSrc = src || resolveTheFullLogoSrc(variant, format);
  return <Image src={resolvedSrc} alt={alt} {...imageProps} />;
}
