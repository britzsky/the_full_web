"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Icon } from "@iconify/react";
import ActionFeedbackModal from "@/app/components/Common/ActionFeedbackModal";
import { toPublicWebApiUrl } from "@/app/lib/publicWebApi";

// 인스타그램 간편문의 폼 입력값 모델(노출 항목만 보유)
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

// input/textarea/select 공용 변경 이벤트 타입
type ContactFieldEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

const PHONE_PREFIX_OPTIONS = ["010", "011", "016", "017", "018", "019"];
const EMAIL_DOMAIN_DIRECT = "DIRECT_INPUT";
const EMAIL_DOMAIN_OPTIONS = [
  "naver.com",
  "gmail.com",
  "daum.net",
  "hanmail.net",
  "nate.com",
];

const PHONE_NUMBER_PATTERN = /^\d{3}-\d{4}-\d{4}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  // 폼 필드 값 변경 핸들러
  const handleValueChange = (event: ContactFieldEvent) => {
    const { name, value } = event.target;
    if (name === "phoneMiddle" || name === "phoneLast") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 4);
      setFormValues((prev) => ({ ...prev, [name]: digitsOnly }));
      return;
    }
    if (name === "emailLocalPart" || name === "emailDomain") {
      const normalized = value.replace(/\s+/g, "");
      setFormValues((prev) => ({ ...prev, [name]: normalized }));
      return;
    }
    if (name === "emailDomainOption") {
      setFormValues((prev) => ({
        ...prev,
        emailDomainOption: value,
        emailDomain: value === EMAIL_DOMAIN_DIRECT ? "" : value,
      }));
      return;
    }
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  // 문의 제출 API 호출 핸들러
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (feedbackModal.open || isSubmitting) {
      return;
    }

    const formElement = event.currentTarget;
    // 인스타그램 간편문의 화면: 필수 항목 누락 시 빨간 테두리 검증 상태를 활성화
    if (!formElement.checkValidity()) {
      setShowValidationErrors(true);
      formElement.reportValidity();
      return;
    }

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
      // 인스타그램 간편문의 화면: response 정의
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
          source: "instagram-simple",
          // ERP 알림 연동 시 이 식별자를 기준으로 후속 분기 가능
          erpSyncTarget: "ERP_INQUIRY_V1",
          // 화면에 노출하지 않는 항목(식단가/식수/구분/제목 등)은 DB가 nullable로 되어 있어 보내지 않으면 NULL로 저장됨
        }),
      });

      // 인스타그램 간편문의 화면: payload 정의
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

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
    <form
      className={`contact-ig-form${showValidationErrors ? " contact-ig-form-show-validation" : ""}`}
      onSubmit={handleSubmit}
      suppressHydrationWarning
    >
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
