import "server-only";

// ERP 문의 연동에서 사용하는 이벤트 구분값
export type ContactInquiryErpEventType = "CONTACT_INQUIRY_CREATED" | "CONTACT_INQUIRY_REPLIED";

// ERP 수신자 계산에 전달하는 라우팅 힌트 모델
type ContactInquiryRoutingHints = {
  priority?: string[];
  userIds?: string[];
  positionTypes?: number[];
  departments?: number[];
};

// 문의 등록/답변 시 ERP 웹훅에 전달할 입력 모델
type TriggerContactInquiryErpNotificationInput = {
  eventType: ContactInquiryErpEventType;
  payload: Record<string, unknown>;
  preferredUserIds?: string[];
};

// 별도 수신자가 없을 때 마지막 기본값으로 넣는 ERP 사용자
const DEFAULT_CONTACT_ROUTE_USER_ID = "ww1";

// 문자열 입력 공백 제거
const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// 환경변수 CSV 문자열을 중복 없는 문자열 배열로 변환
const parseCsvTexts = (value: unknown) => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return [] as string[];
  }

  return Array.from(
    new Set(
      normalized
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
};

// 환경변수 CSV 문자열을 중복 없는 숫자 배열로 변환
const parseCsvNumbers = (value: unknown) =>
  Array.from(
    new Set(
      parseCsvTexts(value)
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item))
    )
  );

// 문의관리 상세 URL 생성에 사용할 web 기준 주소 계산
const getContactManageBaseUrl = () => {
  const configuredBaseUrl =
    normalizeText(process.env.THE_FULL_WEB_BASE_URL) || normalizeText(process.env.NEXT_PUBLIC_THE_FULL_WEB_BASE_URL);
  const baseUrl = configuredBaseUrl || "http://localhost:8081";
  return baseUrl.replace(/\/+$/, "");
};

// ERP 알림에서 문의 상세로 이동할 문의관리 링크 생성
export const buildContactManageUrl = (inquiryId: number) => {
  if (!Number.isInteger(inquiryId) || inquiryId <= 0) {
    return `${getContactManageBaseUrl()}/contact/manage`;
  }

  return `${getContactManageBaseUrl()}/contact/manage/${inquiryId}`;
};

// 문의 등록/답변 이벤트를 ERP 웹훅으로 전달
export const triggerContactInquiryErpNotification = async ({
  eventType,
  payload,
  preferredUserIds = [],
}: TriggerContactInquiryErpNotificationInput) => {
  const erpWebhookUrl = process.env.ERP_INQUIRY_WEBHOOK_URL;
  const erpWebhookSecret = normalizeText(process.env.ERP_INQUIRY_WEBHOOK_SECRET);
  if (!erpWebhookUrl) {
    return { queued: false, reason: "erp_webhook_not_configured" as const };
  }

  // 환경변수에 저장된 기본 라우팅 규칙과 대상을 읽어 요청값과 병합
  const envRoutingPriority = parseCsvTexts(process.env.ERP_CONTACT_ROUTE_PRIORITY);
  const envRoutingUserIds = parseCsvTexts(process.env.ERP_CONTACT_ROUTE_USER_IDS);
  const envRoutingPositionTypes = parseCsvNumbers(process.env.ERP_CONTACT_ROUTE_POSITION_TYPES);
  const envRoutingDepartments = parseCsvNumbers(process.env.ERP_CONTACT_ROUTE_DEPARTMENTS);

  // 화면에서 넘긴 우선 담당자와 환경변수 기본 담당자를 합쳐 중복 없이 전달
  const mergedUserIds = Array.from(
    new Set(
      [...preferredUserIds, ...envRoutingUserIds]
        .map((item) => normalizeText(item))
        .filter(Boolean)
    )
  );
  if (mergedUserIds.length === 0) {
    mergedUserIds.push(DEFAULT_CONTACT_ROUTE_USER_ID);
  }

  // 별도 설정이 없으면 user_id 우선 라우팅으로 ERP 쪽 수신자를 계산
  const resolvedPriority = envRoutingPriority.length > 0 ? envRoutingPriority : ["user_id"];
  const routingHints: ContactInquiryRoutingHints = {
    priority: resolvedPriority,
    userIds: mergedUserIds,
  };
  if (envRoutingPositionTypes.length > 0) {
    routingHints.positionTypes = envRoutingPositionTypes;
  }
  if (envRoutingDepartments.length > 0) {
    routingHints.departments = envRoutingDepartments;
  }

  // 공유 시크릿이 있으면 ERP 웹훅에서 출처 검증을 할 수 있게 헤더에 실어 보낸다.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (erpWebhookSecret) {
    headers["X-ERP-WEBHOOK-SECRET"] = erpWebhookSecret;
  }

  try {
    // ERP는 이벤트 종류, 문의 payload, 라우팅 힌트를 함께 받아 수신자/알림 대상을 계산
    const response = await fetch(erpWebhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        eventType,
        sourceSystem: "the_full_web",
        payload,
        routingHints,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      // ERP 서버 응답이 실패면 상태코드를 함께 넘겨 상위 로직에서 원인 구분이 가능하게 한다.
      return { queued: false, reason: "erp_webhook_failed" as const, status: response.status };
    }

    return { queued: true as const };
  } catch {
    // 네트워크 예외/연결 실패는 별도 사유로 구분해 재시도 판단에 사용
    return { queued: false, reason: "erp_webhook_exception" as const };
  }
};
