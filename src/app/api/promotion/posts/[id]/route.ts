import { NextResponse } from "next/server";
import {
  deletePromotionPost,
  getPromotionPostById,
  updatePromotionPost,
} from "@/app/promotion/promotionStore";
import type { PromotionPostUpdate } from "@/app/promotion/types";

// 홍보 API: normalizeText 정의
const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// 홍보 API: parseId 정의
const parseId = (value: string) => {
// 홍보 API: id 정의
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// 홍보 API: 데이터 조회 로직
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await context.params;
// 홍보 API: id 정의
  const id = parseId(idParam);
  if (!id) {
    return NextResponse.json({ error: "게시글 번호가 올바르지 않습니다." }, { status: 400 });
  }

// 홍보 API: 데이터 저장 로직
  const post = await getPromotionPostById(id);
  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(
    { post },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

// 홍보 API: 데이터 수정 로직
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await context.params;
// 홍보 API: id 정의
  const id = parseId(idParam);
  if (!id) {
    return NextResponse.json({ error: "게시글 번호가 올바르지 않습니다." }, { status: 400 });
  }

  let body: PromotionPostUpdate;
  try {
    body = (await request.json()) as PromotionPostUpdate;
  } catch {
    return NextResponse.json({ error: "요청 본문(JSON) 형식이 올바르지 않습니다." }, { status: 400 });
  }

// 홍보 API: payload 정의
  const payload: PromotionPostUpdate = {
    title: body.title === undefined ? undefined : normalizeText(body.title),
    content: body.content === undefined ? undefined : normalizeText(body.content),
    author: body.author === undefined ? undefined : normalizeText(body.author),
  };

  if (payload.title !== undefined && !payload.title) {
    return NextResponse.json({ error: "제목을 입력해 주세요." }, { status: 400 });
  }
  if (payload.content !== undefined && !payload.content) {
    return NextResponse.json({ error: "내용을 입력해 주세요." }, { status: 400 });
  }

// 홍보 API: 데이터 수정 로직
  const updated = await updatePromotionPost(id, payload);
  if (!updated) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ message: "게시글이 수정되었습니다.", post: updated });
}

// 홍보 API: 데이터 삭제 로직
export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await context.params;
// 홍보 API: id 정의
  const id = parseId(idParam);
  if (!id) {
    return NextResponse.json({ error: "게시글 번호가 올바르지 않습니다." }, { status: 400 });
  }

// 홍보 API: 데이터 삭제 로직
  const deleted = await deletePromotionPost(id);
  if (!deleted) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ message: "게시글이 삭제되었습니다." });
}
