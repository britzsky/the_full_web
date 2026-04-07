import { NextResponse } from "next/server";

type InstagramGraphUser = {
  id: string;
  username?: string;
  media_count?: number;
  profile_picture_url?: string;
};

type InstagramGraphMediaChild = {
  id: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
};

type InstagramGraphMediaItem = {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  children?: {
    data?: InstagramGraphMediaChild[];
  };
};

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
  let meData: InstagramGraphUser | null = null;
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
    "?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{id,media_type,media_url,thumbnail_url}" +
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
  const mediaData = (await mediaResponse.json()) as { data?: InstagramGraphMediaItem[] };

  // 캐러셀 게시물의 자식 미디어를 프론트 모달에서 그대로 사용할 수 있게 정규화
  const normalizedMedia = (Array.isArray(mediaData.data) ? mediaData.data : []).map((item) => ({
    id: item.id,
    caption: item.caption,
    media_type: item.media_type,
    media_url: item.media_url,
    thumbnail_url: item.thumbnail_url,
    permalink: item.permalink,
    timestamp: item.timestamp,
    children: (Array.isArray(item.children?.data) ? item.children.data : [])
      .filter((child) => Boolean(child.media_url))
      .map((child) => ({
        id: child.id,
        media_type: child.media_type,
        media_url: child.media_url,
        thumbnail_url: child.thumbnail_url,
      })),
  }));

  return NextResponse.json({ user: meData, data: normalizedMedia });
}
