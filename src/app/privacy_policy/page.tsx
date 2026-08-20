import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/app/components/Common/SiteFooter";

export const metadata: Metadata = {
  title: "(주)더채움 | 개인정보처리방침",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF8] text-[#1b140f]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* 뒤로가기 */}
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-1.5 text-sm text-[#7a6b5a] hover:text-[#3a3a3a] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          홈으로 돌아가기
        </Link>

        <h1 className="mb-2 text-2xl font-bold text-[#000000]">개인정보처리방침</h1>
        <p className="mb-12 text-sm text-[#7a6b5a]">시행일: 2026년 06월 01일</p>

        <div className="space-y-10 text-sm leading-[1.9] text-[#3a3a3a]">

          <p>
            (주)더채움(이하 &quot;회사&quot;)은 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와
            관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
          </p>

          {/* 제1조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1b140f]">제1조 개인정보의 처리 목적</h2>
            <p>
              회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는
              이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등
              필요한 조치를 이행할 예정입니다.
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>고객 문의(위탁급식 견적·상담 요청) 접수 및 처리</li>
              <li>문의에 대한 회신 및 상담 결과 안내</li>
            </ul>
          </section>

          {/* 제2조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1b140f]">제2조 처리하는 개인정보 항목</h2>
            <p>회사는 고객 문의 접수를 위해 다음의 개인정보를 수집합니다.</p>
            <div className="mt-3 space-y-3">
              <div>
                <p className="font-medium text-[#1b140f]">필수 항목</p>
                <p className="mt-1 text-[#5a4a3a]">업장명, 담당자 성함, 연락처(전화번호), 이메일 주소</p>
              </div>
              <div>
                <p className="font-medium text-[#1b140f]">선택 항목</p>
                <p className="mt-1 text-[#5a4a3a]">현재 식단가, 희망 식단가, 일 식수, 식사 구분, 업장 구분, 현 위탁사 변경 이유, 문의 제목, 문의 내용</p>
              </div>
              <div>
                <p className="font-medium text-[#1b140f]">자동 수집 정보</p>
                <p className="mt-1 text-[#5a4a3a]">서비스 이용 기록, 접속 로그, 쿠키(카카오 지도 SDK 연동 시 자동 생성)</p>
              </div>
            </div>
          </section>

          {/* 제3조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1b140f]">제3조 개인정보의 처리 및 보유기간</h2>
            <p>
              회사는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보
              보유·이용 기간 내에서 개인정보를 처리·보유합니다.
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>고객 문의 처리 목적: 문의 접수일로부터 <strong>3년</strong></li>
              <li>단, 관계 법령에 의해 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.</li>
            </ul>
          </section>

          {/* 제4조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1b140f]">제4조 개인정보의 제3자 제공</h2>
            <p>
              회사는 정보주체의 개인정보를 제1조(처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의,
              법률의 특별한 규정 등 「개인정보 보호법」 제17조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
            </p>
            <p className="mt-2">현재 회사는 수집한 개인정보를 제3자에게 제공하지 않습니다.</p>
          </section>

          {/* 제5조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1b140f]">제5조 개인정보 처리업무의 위탁</h2>
            <p>회사는 원활한 개인정보 업무 처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#f4efe8]">
                    <th className="border border-[#d2b79a] px-4 py-2 text-left font-semibold">수탁업체</th>
                    <th className="border border-[#d2b79a] px-4 py-2 text-left font-semibold">위탁 업무 내용</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#d2b79a] px-4 py-2">지오유</td>
                    <td className="border border-[#d2b79a] px-4 py-2">이메일 발송</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              회사는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행 목적 외 개인정보 처리 금지,
              기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등
              문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.
            </p>
          </section>

          {/* 제6조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1b140f]">제6조 개인정보의 파기 절차 및 방법</h2>
            <p>
              회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이
              해당 개인정보를 파기합니다.
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li><strong>파기 절차:</strong> 불필요한 개인정보 및 개인정보 파일은 개인정보 보호책임자의 방침에 따라 파기합니다.</li>
              <li><strong>전자적 파일 형태:</strong> 복원이 불가능한 방법으로 영구 삭제합니다.</li>
              <li><strong>종이 문서 형태:</strong> 분쇄기로 분쇄하거나 소각합니다.</li>
            </ul>
          </section>

          {/* 제7조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1b140f]">제7조 정보주체와 법정대리인의 권리·의무 및 행사방법</h2>
            <p>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리 정지 요구</li>
            </ul>
            <p className="mt-3">
              위 권리 행사는 회사에 대해 서면, 전화, 전자우편 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체 없이
              조치하겠습니다. 정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 정정 또는 삭제를
              완료할 때까지 해당 개인정보를 이용하거나 제공하지 않습니다.
            </p>
          </section>

          {/* 제8조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1b140f]">제8조 개인정보의 안전성 확보조치</h2>
            <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li><strong>관리적 조치:</strong> 내부관리계획 수립·시행, 정기적 직원 교육</li>
              <li><strong>기술적 조치:</strong> 개인정보 처리시스템의 접근권한 관리, 보안 프로그램 설치 및 갱신</li>
              <li><strong>물리적 조치:</strong> 전산실, 자료보관실 등의 접근 통제</li>
            </ul>
          </section>

          {/* 제9조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1b140f]">제9조 개인정보 자동 수집 장치의 설치·운영 및 거부</h2>
            <p>
              회사 웹사이트는 카카오 지도 SDK를 연동하여 지도 서비스를 제공합니다. 이 과정에서 카카오 SDK가
              쿠키(Cookie) 및 접속 로그를 자동으로 수집할 수 있습니다.
            </p>
            <p className="mt-2">
              쿠키는 웹사이트 운영에 이용되는 서버가 이용자의 브라우저에 보내는 소량의 정보이며, 이용자의 PC
              컴퓨터 내 하드디스크에 저장됩니다. 이용자는 쿠키 설치에 대한 선택권을 가지고 있으며, 웹 브라우저
              옵션에서 쿠키 허용, 거부 또는 삭제를 설정할 수 있습니다. 다만, 쿠키 설치를 거부할 경우 일부 서비스
              이용에 불편이 있을 수 있습니다.
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>Chrome: 설정 &gt; 개인정보 및 보안 &gt; 쿠키 및 기타 사이트 데이터</li>
              <li>Edge: 설정 &gt; 쿠키 및 사이트 권한</li>
              <li>Safari: 환경설정 &gt; 개인정보 보호</li>
              <li>Firefox: 설정 &gt; 개인정보 및 보안 &gt; 쿠키와 사이트 데이터</li>
            </ul>
          </section>

          {/* 제10조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1b140f]">제10조 개인정보 보호책임자</h2>
            <p>
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만 처리 및
              피해 구제를 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <div className="mt-3 rounded-lg border border-[#d2b79a] bg-[#f9f5f0] px-5 py-4 space-y-1">
              <p><strong>성명:</strong> 손경원</p>
              <p><strong>연락처:</strong> 031-223-7324</p>
              <p><strong>이메일:</strong> kw1@thefull.co.kr</p>
              {/* <p className="text-xs text-[#7a6b5a] mt-1">※ 연락처는 담당 부서로 연결됩니다.</p> */}
            </div>
            <p className="mt-3">
              정보주체는 회사의 서비스(또는 사업)를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만 처리,
              피해 구제 등에 관한 사항을 개인정보 보호책임자에게 문의하실 수 있습니다. 회사는 정보주체의 문의에
              대해 지체 없이 답변 및 처리해드릴 것입니다.
            </p>
            <p className="mt-3">
              회사의 대표자는 개인정보 보호에 관한 최종적인 책임을 지며, 개인정보 보호책임자가 업무를 독립적으로
              수행할 수 있도록 필요한 인력과 예산을 지원합니다.
            </p>
          </section>

          {/* 제11조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1b140f]">제11조 권익침해 구제방법</h2>
            <p>
              정보주체는 개인정보 침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원
              개인정보침해신고센터 등에 분쟁 해결이나 상담 등을 신청할 수 있습니다. 이 밖에 기타 개인정보 침해의
              신고 및 상담에 대해서는 아래의 기관에 문의하시기 바랍니다.
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-2">
              <li>
                개인정보분쟁조정위원회: (국번 없이) 1833-6972
                <span className="ml-2 text-[#7a6b5a]">(www.kopico.go.kr)</span>
              </li>
              <li>
                개인정보침해신고센터: (국번 없이) 118
                <span className="ml-2 text-[#7a6b5a]">(privacy.kisa.or.kr)</span>
              </li>
              <li>
                대검찰청: (국번 없이) 1301
                <span className="ml-2 text-[#7a6b5a]">(www.spo.go.kr)</span>
              </li>
              <li>
                경찰청: (국번 없이) 182
                <span className="ml-2 text-[#7a6b5a]">(ecrm.cyber.go.kr)</span>
              </li>
            </ul>
          </section>

          {/* 제12조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1b140f]">제12조 개인정보 유출 등에 대한 조치</h2>
            <p>
              회사는 개인정보의 분실·도난·유출(누설)·위조·변조·훼손(이하 &quot;유출등&quot;)이 발생하였거나 발생한
              것으로 의심되는 경우, 그 사실을 알게 된 즉시 다음 각 호의 사항을 지체 없이 해당 정보주체에게 알리고
              피해 최소화를 위한 필요한 조치를 취합니다.
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>유출 등이 된 개인정보의 항목</li>
              <li>유출 등이 발생한 시점과 그 경위</li>
              <li>유출 등으로 인해 발생할 수 있는 피해를 최소화하기 위하여 정보주체가 할 수 있는 방법 등에 관한 정보</li>
              <li>회사의 대응조치 및 피해 구제절차</li>
              <li>정보주체에게 피해가 발생한 경우 신고 등을 접수할 수 있는 담당부서 및 연락처</li>
              <li>손해배상 청구 및 개인정보 분쟁조정 신청 방법</li>
            </ul>
            <p className="mt-3">
              통지할 사항을 즉시 알 수 없는 경우에는 그 사항이 확인되는 대로 지체 없이 알리며, 유출등의 가능성을
              인지한 시점부터 정당한 사유 없이 통지를 지연하지 않습니다.
            </p>
          </section>

          {/* 제13조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1b140f]">제13조 개인정보처리방침의 변경</h2>
            <p>
              이 개인정보처리방침은 2026년 06월 01일부터 적용됩니다. 내용의 추가, 삭제 및 정정이 있을 경우에는
              변경사항 시행일의 7일 전부터 홈페이지를 통해 고지할 것입니다.
            </p>
          </section>

        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
