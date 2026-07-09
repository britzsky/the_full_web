import Link from "next/link";

type SiteFooterProps = {
  snap?: boolean;
};

export default function SiteFooter({ snap = false }: SiteFooterProps) {
  return (
    <footer
      className={`${snap ? "snap-start " : ""}py-5 text-center bg-[#f4efe8]`}
    >
      <Link
        href="/privacy_policy"
        className="text-xs text-[#7a6b5a] underline underline-offset-2 hover:text-[#3a3a3a] transition-colors"
      >
        개인정보처리방침
      </Link>
      <p className="mt-2 text-xs text-[#9e8f80]">© 2025 (주)더채움. All rights reserved.</p>
    </footer>
  );
}
