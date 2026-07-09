import { NextRequest, NextResponse } from "next/server";

// 백엔드 API 서버 주소 (서버 사이드 전용 환경변수)
const WEB_API_BASE_URL = (process.env.WEB_API_BASE_URL ?? "http://127.0.0.1:8090").replace(/\/+$/, "");

// 인스타그램 피드 캐시 유효 시간 (초) — 피드는 자주 바뀌지 않으므로 5분 캐시
export const revalidate = 300;

// 인스타그램 피드 조회 프록시 라우트
// /api/* 경로는 Nginx가 Spring Boot로 라우팅하므로 /api/ 외부 경로를 사용한다.
// HTTPS 환경에서 브라우저가 HTTP 백엔드를 직접 호출하면 Mixed Content로 차단되므로
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
    // 백엔드 호출도 5분 캐시 — 동일 파라미터 요청은 Next.js 서버가 캐시 응답
    const upstream = await fetch(upstreamUrl, { next: { revalidate: 300 } });
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "Instagram API 연결에 실패했습니다." }, { status: 502 });
  }
}
