import "server-only";
import { isCkEditorContentMeaningful } from "@/app/contact/editorTextUtils";

// 고객문의 등록 API로 전달하는 입력 모델
type ContactInquiryInput = {
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

// 문의관리 목록 테이블에서 사용하는 요약 모델
export type ContactInquirySummary = {
  id: number;
  title: string;
  businessName: string;
  managerName: string;
  phoneNumber: string;
  email: string;
  submittedAt: string;
  createdAt: string;
  answerYn: "Y" | "N";
};

// 문의관리 상세에서 사용하는 상세 모델
export type ContactInquiryRecord = ContactInquirySummary & {
  currentMealPrice: string;
  desiredMealPrice: string;
  dailyMealCount: string;
  mealType: string;
  businessType: string;
  switchingReason: string;
  inquiryContent: string;
  source: string;
  erpSyncTarget: string;
  updatedAt: string;
};

// 문의 답변 입력/조회에서 공통 사용하는 답변 모델
export type ContactInquiryReplyRecord = {
  id: number;
  inquiryId: number;
  content: string;
  userId: string;
  registeredAt: string;
  modifiedBy: string;
  modifiedAt: string;
};

// 문의 답변 저장 요청 모델
export type ContactInquiryReplyInput = {
  content: string;
  userId?: string;
};

// 백엔드(the_full_web_api) 문의 도메인 응답 모델
type ContactApiInquiry = {
  id?: number | string;
  title?: string;
  businessName?: string;
  managerName?: string;
  phoneNumber?: string;
  email?: string;
  currentMealPrice?: string;
  desiredMealPrice?: string;
  dailyMealCount?: string;
  mealType?: string;
  businessType?: string;
  switchingReason?: string | null;
  inquiryContent?: string;
  answerYn?: string;
  submittedAt?: string;
  source?: string;
  erpSyncTarget?: string;
  createdAt?: string;
  updatedAt?: string;
  modId?: string | null;
};

// 백엔드(the_full_web_api) 문의 답변 응답 모델
type ContactApiReply = {
  id?: number | string;
  inquiryId?: number | string;
  content?: string;
  userId?: string;
  registeredAt?: string;
  modId?: string | null;
  modifiedAt?: string;
};

// 백엔드 공통 에러 페이로드 모델
type ApiErrorPayload = {
  error?: string;
};

// API 응답 래퍼 모델
type ApiResponse<T> = {
  ok: boolean;
  status: number;
  payload: T | ApiErrorPayload;
};

// 입력값을 문자열로 안전하게 정규화
const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// KST(Asia/Seoul) 기준 yyyy-mm-dd hh:mm:ss 문자열 생성
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

// 연락처를 000-0000-0000 형식으로 정규화(11자리 숫자일 때만 자동 포맷)
const normalizePhoneNumber = (value: unknown) => {
  const raw = normalizeText(value);
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 11) {
    return raw;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

// 이메일 공백 제거/소문자 정규화
const normalizeEmail = (value: unknown) => normalizeText(value).replace(/\s+/g, "").toLowerCase();

// 숫자형 id 파싱(양의 정수만 허용)
const toPositiveInt = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

// 배열 형태 응답을 안전하게 변환
const toArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

// the_full_web_api 기본 호출 주소
const DEFAULT_WEB_API_BASE_URL = "http://127.0.0.1:8090";

// the_full_web_api 베이스 URL 후보(환경변수 우선, web_api 포트 8090 fallback)
const DEFAULT_WEB_API_BASE_URLS = [DEFAULT_WEB_API_BASE_URL, "http://localhost:8090", "http://52.64.151.137:8090"];

// 예전 프론트 포트 주소가 남아 있어도 web_api 포트(8090)로 보정
const normalizeWebApiBaseUrl = (value: string) =>
  normalizeText(value)
    .replace(/\/+$/, "")
    .replace(/^(https?:\/\/(?:127\.0\.0\.1|localhost|52\.64\.151\.137|n\.thefull\.kr)):8081$/iu, "$1:8090")
    .replace(/^(https?:\/\/(?:127\.0\.0\.1|localhost)):3001$/iu, "$1:8090")
    .replace(/^(https?:\/\/(?:127\.0\.0\.1|localhost)):3000$/iu, "$1:8090");

const parseBaseUrlCandidates = (...values: Array<string | undefined>) => {
  const deduped = new Set<string>();
  const candidates: string[] = [];

  values.forEach((value) => {
    const raw = normalizeWebApiBaseUrl(value ?? "");
    if (!raw) {
      return;
    }

    raw
      .split(",")
      .map((item) => normalizeText(item).replace(/\/+$/, ""))
      .filter(Boolean)
      .forEach((item) => {
        if (!deduped.has(item)) {
          deduped.add(item);
          candidates.push(item);
        }
      });
  });

  return candidates;
};

const getApiBaseUrlCandidates = () => {
  const configured = parseBaseUrlCandidates(process.env.WEB_API_BASE_URL);
  const blocked = parseBaseUrlCandidates(
    process.env.NEXTAUTH_URL,
    process.env.THE_FULL_WEB_BASE_URL,
    process.env.NEXT_PUBLIC_THE_FULL_WEB_BASE_URL
  );

  if (configured.length > 0) {
    const filteredConfigured = configured.filter((item) => !blocked.includes(item));
    return filteredConfigured.length > 0 ? filteredConfigured : configured;
  }

  const fallback = parseBaseUrlCandidates(...DEFAULT_WEB_API_BASE_URLS);
  const filteredFallback = fallback.filter((item) => !blocked.includes(item));
  return filteredFallback.length > 0 ? filteredFallback : fallback;
};

// 문의 API 연결 실패 주소를 잠시 제외하는 쿨다운(서킷 브레이커) 설정
const API_CONNECTION_COOLDOWN_MS = 10000;
const apiConnectionBlockedUntil = new Map<string, number>();

// 쿨다운이 끝난 주소만 반환
const getAvailableBaseUrls = (baseUrls: string[]) => {
  const now = Date.now();
  return baseUrls.filter((baseUrl) => (apiConnectionBlockedUntil.get(baseUrl) ?? 0) <= now);
};

// 연결 실패 주소를 일정 시간 재시도 대상에서 제외
const blockBaseUrlTemporarily = (baseUrl: string) => {
  apiConnectionBlockedUntil.set(baseUrl, Date.now() + API_CONNECTION_COOLDOWN_MS);
};

// 연결 성공 주소는 즉시 차단 해제
const clearBaseUrlBlock = (baseUrl: string) => {
  apiConnectionBlockedUntil.delete(baseUrl);
};

const buildApiConnectionError = (baseUrls: string[], errors: string[]) => {
  const targets = baseUrls.join(", ");
  const detail = errors.length > 0 ? ` (${errors.join(" | ")})` : "";
  return `문의 API 서버(${targets})에 연결할 수 없습니다. the_full_web_api 실행 상태/포트를 확인해 주세요.${detail}`;
};

// API 에러 메시지 추출 유틸
const getApiErrorMessage = (payload: unknown, fallbackMessage: string) => {
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const message = normalizeText((payload as ApiErrorPayload).error);
    if (message) {
      return message;
    }
  }
  return fallbackMessage;
};

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

// the_full_web_api 호출 공통 유틸
const requestWebApi = async <T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> => {
  const baseUrls = getApiBaseUrlCandidates();
  const availableBaseUrls = getAvailableBaseUrls(baseUrls);
  const connectionErrors: string[] = [];
  let lastFallbackResponse: ApiResponse<T> | null = null;

  if (availableBaseUrls.length === 0) {
    const now = Date.now();
    const retryAfterMs = Math.max(
      0,
      ...baseUrls.map((baseUrl) => (apiConnectionBlockedUntil.get(baseUrl) ?? now) - now)
    );
    const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));
    throw new Error(
      buildApiConnectionError(baseUrls, [
        `최근 연결 실패로 ${retryAfterSec}초 동안 재시도 대기 중입니다`,
      ])
    );
  }

  for (const baseUrl of availableBaseUrls) {
    let response: Response;
    try {
      response = await fetchWithTimeout(`${baseUrl}${path}`, {
        ...init,
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
      }, 5000);
    } catch (error) {
      blockBaseUrlTemporarily(baseUrl);
      const detail = error instanceof Error ? normalizeText(error.message) : "";
      connectionErrors.push(detail ? `${baseUrl}: ${detail}` : baseUrl);
      continue;
    }

    clearBaseUrlBlock(baseUrl);

    const payload = (await response.json().catch(() => ({}))) as T | ApiErrorPayload;
    const result: ApiResponse<T> = {
      ok: response.ok,
      status: response.status,
      payload,
    };

    if (result.status === 404 || result.status === 405) {
      // 후보 포트가 web_api가 아닐 수 있어 다음 후보를 계속 탐색
      lastFallbackResponse = result;
      continue;
    }

    return result;
  }

  if (lastFallbackResponse) {
    return lastFallbackResponse;
  }

  throw new Error(buildApiConnectionError(baseUrls, connectionErrors));
};

