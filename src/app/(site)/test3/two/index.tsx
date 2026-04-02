import Link from "next/link";

// test3 two 페이지 컴포넌트
const Page = () => {
  return (
    <>
      {/* two 페이지 전체 레이아웃 클래스 */}
    <main className="flex min-h-screen items-center justify-center bg-[#f3eed4] px-6 text-center text-[#1f1b18]">
      <div className="max-w-xl">
        <p className="text-xs uppercase tracking-[0.35em] text-[#7a6b5a]">test3 / two</p>
        <h1 className="mt-4 text-3xl font-display text-[#7a6b5a]">test3-2</h1>
        <p className="mt-6 text-sm leading-relaxed text-[#7a6b5a]">
          test3의 서브 페이지입니다.
        </p>
        <Link
          href="/test3/one"
          className="mt-8 inline-flex border border-[#b6a999] px-6 py-2 text-xs uppercase tracking-[0.3em] text-[#7a6b5a] transition hover:bg-[#f1e8d7]"
        >
          돌아가기
        </Link>
      </div>
    </main>
    </>
  );
};

export default Page;

