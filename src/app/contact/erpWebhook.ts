import "server-only";

export type ContactInquiryErpEventType = "CONTACT_INQUIRY_CREATED" | "CONTACT_INQUIRY_REPLIED";

type ContactInquiryRoutingHints = {
  priority?: string[];
  userIds?: string[];
  positionTypes?: number[];
  departments?: number[];
};

type TriggerContactInquiryErpNotificationInput = {
  eventType: ContactInquiryErpEventType;
  payload: Record<string, unknown>;
  preferredUserIds?: string[];
};

const DEFAULT_CONTACT_ROUTE_USER_ID = "ww1";

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

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

const parseCsvNumbers = (value: unknown) =>
  Array.from(
    new Set(
      parseCsvTexts(value)
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item))
    )
  );

const getContactManageBaseUrl = () => {
  const configuredBaseUrl =
    normalizeText(process.env.THE_FULL_WEB_BASE_URL) || normalizeText(process.env.NEXT_PUBLIC_THE_FULL_WEB_BASE_URL);
  const baseUrl = configuredBaseUrl || "http://localhost:8081";
  return baseUrl.replace(/\/+$/, "");
};

export const buildContactManageUrl = (inquiryId: number, options?: { erpUserId?: string }) => {
  if (!Number.isInteger(inquiryId) || inquiryId <= 0) {
    return `${getContactManageBaseUrl()}/contact/manage`;
  }

  const route = `${getContactManageBaseUrl()}/contact/manage/${inquiryId}`;
  const erpUserId = normalizeText(options?.erpUserId);
  if (!erpUserId) {
    return route;
  }

  const search = new URLSearchParams({ erp_user_id: erpUserId });
  return `${route}?${search.toString()}`;
};

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

  const envRoutingPriority = parseCsvTexts(process.env.ERP_CONTACT_ROUTE_PRIORITY);
  const envRoutingUserIds = parseCsvTexts(process.env.ERP_CONTACT_ROUTE_USER_IDS);
  const envRoutingPositionTypes = parseCsvNumbers(process.env.ERP_CONTACT_ROUTE_POSITION_TYPES);
  const envRoutingDepartments = parseCsvNumbers(process.env.ERP_CONTACT_ROUTE_DEPARTMENTS);

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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (erpWebhookSecret) {
    headers["X-ERP-WEBHOOK-SECRET"] = erpWebhookSecret;
  }

  try {
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
      return { queued: false, reason: "erp_webhook_failed" as const, status: response.status };
    }

    return { queued: true as const };
  } catch {
    return { queued: false, reason: "erp_webhook_exception" as const };
  }
};
