/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config, { dev }) => {
    if (dev) {
      // 숨김 상위 폴더 환경에서도 개발 중 파일 변경을 안정적으로 감지합니다.
      config.watchOptions = {
        ...(config.watchOptions ?? {}),
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/node_modules/**", "**/.next/**"],
      };
    } else {
      // Tailwind v4 opacity modifier(bg-black/55 등)가 생성하는 rgb(X Y Z / alpha) 구문을
      // cssnano-simple이 파싱하지 못해 빌드가 실패하므로 CSS minimizer를 비활성화합니다.
      config.optimization.minimizer = config.optimization.minimizer.filter(
        (m) => m.__next_css_remove !== true
      );
    }

    return config;
  },
  images: {
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "blogthumb.pstatic.net",
      },
    ],
  },
};

export default nextConfig;
