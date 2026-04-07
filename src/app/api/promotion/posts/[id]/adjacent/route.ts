import { NextResponse } from "next/server";
import { getPromotionAdjacentPosts } from "@/app/promotion/promotionStore";

// 홍보 API: 문자열 id를 양의 정수로 변환
const parseId = (value: string) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// 홍보 API: 상세 화면 이전글/다음글 조회
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await context.params;
  const id = parseId(idParam);
  if (!id) {
    return NextResponse.json({ error: "게시글 번호가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const adjacent = await getPromotionAdjacentPosts(id);
    return NextResponse.json(
      { adjacent },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "인접 게시글 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
