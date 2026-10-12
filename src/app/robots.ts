import type { MetadataRoute } from "next";

// 검색엔진 수집 규칙(/robots.txt): 공개 페이지는 허용하고 관리·작성 화면과 내부 API는 수집에서 제외
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/contact-api/", "/instagram-proxy/", "/contact/manage", "/promotion/write", "/promotion/*/edit"],
    },
    sitemap: "https://thefull.co.kr/sitemap.xml",
  };
}
