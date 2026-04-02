"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import ActionFeedbackModal from "@/app/components/Common/ActionFeedbackModal";

// 고객문의 폼 입력값 모델
type ContactInquiryFormValues = {
  businessName: string;
  managerName: string;
  phonePrefix: string;
  phoneMiddle: string;
  phoneLast: string;
  emailLocalPart: string;
  emailDomain: string;
  emailDomainOption: string;
  currentMealPrice: string;
  desiredMealPrice: string;
  dailyMealCount: string;
  mealType: string;
  businessType: string;
  switchingReason: string;
  title: string;
  inquiryContent: string;
};

// 고객문의 제출 결과 모달 상태 모델
type FeedbackModalState = {
  open: boolean;
  tone: "success" | "error";
  heading: string;
  message: string;
  caption: string;
};

// input/select/textarea 공용 변경 이벤트 타입
type ContactFieldEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

const PHONE_PREFIX_OPTIONS = ["010", "011", "016", "017", "018", "019"];
const EMAIL_DOMAIN_DIRECT = "DIRECT_INPUT";
const EMAIL_DOMAIN_OPTIONS = [
  "naver.com",
  "gmail.com",
  "daum.net",
  "hanmail.net",
  "hotmail.com",
  "hanmir.com",
  "dreamwiz.com",
  "korea.com",
  "netian.com",
  "nate.com",
  "empal.com",
  "chollian.net",
  "paran.com",
  "orgio.net",
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

// 고객문의 폼 초기값
const initialValues: ContactInquiryFormValues = {
  businessName: "",
  managerName: "",
  phonePrefix: "010",
  phoneMiddle: "",
  phoneLast: "",
  emailLocalPart: "",
  emailDomain: "",
  emailDomainOption: EMAIL_DOMAIN_DIRECT,
  currentMealPrice: "",
  desiredMealPrice: "",
  dailyMealCount: "",
  mealType: "",
  businessType: "",
  switchingReason: "",
  title: "",
  inquiryContent: "",
};

// 고객문의 제출 폼 컴포넌트
export default function ContactInquiryForm() {
  const [formValues, setFormValues] = useState<ContactInquiryFormValues>(initialValues);
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
    // 고객문의 화면: 필수 항목 누락 시 빨간 테두리 검증 상태를 활성화
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
// 고객문의 화면: response 정의
      const response = await fetch("/api/contact/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: formValues.businessName,
          managerName: formValues.managerName,
          phoneNumber,
          email,
          currentMealPrice: formValues.currentMealPrice,
          desiredMealPrice: formValues.desiredMealPrice,
          dailyMealCount: formValues.dailyMealCount,
          mealType: formValues.mealType,
          businessType: formValues.businessType,
          switchingReason: formValues.switchingReason,
          title: formValues.title,
          inquiryContent: formValues.inquiryContent,
          submittedAt: toKstDateTimeString(),
          source: "contact-page",
          // ERP 알림 연동 시 이 식별자를 기준으로 후속 분기 가능
          erpSyncTarget: "ERP_INQUIRY_V1",
        }),
      });