// 문의 목록 응답을 화면 요약 모델로 변환
const toSummary = (row?: ContactApiInquiry): ContactInquirySummary | null => {
  if (!row) {
    return null;
  }

  const id = toPositiveInt(row.id);
  if (!id) {
    return null;
  }

  const answerYn = normalizeText(row.answerYn).toUpperCase() === "Y" ? "Y" : "N";
  const submittedAt = normalizeText(row.submittedAt);
  const createdAt = normalizeText(row.createdAt);

  return {
    id,
    title: normalizeText(row.title),
    businessName: normalizeText(row.businessName),
    managerName: normalizeText(row.managerName),
    phoneNumber: normalizePhoneNumber(row.phoneNumber),
    email: normalizeEmail(row.email),
    submittedAt,
    createdAt,
    answerYn,
  };
};

// 문의 상세 응답을 화면 상세 모델로 변환
const toRecord = (row?: ContactApiInquiry): ContactInquiryRecord | null => {
  const summary = toSummary(row);
  if (!summary || !row) {
    return null;
  }

  return {
    ...summary,
    currentMealPrice: normalizeText(row.currentMealPrice),
    desiredMealPrice: normalizeText(row.desiredMealPrice),
    dailyMealCount: normalizeText(row.dailyMealCount),
    mealType: normalizeText(row.mealType),
    businessType: normalizeText(row.businessType),
    switchingReason: normalizeText(row.switchingReason),
    inquiryContent: normalizeText(row.inquiryContent),
    source: normalizeText(row.source),
    erpSyncTarget: normalizeText(row.erpSyncTarget),
    updatedAt: normalizeText(row.updatedAt),
  };
};

