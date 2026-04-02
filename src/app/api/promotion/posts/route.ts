import { NextResponse } from "next/server";
import { createPromotionPost, listPromotionPosts } from "@/app/promotion/promotionStore";
import type { PromotionPostInput, PromotionSearchField } from "@/app/promotion/types";

// 홍보 API: normalizeText 정의
const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// 홍보 API: toField 정의
const toField = (value: string): PromotionSearchField => {
  if (value === "content" || value === "all") {
    return value;
  }
  return "title";
};

// 홍보 API: 데이터 조회 로직
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
// 홍보 API: query 정의
  const query = normalizeText(searchParams.get("q"));
// 홍보 API: field 정의
  const field = toField(normalizeText(searchParams.get("field")));

// 홍보 API: 데이터 저장 로직
  const posts = await listPromotionPosts({ query, field });
  return NextResponse.json(
    { posts },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

// 홍보 API: 데이터 저장 로직
export async function POST(request: Request) {
  let body: Partial<PromotionPostInput>;

  try {
    body = (await request.json()) as Partial<PromotionPostInput>;
  } catch {
    return NextResponse.json({ error: "요청 본문(JSON) 형식이 올바르지 않습니다." }, { status: 400 });
  }

// 홍보 API: title 정의
  const title = normalizeText(body.title);
// 홍보 API: content 정의
  const content = normalizeText(body.content);
  if (!title || !content) {
    return NextResponse.json({ error: "제목과 내용을 입력해 주세요." }, { status: 400 });
  }

  try {
// 홍보 API: 데이터 저장 로직
    const post = await createPromotionPost({
      title,
      content,
      author: normalizeText(body.author) || "더채움",
    });

    return NextResponse.json({ message: "게시글이 등록되었습니다.", post }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "게시글 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
