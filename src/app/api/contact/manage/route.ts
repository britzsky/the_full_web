import { NextResponse } from "next/server";
import { createContactInquiry, listContactInquiry } from "@/app/contact/inquiryStore";
import { getAdminAccess } from "@/app/lib/adminAccess";

// 고객문의/문의관리 API 요청 본문 타입
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

// 고객문의 등록 필수 항목 목록
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

// 문자열 입력값 공백 제거
const normalizeText = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

// 입력값을 KST 고정 문자열로 변환
const toKstDateTimeString = (value: unknown) => {
  const raw = normalizeText(value);
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/u.test(raw)) {
    return raw;
  }

  const parsed = raw ? new Date(raw) : new Date();
  const baseDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const kstDate = new Date(baseDate.getTime() + 9 * 60 * 60 * 1000);
  const year = String(kstDate.getUTCFullYear());
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kstDate.getUTCDate()).padStart(2, "0");
  const hour = String(kstDate.getUTCHours()).padStart(2, "0");
  const minute = String(kstDate.getUTCMinutes()).padStart(2, "0");
  const second = String(kstDate.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

// 문의관리 목록 조회 API
export async function GET() {
  const canManage = await getAdminAccess();
  if (!canManage) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const inquiry = await listContactInquiry();
    return NextResponse.json({ inquiry });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "문의 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 고객문의 등록 API
export async function POST(request: Request) {
  let body: Partial<ContactInquiryPayload>;

  try {
    body = (await request.json()) as Partial<ContactInquiryPayload>;
  } catch {
    return NextResponse.json({ error: "요청 본문(JSON) 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const missingFields = REQUIRED_FIELDS.filter((field) => !normalizeText(body[field]));
  if (missingFields.length > 0) {
    return NextResponse.json({ error: "필수 항목을 입력해 주세요.", fields: missingFields }, { status: 400 });
  }

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
    const savedInquiry = await createContactInquiry(normalizedPayload);

    return NextResponse.json({
      message: "문의가 정상적으로 접수되었습니다.\n확인 후 작성해주신 이메일로 답변드리겠습니다.",
      inquiryId: savedInquiry.id,
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
