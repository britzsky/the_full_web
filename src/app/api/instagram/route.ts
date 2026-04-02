import { NextResponse } from "next/server";

// 인스타그램 API: 데이터 조회 로직
export async function GET() {
// 인스타그램 API: accessToken 정의
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Missing Instagram access token." },
      { status: 500 }
    );
  }

// 인스타그램 API: 상태값
  let meData: { id: string; username?: string; media_count?: number; profile_picture_url?: string } | null = null;
  let meErrorStatus = 500;
  let meErrorText = "";

  const meFieldsCandidates = [
    "id,username,media_count,profile_picture_url",
    "id,username,media_count",
  ];

  for (const fields of meFieldsCandidates) {
    const meUrl =
      "https://graph.instagram.com/me" +
      `?fields=${fields}` +
      `&access_token=${accessToken}`;
    const meResponse = await fetch(meUrl, { cache: "no-store" });

    if (meResponse.ok) {
      meData = await meResponse.json();
      break;
    }

    meErrorStatus = meResponse.status;
    meErrorText = await meResponse.text();
  }

  if (!meData) {
    return NextResponse.json(
      { error: "Failed to fetch Instagram user.", details: meErrorText },
      { status: meErrorStatus }
    );
  }

// 인스타그램 API: mediaUrl 정의
  const mediaUrl =
    `https://graph.instagram.com/${meData.id}/media` +
    "?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp" +
    "&limit=8" +
    `&access_token=${accessToken}`;

// 인스타그램 API: mediaResponse 정의
  const mediaResponse = await fetch(mediaUrl, { cache: "no-store" });
  if (!mediaResponse.ok) {
// 인스타그램 API: errorText 정의
    const errorText = await mediaResponse.text();
    return NextResponse.json(
      { error: "Failed to fetch Instagram media.", details: errorText },
      { status: mediaResponse.status }
    );
  }

// 인스타그램 API: mediaData 정의
  const mediaData = await mediaResponse.json();
  return NextResponse.json({ user: meData, data: mediaData.data ?? [] });
}

