import { Metadata } from "next";
import PageNavigationLink from "@/app/components/Common/PageNavigationLink";
import TheFullLogo from "@/app/components/Common/TheFullLogo";

// 404 페이지 메타데이터 정의
export const metadata: Metadata = {
  // 404 페이지 메타데이터
  title: "(주)더채움 | 404",
};

// 공통 404 화면: 함수 로직
export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-10 text-center">
      <div className="w-full max-w-[560px] rounded-2xl border border-[#e7e2da] bg-white p-8 md:p-12">
        <div className="relative mx-auto h-[58px] w-[210px] md:h-[72px] md:w-[260px]">
          <TheFullLogo
            variant="default"
            fill
            priority
            sizes="260px"
            className="object-contain"
          />
        </div>

        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-[#7a6b5a]">404</p>
        <h1 className="mt-3 text-[26px] font-bold leading-tight !text-[#1f1b18] md:text-[30px]">
          페이지를 찾을 수 없습니다.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6f6a63] md:text-base">
          요청하신 페이지가 없거나 주소가 변경되었습니다.
        </p>

        <PageNavigationLink
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full border border-[#1f1b18] px-6 py-2.5 text-sm font-bold text-[#1f1b18] transition hover:bg-[#1f1b18] hover:text-white"
        >
          메인으로 이동
        </PageNavigationLink>
      </div>
    </main>
  );
}
