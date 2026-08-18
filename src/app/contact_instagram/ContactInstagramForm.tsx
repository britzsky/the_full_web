"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Icon } from "@iconify/react";
import ActionFeedbackModal from "@/app/components/Common/ActionFeedbackModal";
import { toPublicWebApiUrl } from "@/app/lib/publicWebApi";

// 인스타그램 간편문의 폼 입력값 모델
// 기존 /contact 전체 문의폼(ContactInquiryForm)과 달리, 화면에 실제로 노출하는 5개 항목만 상태로 들고 있다.
// - 연락처는 "010" 접두사 선택 + 중간 4자리 + 끝 4자리를 따로 관리하다가 제출 시 하이픈으로 합쳐서 보낸다.
// - 이메일도 아이디/도메인을 따로 관리하다가 제출 시 "@"로 합친다.
type ContactInstagramFormValues = {
  businessName: string;
  managerName: string;
  phonePrefix: string;
  phoneMiddle: string;
  phoneLast: string;
  emailLocalPart: string;
  emailDomain: string;
  emailDomainOption: string;
  inquiryContent: string;
};

// 제출 결과 모달 상태 모델
type FeedbackModalState = {
  open: boolean;
  tone: "success" | "error";
  heading: string;
  message: string;
  caption: string;
};

// input/textarea/select 공용 변경 이벤트 타입 (하나의 핸들러로 세 종류 요소를 모두 처리하기 위한 유니온)
type ContactFieldEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

// 연락처 앞자리 select에 표시할 통신사/번호대 목록
const PHONE_PREFIX_OPTIONS = ["010", "011", "016", "017", "018", "019"];
// 이메일 도메인 select에서 "직접입력"을 선택했을 때의 내부 식별값(실제 도메인 문자열이 아님)
const EMAIL_DOMAIN_DIRECT = "DIRECT_INPUT";
// 이메일 도메인 select 옵션 목록(전체 폼보다 자주 쓰는 것 위주로 축약)
const EMAIL_DOMAIN_OPTIONS = [
  "naver.com",
  "gmail.com",
  "daum.net",
  "hanmail.net",
  "nate.com",
];