// 고객문의 화면: payload 정의
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
// 고객문의 화면: 기본값 또는 대체 데이터
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

  // 고객문의 화면: 결과 모달 확인 버튼 이벤트 처리
  const handleFeedbackConfirm = () => {
    setFeedbackModal((prev) => ({ ...prev, open: false }));
  };

  return (
    <form
      className={`contact-inquiry-form${showValidationErrors ? " contact-inquiry-form-show-validation" : ""}`}
      onSubmit={handleSubmit}
    >
      {/* 기본 문의 항목(2열 그리드) */}
      <div className="contact-form-grid">
        <div className="contact-form-row">
          <label className="contact-form-label" htmlFor="businessName">
            업장명
          </label>
          <input
            id="businessName"
            name="businessName"
            value={formValues.businessName}
            onChange={handleValueChange}
            className="contact-form-field"
            required
          />
        </div>

        <div className="contact-form-row">
          <label className="contact-form-label" htmlFor="managerName">
            담당자 성함
          </label>
          <input
            id="managerName"
            name="managerName"
            value={formValues.managerName}
            onChange={handleValueChange}
            className="contact-form-field"
            required
          />
        </div>

        <div className="contact-form-row">
          <label className="contact-form-label" htmlFor="phonePrefix">
            연락처
          </label>
          <div className="contact-form-phone-composite">
            <select
              id="phonePrefix"
              name="phonePrefix"
              value={formValues.phonePrefix}
              onChange={handleValueChange}
              className="contact-form-field contact-form-phone-prefix"
              required
            >
              {PHONE_PREFIX_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="contact-form-divider-symbol">-</span>
            <input
              id="phoneMiddle"
              name="phoneMiddle"
              value={formValues.phoneMiddle}
              onChange={handleValueChange}
              className="contact-form-field contact-form-phone-part"
              inputMode="numeric"
              maxLength={4}
              required
            />
            <span className="contact-form-divider-symbol">-</span>
            <input
              id="phoneLast"
              name="phoneLast"
              value={formValues.phoneLast}
              onChange={handleValueChange}
              className="contact-form-field contact-form-phone-part"
              inputMode="numeric"
              maxLength={4}
              required
            />
          </div>
        </div>

        <div className="contact-form-row">
          <label className="contact-form-label" htmlFor="emailLocalPart">
            이메일
          </label>
          <div className="contact-form-email-composite">
            <input
              id="emailLocalPart"
              name="emailLocalPart"
              value={formValues.emailLocalPart}
              onChange={handleValueChange}
              className="contact-form-field"
              required
            />
            <span className="contact-form-divider-symbol">@</span>
            <input
              id="emailDomain"
              name="emailDomain"
              value={formValues.emailDomain}
              onChange={handleValueChange}
              className="contact-form-field"
              readOnly={formValues.emailDomainOption !== EMAIL_DOMAIN_DIRECT}
              required
            />
            <select
              id="emailDomainOption"
              name="emailDomainOption"
              value={formValues.emailDomainOption}
              onChange={handleValueChange}
              className="contact-form-field contact-form-email-domain-select"
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

        <div className="contact-form-row">
          <label className="contact-form-label" htmlFor="currentMealPrice">
            현재 식단가
          </label>
          <input
            id="currentMealPrice"
            name="currentMealPrice"
            value={formValues.currentMealPrice}
            onChange={handleValueChange}
            className="contact-form-field"
            required
          />
        </div>

        <div className="contact-form-row">
          <label className="contact-form-label" htmlFor="desiredMealPrice">
            희망 식단가
          </label>
          <input
            id="desiredMealPrice"
            name="desiredMealPrice"
            value={formValues.desiredMealPrice}
            onChange={handleValueChange}
            className="contact-form-field"
            required
          />
        </div>

        <div className="contact-form-row">
          <label className="contact-form-label" htmlFor="dailyMealCount">
            일 식수
          </label>
          <input
            id="dailyMealCount"
            name="dailyMealCount"
            value={formValues.dailyMealCount}
            onChange={handleValueChange}
            className="contact-form-field"
            required
          />
        </div>

        <div className="contact-form-row">
          <label className="contact-form-label" htmlFor="mealType">
            식사 구분
          </label>
          <select
            id="mealType"
            name="mealType"
            value={formValues.mealType}
            onChange={handleValueChange}
            className="contact-form-field"
            required
          >
            <option value="" disabled>
              조식 / 중식 / 석식 중 택 1
            </option>
            <option value="조식">조식</option>
            <option value="중식">중식</option>
            <option value="석식">석식</option>
          </select>
        </div>

        <div className="contact-form-row">
          <label className="contact-form-label" htmlFor="businessType">
            업장 구분
          </label>
          <select
            id="businessType"
            name="businessType"
            value={formValues.businessType}
            onChange={handleValueChange}
            className="contact-form-field"
            required
          >
            <option value="" disabled>
              산업체 / 학교 / 요양원 중 택 1
            </option>
            <option value="산업체">산업체</option>
            <option value="학교">학교</option>
            <option value="요양원">요양원</option>
          </select>
        </div>
      </div>

      {/* 업체 변경 이유 단일 입력 블록 */}
      <div className="contact-form-block contact-form-block-switching">
        <label className="contact-form-label" htmlFor="switchingReason">
          현 위탁사 불만 혹은 위탁사를 바꾸는 이유
        </label>
        <textarea
          id="switchingReason"
          name="switchingReason"
          value={formValues.switchingReason}
          onChange={handleValueChange}
          className="contact-form-textarea contact-form-switching-textarea"
        />
      </div>

      <div className="contact-form-block contact-form-block-switching">
        <label className="contact-form-label" htmlFor="title">
          제목
        </label>
        <input
          id="title"
          name="title"
          value={formValues.title}
          onChange={handleValueChange}
          className="contact-form-field"
          required
        />
      </div>

      {/* 문의 내용 textarea 블록 */}
      <div className="contact-form-block">
        <label className="contact-form-label" htmlFor="inquiryContent">
          문의 내용
        </label>
        <textarea
          id="inquiryContent"
          name="inquiryContent"
          value={formValues.inquiryContent}
          onChange={handleValueChange}
          className="contact-form-textarea"
          required
        />
      </div>

      {/* 제출 상태/제출 버튼 영역 */}
      <div className="contact-form-actions">
        <button type="submit" className="contact-form-submit" disabled={isSubmitting || feedbackModal.open}>
          {isSubmitting ? "제출중..." : "제출하기"}
        </button>
      </div>

      {/* 고객문의 화면: 문의 제출 완료 결과 모달 영역 */}
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
