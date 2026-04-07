"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { getPublicApiErrorMessage, requestPublicWebApi } from "@/app/lib/publicWebApi";
import PromotionDetailActions from "./PromotionDetailActions";
import PromotionEditorForm from "./PromotionEditorForm";
import PromotionListActions from "./PromotionListActions";
import { formatPromotionDate } from "./format";
import type { PromotionPost, PromotionPostSummary, PromotionSearchField } from "./types";

type PromotionApiPost = {
  id?: number | string;
  title?: string;
  content?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
};

type PromotionAdjacentPayload = {
  adjacent?: {
    previous?: PromotionApiPost | null;
    next?: PromotionApiPost | null;
  };
};

type PromotionListTableClientProps = {
  query: string;
  field: PromotionSearchField;
  canManagePromotion: boolean;
  refreshKey: string;
};

type PromotionDetailClientProps = {
  postId: number;
  canManagePromotion: boolean;
  refreshKey: string;
};

type PromotionEditClientProps = {
  postId: number;
  refreshKey: string;
};

type PromotionListState = {
  isLoading: boolean;
  errorMessage: string;
  posts: PromotionPostSummary[];
};

type PromotionDetailState = {
  isLoading: boolean;
  errorMessage: string;
  post: PromotionPost | null;
  adjacentPosts: {
    previous: PromotionPostSummary | null;
    next: PromotionPostSummary | null;
  };
};

type PromotionEditState = {
  isLoading: boolean;
  errorMessage: string;
  post: PromotionPost | null;
};

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const toPositiveInt = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};
const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
const toSearchField = (value: unknown): PromotionSearchField => {
  const normalized = normalizeText(value);
  return normalized === "content" || normalized === "all" ? normalized : "title";
};

const toSummary = (row?: PromotionApiPost | null): PromotionPostSummary | null => {
  const id = toPositiveInt(row?.id);
  if (!row || !id) {
    return null;
  }

  return {
    id,
    title: normalizeText(row.title),
    author: normalizeText(row.author) || "더채움",
    createdAt: normalizeText(row.createdAt),
  };
};

const toPost = (row?: PromotionApiPost | null): PromotionPost | null => {
  const summary = toSummary(row);
  if (!summary || !row) {
    return null;
  }

  return {
    ...summary,
    content: normalizeText(row.content),
    updatedAt: normalizeText(row.updatedAt) || summary.createdAt,
  };
};

// 브라우저가 공개 API를 직접 호출해서 네트워크 탭에 실제 호출 URL이 보이게 한다.
const fetchPromotionPosts = async (options?: { query?: string; field?: PromotionSearchField }) => {
  const searchParams = new URLSearchParams();
  const query = normalizeText(options?.query);
  const field = toSearchField(options?.field);

  if (query) {
    searchParams.set("q", query);
  }
  if (field) {
    searchParams.set("field", field);
  }

  const queryString = searchParams.toString();
  const path = queryString ? `/api/promotion/posts?${queryString}` : "/api/promotion/posts";
  const response = await requestPublicWebApi<{ posts?: PromotionApiPost[] }>(path);

  if (!response.ok) {
    throw new Error(getPublicApiErrorMessage(response.payload, "게시글 목록 조회 중 오류가 발생했습니다."));
  }

  return toArray<PromotionApiPost>((response.payload as { posts?: PromotionApiPost[] }).posts)
    .map((post) => toSummary(post))
    .filter((post): post is PromotionPostSummary => Boolean(post));
};