// 문의 답변 응답을 화면 답변 모델로 변환
const toReply = (row?: ContactApiReply | null): ContactInquiryReplyRecord | null => {
  if (!row) {
    return null;
  }

  const id = toPositiveInt(row.id);
  const inquiryId = toPositiveInt(row.inquiryId);
  if (!id || !inquiryId) {
    return null;
  }

  return {
    id,
    inquiryId,
    content: normalizeText(row.content),
    userId: normalizeText(row.userId),
    registeredAt: normalizeText(row.registeredAt),
    modifiedBy: normalizeText(row.modId),
    modifiedAt: normalizeText(row.modifiedAt),
  };
};

// 고객문의 등록 API 호출
export const createContactInquiry = async (input: ContactInquiryInput) => {
  const requestBody: ContactInquiryInput = {
    businessName: normalizeText(input.businessName),
    managerName: normalizeText(input.managerName),
    phoneNumber: normalizePhoneNumber(input.phoneNumber),
    email: normalizeEmail(input.email),
    currentMealPrice: normalizeText(input.currentMealPrice),
    desiredMealPrice: normalizeText(input.desiredMealPrice),
    dailyMealCount: normalizeText(input.dailyMealCount),
    mealType: normalizeText(input.mealType),
    businessType: normalizeText(input.businessType),
    switchingReason: normalizeText(input.switchingReason),
    title: normalizeText(input.title),
    inquiryContent: normalizeText(input.inquiryContent),
    submittedAt: toKstDateTimeString(input.submittedAt),
    source: normalizeText(input.source) || "contact-page",
    erpSyncTarget: normalizeText(input.erpSyncTarget) || "ERP_INQUIRY_V1",
  };

  const response = await requestWebApi<{ inquiry?: ContactApiInquiry; inquiryId?: number | string }>(
    "/api/contact/manage",
    {
      method: "POST",
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    throw new Error(getApiErrorMessage(response.payload, "문의 저장 중 오류가 발생했습니다."));
  }

  const created = toRecord((response.payload as { inquiry?: ContactApiInquiry }).inquiry);
  if (created) {
    return created;
  }

  const inquiryId = toPositiveInt((response.payload as { inquiryId?: number | string }).inquiryId);
  if (!inquiryId) {
    throw new Error("문의 저장 후 번호를 확인할 수 없습니다.");
  }

  const loaded = await getContactInquiryById(inquiryId);
  if (!loaded) {
    throw new Error("저장된 문의 조회에 실패했습니다.");
  }

  return loaded;
};

// 문의관리 목록 조회 API 호출
export const listContactInquiry = async () => {
  const response = await requestWebApi<{ inquiry?: ContactApiInquiry[] }>("/api/contact/manage");
  if (!response.ok) {
    throw new Error(getApiErrorMessage(response.payload, "문의 목록 조회 중 오류가 발생했습니다."));
  }

  return toArray<ContactApiInquiry>((response.payload as { inquiry?: ContactApiInquiry[] }).inquiry)
    .map((item) => toSummary(item))
    .filter((item): item is ContactInquirySummary => Boolean(item));
};

// 문의 상세 조회 API 호출
export const getContactInquiryById = async (id: number) => {
  const inquiryId = toPositiveInt(id);
  if (!inquiryId) {
    return null;
  }

  const response = await requestWebApi<{ inquiry?: ContactApiInquiry }>(
    `/api/contact/manage/${inquiryId}`
  );
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(getApiErrorMessage(response.payload, "문의 상세 조회 중 오류가 발생했습니다."));
  }

  return toRecord((response.payload as { inquiry?: ContactApiInquiry }).inquiry);
};

