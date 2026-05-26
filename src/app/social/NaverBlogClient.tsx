"use client";

import { useCallback, useEffect, useState } from "react";
import type { NaverBlogPost } from "@/app/api/naver-blog/route";

// 네이버 블로그 썸네일 없을 때 연결할 블로그 홈 URL
const BLOG_HOME = "https://blog.naver.com/thefull1999";

// RSS pubDate 문자열을 화면 표시용 YYYY.MM.DD 형식으로 변환
function formatBlogDate(pubDate: string): string {
  if (!pubDate) return "";
  const date = new Date(pubDate);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

// 네이버 블로그 게시글 목록 클라이언트 컴포넌트
export default function NaverBlogClient() {
  // 현재 화면에 표시 중인 게시글 목록
  const [posts, setPosts] = useState<NaverBlogPost[]>([]);
  // 최초 게시글 로딩 상태: 스켈레톤 표시 여부 제어
  const [isLoading, setIsLoading] = useState(true);
  // 더보기 버튼 클릭 시 추가 로딩 상태
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  // 현재 마지막으로 불러온 페이지 번호
  const [page, setPage] = useState(1);
  // 다음 페이지 게시글 존재 여부: 더보기 버튼 노출 제어
  const [hasMore, setHasMore] = useState(false);

  // 지정한 페이지의 네이버 블로그 게시글을 API에서 조회하는 함수
  const fetchPosts = useCallback(async (targetPage: number) => {
    const response = await fetch(`:8081/api/naver-blog?page=${targetPage}`);
    if (!response.ok) throw new Error("fetch failed");
    return response.json() as Promise<{ posts: NaverBlogPost[]; hasMore: boolean }>;
  }, []);

  // 마운트 시 첫 페이지 게시글 초기 로딩
  useEffect(() => {
    let isMounted = true;

    const loadInitial = async () => {
      try {
        const data = await fetchPosts(1);
        if (!isMounted) return;
        setPosts(data.posts);
        setHasMore(data.hasMore);
      } catch {
        // 로드 실패 시 빈 목록 유지
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadInitial();
    return () => { isMounted = false; };
  }, [fetchPosts]);

  // 더보기 버튼 클릭 시 다음 페이지 게시글을 기존 목록 뒤에 추가하는 함수
  const handleLoadMore = useCallback(async () => {
    if (isMoreLoading) return;
    setIsMoreLoading(true);
    try {
      const nextPage = page + 1;
      const data = await fetchPosts(nextPage);
      setPosts((prev) => [...prev, ...data.posts]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } catch {
      // 추가 로드 실패 무시
    } finally {
      setIsMoreLoading(false);
    }
  }, [fetchPosts, isMoreLoading, page]);

  // 초기 로딩 중: 게시글 행 형태의 스켈레톤 5개 표시
  if (isLoading) {
    return (
      <div className="naver-blog-list">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`naver-skeleton-${i}`} className="naver-blog-row naver-blog-row--skeleton">
            <div className="naver-blog-thumb-wrap naver-blog-thumb-wrap--skeleton" />
            <div className="naver-blog-content">
              <div className="naver-blog-skeleton-title" />
              <div className="naver-blog-skeleton-date" />
              <div className="naver-blog-skeleton-desc" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 게시글 없음: API 응답 실패 또는 빈 블로그인 경우 안내 문구 표시
  if (posts.length === 0) {
    return (
      <div className="social-naver-empty">
        <p>네이버 블로그 게시글을 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      {/* 네이버 블로그 게시글 행 목록 */}
      <div className="naver-blog-list">
        {posts.map((post, index) => (
          // 행 전체가 해당 블로그 게시글로 이동하는 링크
          <a
            key={`${post.link}-${index}`}
            href={post.link || BLOG_HOME}
            target="_blank"
            rel="noreferrer"
            className="naver-blog-row group"
            aria-label={post.title}
          >
            {/* 게시글 대표 썸네일: 없을 때 이미지 아이콘 대체 영역 표시 */}
            <div className="naver-blog-thumb-wrap">
              {post.thumbnail ? (
                <img
                  src={post.thumbnail}
                  alt={post.title}
                  className="naver-blog-thumb"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="naver-blog-thumb-fallback">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="naver-blog-thumb-icon"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
            </div>

            {/* 게시글 내용 영역: 날짜·제목·본문 요약·자세히 보기 문구 */}
            <div className="naver-blog-content">
              <div className="naver-blog-date">{formatBlogDate(post.pubDate)}</div>
              <h3 className="naver-blog-title group-hover:underline">{post.title}</h3>
              {/* 본문 단락 래퍼: 남은 공간을 채우며 넘치면 잘림 */}
              <div className="naver-blog-desc-wrap">
                {post.paragraphs.map((para, i) => (
                  <p key={i} className="naver-blog-desc">{para}</p>
                ))}
              </div>
              {/* 자세히 보기: 내용 영역 최하단 고정 */}
              <span className="naver-blog-more">자세히 보기 →</span>
            </div>
          </a>
        ))}
      </div>

      {/* 더보기 버튼: 다음 페이지 게시글이 있을 때만 표시 */}
      {hasMore && (
        <div className="mt-12 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isMoreLoading}
            className="group relative overflow-hidden border border-[#111111] px-14 py-4 text-xs font-semibold tracking-[0.35em] text-[#111111] transition-colors duration-300 hover:text-white disabled:cursor-wait disabled:opacity-60"
          >
            <span className="absolute inset-0 -translate-y-full bg-[#111111] transition-transform duration-300 group-hover:translate-y-0" />
            <span className="relative flex items-center gap-3">
              더보기
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            </span>
          </button>
        </div>
      )}
    </>
  );
}