const fetchPromotionPostById = async (id: number) => {
  const postId = toPositiveInt(id);
  if (!postId) {
    return null;
  }

  const response = await requestPublicWebApi<{ post?: PromotionApiPost }>(`/api/promotion/posts/${postId}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(getPublicApiErrorMessage(response.payload, "게시글 조회 중 오류가 발생했습니다."));
  }

  return toPost((response.payload as { post?: PromotionApiPost }).post);
};

const fetchPromotionAdjacentPosts = async (id: number) => {
  const postId = toPositiveInt(id);
  if (!postId) {
    return { previous: null, next: null };
  }

  const response = await requestPublicWebApi<PromotionAdjacentPayload>(`/api/promotion/posts/${postId}/adjacent`);
  if (response.status === 404) {
    return { previous: null, next: null };
  }
  if (!response.ok) {
    throw new Error(getPublicApiErrorMessage(response.payload, "인접 게시글 조회 중 오류가 발생했습니다."));
  }

  const adjacent = (response.payload as PromotionAdjacentPayload).adjacent;
  return {
    previous: toSummary(adjacent?.previous ?? null),
    next: toSummary(adjacent?.next ?? null),
  };
};

const dataUrlImagePattern = /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/;
const urlImagePattern = /^https?:\/\/\S+$/;
const htmlTagPattern = /<\/?[a-z][^>]*>/i;

const sanitizePromotionHtml = (rawHtml: string) =>
  rawHtml
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?(iframe|object|embed|link|meta|base|form|input|button|textarea|select|option|svg|math)\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi, ' $1="#"');

const renderLegacyMarkdownContent = (content: string): ReactNode[] => {
  const blocks = content.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const nodes: ReactNode[] = [];

  blocks.forEach((block, blockIndex) => {
    let cursor = 0;
    const matches = Array.from(block.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g));

    if (matches.length === 0) {
      nodes.push(<p className="promotion-detail-paragraph" key={`promotion-paragraph-${blockIndex}`}>{block}</p>);
      return;
    }

    matches.forEach((match, imageIndex) => {
      const matchStart = match.index ?? 0;
      const matchText = match[0] ?? "";
      const beforeText = block.slice(cursor, matchStart).trim();
      if (beforeText) {
        nodes.push(
          <p className="promotion-detail-paragraph" key={`promotion-paragraph-${blockIndex}-${imageIndex}-before`}>
            {beforeText}
          </p>
        );
      }

      const imageAlt = (match[1] ?? "첨부 이미지").trim() || "첨부 이미지";
      const imageSrc = (match[2] ?? "").trim();
      if (dataUrlImagePattern.test(imageSrc) || urlImagePattern.test(imageSrc) || imageSrc.startsWith("/")) {
        nodes.push(
          <figure className="promotion-detail-image-wrap" key={`promotion-image-${blockIndex}-${imageIndex}`}>
            <img src={imageSrc} alt={imageAlt} className="promotion-detail-image" />
          </figure>
        );
      }

      cursor = matchStart + matchText.length;
    });

    const afterText = block.slice(cursor).trim();
    if (afterText) {
      nodes.push(<p className="promotion-detail-paragraph" key={`promotion-paragraph-${blockIndex}-after`}>{afterText}</p>);
    }
  });

  return nodes;
};

const renderPromotionContent = (content: string): ReactNode[] => {
  const normalizedContent = content.trim();
  if (!normalizedContent) {
    return [];
  }

  if (htmlTagPattern.test(normalizedContent)) {
    return [
      <div
        className="promotion-detail-html ck-content"
        key="promotion-html-content"
        dangerouslySetInnerHTML={{ __html: sanitizePromotionHtml(normalizedContent) }}
      />,
    ];
  }

  return renderLegacyMarkdownContent(normalizedContent);
};

export function PromotionListTableClient({ query, field, canManagePromotion, refreshKey }: PromotionListTableClientProps) {
  const [state, setState] = useState<PromotionListState>({ isLoading: true, errorMessage: "", posts: [] });

  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      try {
        const posts = await fetchPromotionPosts({ query, field });
        if (isMounted) {
          setState({ isLoading: false, errorMessage: "", posts });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            isLoading: false,
            errorMessage: error instanceof Error ? error.message : "게시글 목록 조회 중 오류가 발생했습니다.",
            posts: [],
          });
        }
      }
    };

    setState((prev) => ({ ...prev, isLoading: true, errorMessage: "" }));
    void loadPosts();
    return () => {
      isMounted = false;
    };
  }, [field, query, refreshKey]);

  return (
    <table className="promotion-table" aria-label="홍보 게시글 목록">
      <thead>
        <tr>
          <th scope="col">No</th>
          <th scope="col">제목</th>
          <th scope="col">작성자</th>
          <th scope="col">등록일</th>
          {canManagePromotion && <th scope="col">관리</th>}
        </tr>
      </thead>
      <tbody>
        {state.isLoading && (
          <tr><td colSpan={canManagePromotion ? 5 : 4} className="promotion-empty-row">게시글을 불러오는 중입니다.</td></tr>
        )}
        {!state.isLoading && state.errorMessage && (
          <tr><td colSpan={canManagePromotion ? 5 : 4} className="promotion-empty-row">{state.errorMessage}</td></tr>
        )}
        {!state.isLoading && !state.errorMessage && state.posts.map((post) => (
          <tr key={post.id}>
            <td>{post.id}</td>
            <td className="promotion-title-cell"><Link href={`/promotion/${post.id}`} className="promotion-title-link">{post.title}</Link></td>
            <td>{post.author}</td>
            <td>{formatPromotionDate(post.createdAt)}</td>
            {canManagePromotion && <td><PromotionListActions postId={post.id} editHref={`/promotion/${post.id}/edit`} /></td>}
          </tr>
        ))}
        {!state.isLoading && !state.errorMessage && state.posts.length === 0 && (
          <tr><td colSpan={canManagePromotion ? 5 : 4} className="promotion-empty-row">등록된 게시글이 없습니다.</td></tr>
        )}
      </tbody>
    </table>
  );
}

export function PromotionDetailClient({ postId, canManagePromotion, refreshKey }: PromotionDetailClientProps) {
  const [state, setState] = useState<PromotionDetailState>({
    isLoading: true,
    errorMessage: "",
    post: null,
    adjacentPosts: { previous: null, next: null },
  });

  useEffect(() => {
    let isMounted = true;

    const loadPost = async () => {
      try {
        const [post, adjacentPosts] = await Promise.all([
          fetchPromotionPostById(postId),
          fetchPromotionAdjacentPosts(postId),
        ]);

        if (isMounted) {
          setState({
            isLoading: false,
            errorMessage: post ? "" : "게시글을 찾을 수 없습니다.",
            post,
            adjacentPosts,
          });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            isLoading: false,
            errorMessage: error instanceof Error ? error.message : "게시글 조회 중 오류가 발생했습니다.",
            post: null,
            adjacentPosts: { previous: null, next: null },
          });
        }
      }
    };

    setState((prev) => ({ ...prev, isLoading: true, errorMessage: "" }));
    void loadPost();
    return () => {
      isMounted = false;
    };
  }, [postId, refreshKey]);

  if (state.isLoading || !state.post) {
    return (
      <div className="promotion-content-wrap">
        <article className="promotion-detail-card">
          <header className="promotion-detail-header"><h2 className="promotion-detail-title">홍보 게시글</h2></header>
          <div className="promotion-detail-content">
            <p className="promotion-detail-paragraph">{state.isLoading ? "게시글을 불러오는 중입니다." : state.errorMessage}</p>
          </div>
          <div className="promotion-detail-actions"><Link href="/promotion" className="promotion-button promotion-button-outline">목록</Link></div>
        </article>
      </div>
    );
  }

  return (
    <div className="promotion-content-wrap">
      <article className="promotion-detail-card">
        <header className="promotion-detail-header">
          <h2 className="promotion-detail-title">{state.post.title}</h2>
          <div className="promotion-detail-meta">
            <span><span className="promotion-detail-meta-label">작성자</span>{" "}<span className="promotion-detail-meta-value">{state.post.author}</span></span>
            <span className="promotion-detail-meta-divider" />
            <span><span className="promotion-detail-meta-label">작성일</span>{" "}<span className="promotion-detail-meta-value">{formatPromotionDate(state.post.createdAt)}</span></span>
          </div>
        </header>
        <div className="promotion-detail-content">{renderPromotionContent(state.post.content)}</div>
        <PromotionDetailActions postId={state.post.id} canManage={canManagePromotion} />
      </article>
      <div className="promotion-detail-nav">
        <div className="promotion-detail-nav-row">
          <span className="promotion-detail-nav-label">이전글</span>
          {state.adjacentPosts.previous ? <Link href={`/promotion/${state.adjacentPosts.previous.id}`} className="promotion-detail-nav-link">{state.adjacentPosts.previous.title}</Link> : <span className="promotion-detail-nav-empty">이전 글이 없습니다.</span>}
          <span className="promotion-detail-nav-date">{state.adjacentPosts.previous ? formatPromotionDate(state.adjacentPosts.previous.createdAt) : ""}</span>
        </div>
        <div className="promotion-detail-nav-row">
          <span className="promotion-detail-nav-label">다음글</span>
          {state.adjacentPosts.next ? <Link href={`/promotion/${state.adjacentPosts.next.id}`} className="promotion-detail-nav-link">{state.adjacentPosts.next.title}</Link> : <span className="promotion-detail-nav-empty">다음 글이 없습니다.</span>}
          <span className="promotion-detail-nav-date">{state.adjacentPosts.next ? formatPromotionDate(state.adjacentPosts.next.createdAt) : ""}</span>
        </div>
      </div>
    </div>
  );
}

export function PromotionEditClient({ postId, refreshKey }: PromotionEditClientProps) {
  const [state, setState] = useState<PromotionEditState>({ isLoading: true, errorMessage: "", post: null });

  useEffect(() => {
    let isMounted = true;

    const loadPost = async () => {
      try {
        const post = await fetchPromotionPostById(postId);
        if (isMounted) {
          setState({
            isLoading: false,
            errorMessage: post ? "" : "수정할 게시글을 찾을 수 없습니다.",
            post,
          });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            isLoading: false,
            errorMessage: error instanceof Error ? error.message : "게시글 조회 중 오류가 발생했습니다.",
            post: null,
          });
        }
      }
    };

    setState((prev) => ({ ...prev, isLoading: true, errorMessage: "" }));
    void loadPost();
    return () => {
      isMounted = false;
    };
  }, [postId, refreshKey]);

  if (state.isLoading || !state.post) {
    return <div className="promotion-editor-form"><p className="promotion-detail-paragraph">{state.isLoading ? "게시글을 불러오는 중입니다." : state.errorMessage}</p></div>;
  }

  return (
    <PromotionEditorForm
      key={`${state.post.id}:${refreshKey}`}
      mode="edit"
      postId={state.post.id}
      initialValues={{ title: state.post.title, author: state.post.author, content: state.post.content }}
    />
  );
}
