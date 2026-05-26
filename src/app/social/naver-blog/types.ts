const BLOG_ID = "thefull1999";

export const NAVER_BLOG_HOME = `https://blog.naver.com/${BLOG_ID}`;

export type NaverBlogPost = {
  title: string;
  link: string;
  paragraphs: string[];
  pubDate: string;
  thumbnail: string | null;
};
