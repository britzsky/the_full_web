import { NextRequest, NextResponse } from "next/server";

// 백엔드 API 서버 주소 (서버 사이드 전용 환경변수)
const WEB_API_BASE_URL = (process.env.WEB_API_BASE_URL ?? "http://127.0.0.1:8090").replace(/\/+$/, "");

// 인스타그램 피드 조회 프록시 라우트
// HTTPS 환경에서 브라우저가 HTTP API를 직접 호출하면 Mixed Content로 차단되므로
// Next.js 서버가 대신 백엔드를 호출하고 결과를 브라우저에 전달한다.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // 페이지네이션 파라미터 전달
  const params = new URLSearchParams();
  const limit = searchParams.get("limit");
  const after = searchParams.get("after");
  if (limit) params.set("limit", limit);
  if (after) params.set("after", after);

  const query = params.toString();
  const upstreamUrl = `${WEB_API_BASE_URL}/instagram${query ? `?${query}` : ""}`;

  try {
    const upstream = await fetch(upstreamUrl, { cache: "no-store" });
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "Instagram API 연결에 실패했습니다." }, { status: 502 });
  }
}