// 문의 답변 조회 API 호출
export const getContactInquiryReplyByInquiryId = async (inquiryId: number) => {
  const parsedInquiryId = toPositiveInt(inquiryId);
  if (!parsedInquiryId) {
    return null;
  }

  const response = await requestWebApi<{ reply?: ContactApiReply | null }>(
    `/api/contact/manage/${parsedInquiryId}/reply`
  );

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(getApiErrorMessage(response.payload, "문의 답변 조회 중 오류가 발생했습니다."));
  }

  return toReply((response.payload as { reply?: ContactApiReply | null }).reply);
};

// 문의 답변 저장/수정 API 호출
export const upsertContactInquiryReply = async (inquiryId: number, input: ContactInquiryReplyInput) => {
  const parsedInquiryId = toPositiveInt(inquiryId);
  if (!parsedInquiryId) {
    throw new Error("문의 번호가 올바르지 않습니다.");
  }

  const content = normalizeText(input.content);
  if (!isCkEditorContentMeaningful(content)) {
    throw new Error("답변 내용을 입력해 주세요.");
  }

  const response = await requestWebApi<{ reply?: ContactApiReply }>(
    `/api/contact/manage/${parsedInquiryId}/reply`,
    {
      method: "POST",
      body: JSON.stringify({
        content,
        userId: normalizeText(input.userId) || "admin",
      }),
    }
  );

  if (response.status === 404) {
    throw new Error("문의 내역을 찾을 수 없습니다.");
  }
  if (!response.ok) {
    throw new Error(getApiErrorMessage(response.payload, "답변 저장 중 오류가 발생했습니다."));
  }

  const savedReply = toReply((response.payload as { reply?: ContactApiReply }).reply);
  if (!savedReply) {
    throw new Error("답변 저장 후 조회에 실패했습니다.");
  }

  return savedReply;
};

// 문의 소프트삭제 API 호출(del_yn='Y')
export const deleteContactInquiry = async (id: number, deletedBy = "admin") => {
  const inquiryId = toPositiveInt(id);
  if (!inquiryId) {
    return false;
  }

  const response = await requestWebApi<{ message?: string }>(`/api/contact/manage/${inquiryId}`, {
    method: "DELETE",
    body: JSON.stringify({
      deletedBy: normalizeText(deletedBy) || "admin",
    }),
  });

  if (response.status === 404) {
    return false;
  }
  if (!response.ok) {
    throw new Error(getApiErrorMessage(response.payload, "문의 삭제 중 오류가 발생했습니다."));
  }

  return true;
};