// 연락처 최종 조합값 검증용 정규식: "010-1234-5678"처럼 3-4-4자리 숫자+하이픈 형식만 허용
const PHONE_NUMBER_PATTERN = /^\d{3}-\d{4}-\d{4}$/;
// 이메일 최종 조합값 검증용 정규식: "아이디@도메인.최상위도메인" 형태의 최소 형식만 확인
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 제출 시각을 서버가 기대하는 "yyyy-MM-dd HH:mm:ss" 형식의 KST(한국시간) 문자열로 변환
// (브라우저의 로컬 타임존과 무관하게 항상 KST 기준으로 기록되도록 UTC 시각에 9시간을 더해 계산)
const toKstDateTimeString = () => {
  const now = new Date();
  const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = String(kstDate.getUTCFullYear());
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kstDate.getUTCDate()).padStart(2, "0");
  const hour = String(kstDate.getUTCHours()).padStart(2, "0");
  const minute = String(kstDate.getUTCMinutes()).padStart(2, "0");
  const second = String(kstDate.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

// 인스타그램 간편문의 폼 초기값
const initialValues: ContactInstagramFormValues = {
  businessName: "",
  managerName: "",
  phonePrefix: "010",
  phoneMiddle: "",
  phoneLast: "",
  emailLocalPart: "",
  emailDomain: "",
  emailDomainOption: EMAIL_DOMAIN_DIRECT,
  inquiryContent: "",
};

// 인스타그램 간편문의 제출 폼 컴포넌트
export default function ContactInstagramForm() {
  const [formValues, setFormValues] = useState<ContactInstagramFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>({
    open: false,
    tone: "success",
    heading: "",
    message: "",
    caption: "",
  });

  // 폼 필드 값 변경 핸들러(모든 input/select/textarea가 이 함수 하나를 공유)
  const handleValueChange = (event: ContactFieldEvent) => {
    const { name, value } = event.target;
    // 연락처 중간/끝 4자리: 숫자가 아닌 문자는 제거하고 최대 4자리까지만 허용(붙여넣기 대비)
    if (name === "phoneMiddle" || name === "phoneLast") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 4);
      setFormValues((prev) => ({ ...prev, [name]: digitsOnly }));
      return;
    }
    // 이메일 아이디/도메인 직접입력칸: 실수로 들어간 공백만 제거(대소문자 등은 그대로 유지)
    if (name === "emailLocalPart" || name === "emailDomain") {
      const normalized = value.replace(/\s+/g, "");
      setFormValues((prev) => ({ ...prev, [name]: normalized }));
      return;
    }
    // 이메일 도메인 select: 목록에서 실제 도메인을 고르면 도메인 입력칸에 바로 반영(그리고 readOnly 처리),
    // "직접입력"을 고르면 도메인 입력칸을 비워서 사용자가 직접 타이핑할 수 있게 한다.
    if (name === "emailDomainOption") {
      setFormValues((prev) => ({
        ...prev,
        emailDomainOption: value,
        emailDomain: value === EMAIL_DOMAIN_DIRECT ? "" : value,
      }));
      return;
    }
    // 그 외(업장명/담당자 성함/연락처 앞자리/문의내용 등) 단순 텍스트 필드는 값 그대로 반영
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  // 문의 제출 API 호출 핸들러
  // 흐름: (1) HTML required 검증 → (2) 연락처/이메일 조합값 형식 검증 → (3) /contact/manage POST → (4) 결과 모달 표시
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // 이미 제출 중이거나 결과 모달이 떠 있는 상태에서 중복 제출되는 것을 방지
    if (feedbackModal.open || isSubmitting) {
      return;
    }

    const formElement = event.currentTarget;
    // 1차 검증: 5개 항목의 HTML required 속성 기준으로 브라우저 기본 검증을 먼저 통과
    // 실패 시 CSS의 contact-ig-form-show-validation 클래스가 붙어 미입력 칸에 빨간 테두리가 표시됨
    if (!formElement.checkValidity()) {
      setShowValidationErrors(true);
      formElement.reportValidity();
      return;
    }

    // 2차 검증: 연락처(앞자리+중간4자리+끝4자리)와 이메일(아이디+도메인)을 하나의 문자열로 합친 뒤
    // 서버가 기대하는 정확한 형식인지 정규식으로 재확인한다(select/입력칸을 나눠 받다 보니 조합 결과가
    // 비어있거나 형식이 어긋날 수 있어 HTML required만으로는 걸러지지 않는 경우를 방지).
    const phoneNumber = `${formValues.phonePrefix}-${formValues.phoneMiddle}-${formValues.phoneLast}`;
    const email = `${formValues.emailLocalPart}@${formValues.emailDomain}`;

    if (!PHONE_NUMBER_PATTERN.test(phoneNumber)) {
      setFeedbackModal({
        open: true,
        tone: "error",
        heading: "입력 확인",
        message: "연락처는 000-0000-0000 형식으로 입력해 주세요.",
        caption: "필수 항목을 확인한 뒤 다시 시도해 주세요.",
      });
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      setFeedbackModal({
        open: true,
        tone: "error",
        heading: "입력 확인",
        message: "이메일 형식을 확인해 주세요.",
        caption: "필수 항목을 확인한 뒤 다시 시도해 주세요.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 문의 등록 API 호출: 기존 /contact 전체 문의폼과 동일한 엔드포인트(/contact/manage)를 그대로 사용한다.
      // 화면에 없는 항목(식단가/희망식단가/일 식수/식사구분/업장구분/제목 등)은 아예 요청 본문에 포함하지 않는데,
      // 서버에서 자동으로 NULL로 저장된다. not null에서 null로 변경(2026-08-18)
      const response = await fetch(toPublicWebApiUrl("/contact/manage"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: formValues.businessName,
          managerName: formValues.managerName,
          phoneNumber,
          email,
          inquiryContent: formValues.inquiryContent.trim(),
          submittedAt: toKstDateTimeString(),
          // 문의관리 화면에서 인스타그램 간편문의로 들어온 건을 구분할 수 있도록 별도 source 값을 부여
          source: "instagram-simple",
          // ERP 알림 연동 시 이 식별자를 기준으로 후속 분기 가능
          erpSyncTarget: "ERP_INQUIRY_V1",
        }),
      });

      // 서버 응답 본문 파싱(JSON이 아니거나 비어 있어도 에러 없이 빈 객체로 처리)
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      // HTTP 상태 코드가 실패(4xx/5xx)면 서버가 내려준 에러 메시지를 그대로 예외로 던져서 catch에서 모달로 보여준다.
      if (!response.ok) {
        throw new Error(payload.error ?? "문의 접수 중 오류가 발생했습니다.");
      }

      setFormValues(initialValues);
      setShowValidationErrors(false);
      setFeedbackModal({
        open: true,
        tone: "success",
        heading: "제출 완료",
        message: payload.message ?? "문의가 정상적으로 접수되었습니다.",
        caption: "담당자가 순차적으로 연락드립니다.",
      });
    } catch (error) {
      // 인스타그램 간편문의 화면: 기본값 또는 대체 데이터
      const fallbackMessage = "문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
      setFeedbackModal({
        open: true,
        tone: "error",
        heading: "제출 실패",
        message: error instanceof Error ? error.message : fallbackMessage,
        caption: "잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 인스타그램 간편문의 화면: 결과 모달 확인 버튼 이벤트 처리
  const handleFeedbackConfirm = () => {
    setFeedbackModal((prev) => ({ ...prev, open: false }));
  };

  return (
    // 폼 전체: 5개 항목(업장명·담당자 성함·연락처·이메일·문의내용)을 세로로 나열하는 카드형 폼.
    <form
      className={`contact-ig-form${showValidationErrors ? " contact-ig-form-show-validation" : ""}`}
      onSubmit={handleSubmit}
      suppressHydrationWarning
    >
      {/* 업장명: 가장 단순한 형태의 행 — 라벨(아이콘+텍스트+필수표시) + 일반 텍스트 input */}
      <div className="contact-ig-row">
        <label className="contact-ig-label" htmlFor="ig-businessName">
          <Icon icon="mdi:office-building-outline" width="18" height="18" className="contact-ig-label-icon" />
          업장명
          <span className="contact-ig-required" aria-hidden="true">*</span>
        </label>
        <input
          id="ig-businessName"
          name="businessName"
          value={formValues.businessName}
          onChange={handleValueChange}
          className="contact-ig-field"
          placeholder="업장명을 입력해 주세요."
          required
        />
      </div>

      {/* 담당자 성함: 업장명과 동일한 단순 텍스트 행 구조 */}
      <div className="contact-ig-row">
        <label className="contact-ig-label" htmlFor="ig-managerName">
          <Icon icon="mdi:account-outline" width="18" height="18" className="contact-ig-label-icon" />
          담당자 성함
          <span className="contact-ig-required" aria-hidden="true">*</span>
        </label>
        <input
          id="ig-managerName"
          name="managerName"
          value={formValues.managerName}
          onChange={handleValueChange}
          className="contact-ig-field"
          placeholder="담당자 성함을 입력해 주세요."
          required
        />
      </div>

      {/* 연락처: 010 등 접두사 select + 중간 4자리 + 끝 4자리, 3칸을 하이픈으로 나눠서 입력을 받음.
          제출 시 handleSubmit에서 "접두사-중간-끝" 형태로 합쳐서 서버로 송신. */}
      <div className="contact-ig-row">
        <label className="contact-ig-label" htmlFor="ig-phonePrefix">
          <Icon icon="mdi:phone-outline" width="18" height="18" className="contact-ig-label-icon" />
          연락처
          <span className="contact-ig-required" aria-hidden="true">*</span>
        </label>
        <div className="contact-ig-phone-composite">
          <select
            id="ig-phonePrefix"
            name="phonePrefix"
            value={formValues.phonePrefix}
            onChange={handleValueChange}
            className="contact-ig-field contact-ig-phone-prefix"
            required
          >
            {PHONE_PREFIX_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="contact-ig-divider-symbol">-</span>
          <input
            id="ig-phoneMiddle"
            name="phoneMiddle"
            value={formValues.phoneMiddle}
            onChange={handleValueChange}
            className="contact-ig-field contact-ig-phone-part"
            inputMode="numeric"
            maxLength={4}
            required
          />
          <span className="contact-ig-divider-symbol">-</span>
          <input
            id="ig-phoneLast"
            name="phoneLast"
            value={formValues.phoneLast}
            onChange={handleValueChange}
            className="contact-ig-field contact-ig-phone-part"
            inputMode="numeric"
            maxLength={4}
            required
          />
        </div>
      </div>

      {/* 이메일: 아이디 입력칸 + "@" + 도메인 입력칸 + 도메인 select 3단 구성.
          select에서 실제 도메인(naver.com 등)을 고르면 도메인 입력칸은 readOnly로 잠기고 값이 자동 채워지며,
          "직접입력"을 고르면 다시 편집 가능한 빈 칸으로 back(handleValueChange 참고). */}
      <div className="contact-ig-row">
        <label className="contact-ig-label" htmlFor="ig-emailLocalPart">
          <Icon icon="mdi:email-outline" width="18" height="18" className="contact-ig-label-icon" />
          이메일
          <span className="contact-ig-required" aria-hidden="true">*</span>
        </label>
        <div className="contact-ig-email-composite">
          <input
            id="ig-emailLocalPart"
            name="emailLocalPart"
            value={formValues.emailLocalPart}
            onChange={handleValueChange}
            className="contact-ig-field"
            required
          />
          <span className="contact-ig-divider-symbol">@</span>
          <input
            id="ig-emailDomain"
            name="emailDomain"
            value={formValues.emailDomain}
            onChange={handleValueChange}
            className="contact-ig-field"
            readOnly={formValues.emailDomainOption !== EMAIL_DOMAIN_DIRECT}
            required
          />
          <select
            id="ig-emailDomainOption"
            name="emailDomainOption"
            value={formValues.emailDomainOption}
            onChange={handleValueChange}
            className="contact-ig-field contact-ig-email-domain-select"
          >
            <option value={EMAIL_DOMAIN_DIRECT}>직접입력</option>
            {EMAIL_DOMAIN_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 문의 내용: 기존 전체 문의폼은 CKEditor(리치 텍스트 에디터)를 쓰지만, 여기서는 순수 textarea로 
          그래서 별도 HTML 변환 없이 trim()만 해서 전송 */}
      <div className="contact-ig-block">
        <label className="contact-ig-label" htmlFor="ig-inquiryContent">
          <Icon icon="mdi:text-box-outline" width="18" height="18" className="contact-ig-label-icon" />
          문의 내용
          <span className="contact-ig-required" aria-hidden="true">*</span>
        </label>
        <textarea
          id="ig-inquiryContent"
          name="inquiryContent"
          value={formValues.inquiryContent}
          onChange={handleValueChange}
          className="contact-ig-textarea"
          placeholder="문의하실 내용을 입력해 주세요."
          required
        />
      </div>

      {/* 제출 영역: 필수 안내 문구 + 개인정보처리방침 동의 문구 + 제출 버튼.
          버튼은 이미 제출 중이거나(isSubmitting) 결과 모달이 떠 있는 동안(feedbackModal.open)
          비활성화되어 중복 클릭으로 같은 문의가 두 번 등록되는 것을 막는다. */}
      <div className="contact-ig-actions">
        <p className="contact-ig-required-notice">
          <span className="contact-ig-required" aria-hidden="true">*</span> 표시는 필수 항목입니다.
        </p>
        <p className="contact-ig-privacy-notice">
          제출 시{" "}
          <a href="/privacy_policy" target="_blank" rel="noreferrer" className="contact-ig-privacy-link">
            개인정보처리방침
          </a>
          에 동의하는 것으로 간주됩니다.
        </p>
        <button type="submit" className="contact-ig-submit" disabled={isSubmitting || feedbackModal.open}>
          {isSubmitting ? "문의중..." : "문의하기"}
        </button>
      </div>

      {/* 제출 성공/실패 결과를 알려주는 공통 모달(다른 화면들과 동일한 컴포넌트를 재사용).
          feedbackModal 상태값에 따라 성공(초록)/실패(빨강) 톤과 문구가 바뀌고,
          확인 버튼을 누르면 handleFeedbackConfirm이 open만 false로 되돌린다. */}
      <ActionFeedbackModal
        open={feedbackModal.open}
        tone={feedbackModal.tone}
        heading={feedbackModal.heading}
        message={feedbackModal.message}
        caption={feedbackModal.caption}
        onConfirm={handleFeedbackConfirm}
      />
    </form>
  );
}
