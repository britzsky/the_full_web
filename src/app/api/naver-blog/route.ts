import { NextResponse } from "next/server";

// 네이버 블로그 아이디
const BLOG_ID = "thefull1999";
// 네이버 블로그 RSS 피드 URL
const RSS_URL = `https://rss.blog.naver.com/${BLOG_ID}.xml`;
// 페이지당 게시글 수
const PAGE_SIZE = 10;

// 네이버 블로그 API 응답 게시글 타입
export type NaverBlogPost = {
  title: string;
  link: string;
  paragraphs: string[];
  pubDate: string;
  thumbnail: string | null;
};

// XML 태그에서 CDATA 또는 일반 텍스트 내용을 추출
function extractCdata(block: string, tag: string): string {
  const cdataMatch = block.match(
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i")
  );
  if (cdataMatch) return cdataMatch[1];
  const plainMatch = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return plainMatch ? plainMatch[1].trim() : "";
}

// RSS <link> 태그에서 URL 추출: CDATA 또는 plain URL 형태 모두 처리
function extractLink(block: string): string {
  const cdataMatch = block.match(/<link[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i);
  if (cdataMatch) return cdataMatch[1].trim();
  const plainMatch = block.match(/<link[^>]*>([^<]+)<\/link>/i);
  return plainMatch ? plainMatch[1].trim() : "";
}

// XML 전체에서 <item>...</item> 블록을 모두 추출
function extractAllItems(xml: string): string[] {
  const items: string[] = [];
  let pos = 0;
  while (true) {
    const start = xml.indexOf("<item>", pos);
    if (start === -1) break;
    const end = xml.indexOf("</item>", start);
    if (end === -1) break;
    items.push(xml.slice(start + 6, end));
    pos = end + 7;
  }
  return items;
}

// description HTML에서 대표 썸네일 이미지 URL 추출: data-lazy-src → src 순으로 우선 탐색
function extractThumbnail(html: string): string | null {
  const lazyMatch = html.match(/<img[^>]+data-lazy-src=["']([^"']+)["']/i);
  if (lazyMatch) return lazyMatch[1];
  const srcMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return srcMatch ? srcMatch[1] : null;
}

// HTML 엔티티 문자를 실제 문자로 변환
function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// 남아있는 인라인 태그를 제거하고 공백을 정리해 순수 텍스트 반환
function stripInlineTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

// HTML description을 단락 배열로 변환
// 1단계: 엔티티 디코딩 후 블록 태그를 줄바꿈으로 치환해 단락 분리
// 2단계: 블록 태그가 없는 통 문자열인 경우 문장 부호 기준으로 재분리
function extractParagraphs(html: string): string[] {
  const decoded = decodeEntities(html);
  const withBreaks = decoded
    .replace(/<\/?(p|div|br|li|h[1-6]|blockquote|section|article)[^>]*>/gi, "\n");
  const lines = withBreaks
    .split("\n")
    .map(stripInlineTags)
    .filter((line) => line.length > 0);

  if (lines.length <= 1 && lines[0]) {
    return lines[0]
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  return lines;
}

// 네이버 블로그 RSS 조회 및 단락 변환 후 페이지 단위로 반환
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  try {
    const rssResponse = await fetch(RSS_URL, {
      next: { revalidate: 300 },
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NextJS/1.0)" },
    });

    if (!rssResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch Naver Blog RSS" }, { status: 502 });
    }

    const xml = await rssResponse.text();
    const rawItems = extractAllItems(xml);

    const posts: NaverBlogPost[] = rawItems.map((item) => {
      const titleHtml = extractCdata(item, "title");
      const title = stripInlineTags(titleHtml);
      const link = extractLink(item);
      const descHtml = extractCdata(item, "description");
      const paragraphs = extractParagraphs(descHtml);
      const pubDate = extractCdata(item, "pubDate");
      const thumbnail = extractThumbnail(descHtml);

      return { title, link, paragraphs, pubDate, thumbnail };
    });

    const start = (page - 1) * PAGE_SIZE;
    const pagePosts = posts.slice(start, start + PAGE_SIZE);
    const hasMore = posts.length > start + PAGE_SIZE;

    return NextResponse.json({ posts: pagePosts, hasMore, total: posts.length }, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
