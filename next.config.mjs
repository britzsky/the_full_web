/** @type {import('next').NextConfig} */
const nextConfig = {
  // API 라우트를 유지하면서 빌드 산출물 폴더를 out으로 지정
  distDir: "out",
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "blogthumb.pstatic.net",
      },
    ],
  },
};

export default nextConfig;
