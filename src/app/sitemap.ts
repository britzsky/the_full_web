import type { MetadataRoute } from "next";

// 운영 공개 웹 도메인
const SITE_URL = "https://thefull.co.kr";

// 검색엔진에 제출하는 공개 페이지 목록(/sitemap.xml)
// ponytail: 홍보 게시글 상세(/promotion/[id])는 제외, 개별 색인이 필요하면 API로 글 목록을 받아 추가
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/company_profile", "/business_area", "/catering_service", "/promotion", "/social", "/recruit", "/contact", "/privacy_policy", "/terms"];

  return paths.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
