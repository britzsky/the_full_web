import { NextResponse } from "next/server";
import { createContactInquiry } from "@/app/contact/inquiryStore";
import { buildContactManageUrl, triggerContactInquiryErpNotification } from "@/app/contact/erpWebhook";

// 고객문의 API: ContactInquiryPayload 타입 모델
type ContactInquiryPayload = {
  businessName: string;
  managerName: string;
  phoneNumber: string;
  email: string;
  currentMealPrice: string;
  desiredMealPrice: string;
  dailyMealCount: string;
  mealType: string;
  businessType: string;
  switchingReason?: string;
  title: string;
  inquiryContent: string;
  submittedAt?: string;
  source?: string;
  erpSyncTarget?: string;
};

// 고객문의 API: REQUIRED_FIELDS 정의
const REQUIRED_FIELDS: Array<keyof ContactInquiryPayload> = [
  "businessName",
  "managerName",
  "phoneNumber",
  "email",
  "currentMealPrice",
  "desiredMealPrice",
  "dailyMealCount",
  "mealType",
  "businessType",
  "title",
  "inquiryContent",
];

// 고객문의 API: normalizeText 정의
const normalizeText = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const toKstDateTimeString = (value: unknown) => {
  const raw = normalizeText(value);
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/u.test(raw)) {
    return raw;
  }
  const parsed = raw ? new Date(raw) : new Date();
  const baseDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed;

  // UTC 기준으로 +9시간 오프셋을 적용해 KST 문자열로 고정
  const kstDate = new Date(baseDate.getTime() + 9 * 60 * 60 * 1000);
  const year = String(kstDate.getUTCFullYear());
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kstDate.getUTCDate()).padStart(2, "0");
  const hour = String(kstDate.getUTCHours()).padStart(2, "0");
  const minute = String(kstDate.getUTCMinutes()).padStart(2, "0");
  const second = String(kstDate.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

// 고객문의 API: 데이터 저장 로직
export async function POST(request: Request) {
  let body: Partial<ContactInquiryPayload>;

  try {
    body = (await request.json()) as Partial<ContactInquiryPayload>;
  } catch {
    return NextResponse.json({ error: "요청 본문(JSON) 형식이 올바르지 않습니다." }, { status: 400 });
  }

// 고객문의 API: 상태값
  const missingFields = REQUIRED_FIELDS.filter((field) => !normalizeText(body[field]));
  if (missingFields.length > 0) {
    return NextResponse.json({ error: "필수 항목을 입력해 주세요.", fields: missingFields }, { status: 400 });
  }

// 고객문의 API: normalizedPayload 정의
  const normalizedPayload: ContactInquiryPayload = {
    businessName: normalizeText(body.businessName),
    managerName: normalizeText(body.managerName),
    phoneNumber: normalizeText(body.phoneNumber),
    email: normalizeText(body.email),
    currentMealPrice: normalizeText(body.currentMealPrice),
    desiredMealPrice: normalizeText(body.desiredMealPrice),
    dailyMealCount: normalizeText(body.dailyMealCount),
    mealType: normalizeText(body.mealType),
    businessType: normalizeText(body.businessType),
    switchingReason: normalizeText(body.switchingReason),
    title: normalizeText(body.title),
    inquiryContent: normalizeText(body.inquiryContent),
    submittedAt: toKstDateTimeString(body.submittedAt),
    source: normalizeText(body.source) || "contact-page",
    erpSyncTarget: normalizeText(body.erpSyncTarget) || "ERP_INQUIRY_V1",
  };

  try {
// 고객문의 API: 데이터 저장 로직
    const savedInquiry = await createContactInquiry(normalizedPayload);
// 고객문의 API: erpSync 정의
    const inquiryId = Number(savedInquiry.id);
    const routeUserIds = String(process.env.ERP_CONTACT_ROUTE_USER_IDS || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const primaryRouteUserId = routeUserIds[0] || "ww1";
    const erpSync = await triggerContactInquiryErpNotification({
      eventType: "CONTACT_INQUIRY_CREATED",
      payload: {
        id: inquiryId,
        title: savedInquiry.title,
        business_name: savedInquiry.businessName,
        manager_name: savedInquiry.managerName,
        phone_number: savedInquiry.phoneNumber,
        email: savedInquiry.email,
        answer_yn: savedInquiry.answerYn,
        submitted_at: savedInquiry.submittedAt || savedInquiry.createdAt,
        source: savedInquiry.source || normalizedPayload.source,
        erp_sync_target: savedInquiry.erpSyncTarget || normalizedPayload.erpSyncTarget,
        user_id: primaryRouteUserId,
        target_user_id: primaryRouteUserId,
        target_user_ids: routeUserIds.length > 0 ? routeUserIds : ["ww1"],
        manage_url: buildContactManageUrl(inquiryId),
      },
    });

    return NextResponse.json({
      message: "문의가 정상적으로 접수되었습니다.\n확인 후 작성해주신 이메일로 답변드리겠습니다.",
      inquiryId: savedInquiry.id,
      erpSync,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "문의 저장 중 오류가 발생했습니다. DB 연결 상태를 확인해 주세요.",
      },
      { status: 500 }
    );
  }
}
