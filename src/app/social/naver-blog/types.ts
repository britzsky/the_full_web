// 네이버 블로그 아이디 — 홈 URL 파생에 사용
const BLOG_ID = "thefull1999";

// 게시글 링크가 없을 때 fallback으로 사용하는 블로그 홈 주소
export const NAVER_BLOG_HOME = `https://blog.naver.com/${BLOG_ID}`;

// 네이버 블로그 RSS 파싱 결과 게시글 타입
export type NaverBlogPost = {
  // 게시글 제목
  title: string;
  // 게시글 원문 링크
  link: string;
  // 본문에서 추출한 단락 배열
  paragraphs: string[];
  // RSS pubDate 원문 문자열
  pubDate: string;
  // 대표 썸네일 이미지 URL (없으면 null)
  thumbnail: string | null;
};
