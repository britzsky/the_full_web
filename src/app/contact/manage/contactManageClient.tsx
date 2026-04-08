"use client";

import { useEffect, useState } from "react";
import PageNavigationLink from "@/app/components/Common/PageNavigationLink";
import { getPublicApiErrorMessage, requestPublicWebApi } from "@/app/lib/publicWebApi";
import ContactManageReplyEditor from "./ContactManageReplyEditor";

type ContactManageSearchField = "title" | "businessName" | "managerName";
type ContactManageSortKey = "id" | "answerYn";
type ContactManageSortDirection = "asc" | "desc";

type ContactManageSortState = {
  key: ContactManageSortKey;
  direction: ContactManageSortDirection;
};

// 문의관리 목록 화면에 필요한 기본 문의 요약 모델
type ContactInquirySummary = {
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

// 문의관리 상세 화면에서 사용하는 문의 원본 상세 모델
type ContactInquiryRecord = ContactInquirySummary & {
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

// 문의관리 상세 하단 답변 편집기에 전달하는 답변 모델
type ContactInquiryReplyRecord = {
  id: number;
  inquiryId: number;
  content: string;
  userId: string;
  registeredAt: string;
  modifiedBy: string;
  modifiedAt: string;
};

// 문의 목록/상세 API 응답을 프론트 화면 모델로 바꾸기 전 원본 형태
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

// 문의 답변 조회 API 응답을 프론트 화면 모델로 바꾸기 전 원본 형태
type ContactApiReply = {
  id?: number | string;
  inquiryId?: number | string;
  content?: string;
  userId?: string;
  registeredAt?: string;
  modId?: string | null;
  modifiedAt?: string;
};

// 문의관리 목록 CSR 새로고침 기준값
type ContactManageTableClientProps = {
  refreshKey: string;
  query: string;
  field: ContactManageSearchField;
};

// 문의관리 목록 CSR 로딩/오류/데이터 상태
type ContactManageTableState = {
  isLoading: boolean;
  errorMessage: string;
  inquiryList: ContactInquirySummary[];
};

// 문의관리 상세 CSR 조회에 필요한 식별값
type ContactManageDetailClientProps = {
  inquiryId: number;
  erpUserId: string;
  refreshKey: string;
};

// 문의관리 상세 CSR 로딩/오류/문의/답변 상태
type ContactManageDetailState = {
  isLoading: boolean;
  errorMessage: string;
  inquiry: ContactInquiryRecord | null;
  reply: ContactInquiryReplyRecord | null;
};

const CONTACT_MANAGE_PAGE_SIZE = 15;
const CONTACT_MANAGE_PAGINATION_WINDOW = 5;
const DEFAULT_CONTACT_MANAGE_SORT_STATE: ContactManageSortState = {
  key: "answerYn",
  direction: "asc",
};
// API 응답 문자열을 화면 표시에 맞게 정리하는 공통 정규화 유틸
const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const normalizePhoneNumber = (value: unknown) => {
  const raw = normalizeText(value);
  const digits = raw.replace(/\D/g, "");
  return digits.length === 11 ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}` : raw;
};
const normalizeEmail = (value: unknown) => normalizeText(value).replace(/\s+/g, "").toLowerCase();
const toPositiveInt = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};
const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
const normalizeSearchText = (value: string) => normalizeText(value).toLowerCase();
const getAnswerYnOrder = (answerYn: ContactInquirySummary["answerYn"]) => (answerYn === "N" ? 0 : 1);
const clampPage = (page: number, totalPages: number) => Math.min(Math.max(page, 1), Math.max(totalPages, 1));
const getPaginationPages = (currentPage: number, totalPages: number) => {
  const normalizedCurrentPage = clampPage(currentPage, totalPages);
  const halfWindow = Math.floor(CONTACT_MANAGE_PAGINATION_WINDOW / 2);
  let startPage = Math.max(1, normalizedCurrentPage - halfWindow);
  let endPage = Math.min(totalPages, startPage + CONTACT_MANAGE_PAGINATION_WINDOW - 1);

  if (endPage - startPage + 1 < CONTACT_MANAGE_PAGINATION_WINDOW) {
    startPage = Math.max(1, endPage - CONTACT_MANAGE_PAGINATION_WINDOW + 1);
  }

  return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
};
const matchesInquirySearch = (
  inquiry: ContactInquirySummary,
  query: string,
  field: ContactManageSearchField
) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return true;
  }

  if (field === "businessName") {
    return normalizeSearchText(inquiry.businessName).includes(normalizedQuery);
  }
  if (field === "managerName") {
    return normalizeSearchText(inquiry.managerName).includes(normalizedQuery);
  }
  return normalizeSearchText(inquiry.title).includes(normalizedQuery);
};
const sortInquiryList = (inquiryList: ContactInquirySummary[], sortState: ContactManageSortState) =>
  [...inquiryList].sort((left, right) => {
    if (sortState.key === "answerYn") {
      const answerCompare = getAnswerYnOrder(left.answerYn) - getAnswerYnOrder(right.answerYn);
      if (answerCompare !== 0) {
        return sortState.direction === "asc" ? answerCompare : answerCompare * -1;
      }

      return right.id - left.id;
    }

    const idCompare = left.id - right.id;
    if (idCompare !== 0) {
      return sortState.direction === "asc" ? idCompare : idCompare * -1;
    }

    const answerCompare = getAnswerYnOrder(left.answerYn) - getAnswerYnOrder(right.answerYn);
    if (answerCompare !== 0) {
      return answerCompare;
    }

    return 0;
  });

// 목록 테이블에서 바로 사용할 수 있는 문의 요약 행 모델로 변환
const toSummary = (row?: ContactApiInquiry | null): ContactInquirySummary | null => {
  const id = toPositiveInt(row?.id);
  if (!row || !id) {
    return null;
  }

  return {
    id,
    title: normalizeText(row.title),
    businessName: normalizeText(row.businessName),
    managerName: normalizeText(row.managerName),
    phoneNumber: normalizePhoneNumber(row.phoneNumber),
    email: normalizeEmail(row.email),
    submittedAt: normalizeText(row.submittedAt),
    createdAt: normalizeText(row.createdAt),
    answerYn: normalizeText(row.answerYn).toUpperCase() === "Y" ? "Y" : "N",
  };
};

// 상세 화면 본문에 필요한 문의 상세 모델로 변환
const toRecord = (row?: ContactApiInquiry | null): ContactInquiryRecord | null => {
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

// 답변 편집기 초기값으로 사용할 답변 모델로 변환
const toReply = (row?: ContactApiReply | null): ContactInquiryReplyRecord | null => {
  const id = toPositiveInt(row?.id);
  const inquiryId = toPositiveInt(row?.inquiryId);
  if (!row || !id || !inquiryId) {
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

// 브라우저가 공개 API를 직접 호출해서 네트워크 탭에 실제 호출 URL이 보이게 한다.
const fetchContactInquiryList = async () => {
  const response = await requestPublicWebApi<{ inquiry?: ContactApiInquiry[] }>("/contact/manage");
  if (!response.ok) {
    throw new Error(getPublicApiErrorMessage(response.payload, "문의 목록 조회 중 오류가 발생했습니다."));
  }

  return toArray<ContactApiInquiry>((response.payload as { inquiry?: ContactApiInquiry[] }).inquiry)
    .map((item) => toSummary(item))
    .filter((item): item is ContactInquirySummary => Boolean(item));
};

// 문의관리 상세 화면 진입 시 선택한 문의 원본을 조회
const fetchContactInquiryById = async (id: number) => {
  const inquiryId = toPositiveInt(id);
  if (!inquiryId) {
    return null;
  }

  const response = await requestPublicWebApi<{ inquiry?: ContactApiInquiry }>(`/contact/manage/${inquiryId}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(getPublicApiErrorMessage(response.payload, "문의 상세 조회 중 오류가 발생했습니다."));
  }

  return toRecord((response.payload as { inquiry?: ContactApiInquiry }).inquiry);
};

// 문의관리 상세 화면 하단 답변 편집기에 보여줄 저장된 답변 조회
const fetchContactInquiryReplyByInquiryId = async (inquiryId: number) => {
  const parsedInquiryId = toPositiveInt(inquiryId);
  if (!parsedInquiryId) {
    return null;
  }

  const response = await requestPublicWebApi<{ reply?: ContactApiReply | null }>(
    `/contact/manage/${parsedInquiryId}/reply`
  );
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(getPublicApiErrorMessage(response.payload, "문의 답변 조회 중 오류가 발생했습니다."));
  }

  return toReply((response.payload as { reply?: ContactApiReply | null }).reply);
};

// 목록 화면 등록일 표시에 사용하는 날짜 포맷 유틸
const formatSubmittedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 상세 화면 메타 정보에 사용하는 날짜/시간 포맷 유틸
const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export function ContactManageTableClient({ refreshKey, query, field }: ContactManageTableClientProps) {
  // 문의 목록 테이블에서 공통으로 쓰는 CSR 상태
  const [state, setState] = useState<ContactManageTableState>({
    isLoading: true,
    errorMessage: "",
    inquiryList: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [sortState, setSortState] = useState<ContactManageSortState>(DEFAULT_CONTACT_MANAGE_SORT_STATE);

  useEffect(() => {
    let isMounted = true;

    // 목록 페이지 진입 또는 새로고침 키 변경 시 최신 문의 목록을 다시 읽어온다.
    const loadInquiryList = async () => {
      try {
        const inquiryList = await fetchContactInquiryList();
        if (isMounted) {
          setState({ isLoading: false, errorMessage: "", inquiryList });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            isLoading: false,
            errorMessage: error instanceof Error ? error.message : "문의 목록 조회 중 오류가 발생했습니다.",
            inquiryList: [],
          });
        }
      }
    };

    setState((prev) => ({ ...prev, isLoading: true, errorMessage: "" }));
    void loadInquiryList();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    // 검색 조건이 바뀌면 목록 첫 페이지부터 다시 보여준다.
    setCurrentPage(1);
  }, [field, query, refreshKey]);

  const handleSortChange = (key: ContactManageSortKey, direction: ContactManageSortDirection) => {
    setSortState({ key, direction });
    setCurrentPage(1);
  };
  const handleSortToggle = (key: ContactManageSortKey) => {
    const nextDirection =
      sortState.key === key && sortState.direction === "asc"
        ? "desc"
        : "asc";

    handleSortChange(key, nextDirection);
  };

  const filteredInquiryList = state.inquiryList.filter((inquiry) => matchesInquirySearch(inquiry, query, field));
  const sortedInquiryList = sortInquiryList(filteredInquiryList, sortState);
  const totalPages = Math.max(1, Math.ceil(filteredInquiryList.length / CONTACT_MANAGE_PAGE_SIZE));
  const normalizedCurrentPage = clampPage(currentPage, totalPages);
  const pageStartIndex = (normalizedCurrentPage - 1) * CONTACT_MANAGE_PAGE_SIZE;
  const visibleInquiryList = sortedInquiryList.slice(pageStartIndex, pageStartIndex + CONTACT_MANAGE_PAGE_SIZE);
  const paginationPages = getPaginationPages(normalizedCurrentPage, totalPages);

  return (
    <>
      <div className="contact-manage-table-wrap">
        <table className="contact-manage-table" aria-label="고객 문의 목록">
          {/* 문의 목록 테이블 헤더 영역 */}
          <thead>
            <tr>
              <th
                scope="col"
                className="contact-manage-sort-header"
                onClick={() => handleSortToggle("id")}
              >
                <span className="contact-manage-sort-header-inner">
                  <span>No</span>
                  <span className="contact-manage-sort-button-group">
                    <button
                      type="button"
                      className={`contact-manage-sort-button ${sortState.key === "id" && sortState.direction === "asc" ? "contact-manage-sort-button-active" : ""}`}
                      aria-label="번호 정렬 방향 변경"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSortToggle("id");
                      }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className={`contact-manage-sort-button ${sortState.key === "id" && sortState.direction === "desc" ? "contact-manage-sort-button-active" : ""}`}
                      aria-label="번호 정렬 방향 변경"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSortToggle("id");
                      }}
                    >
                      ▼
                    </button>
                  </span>
                </span>
              </th>
              <th scope="col">제목</th>
              <th scope="col">업장명</th>
              <th scope="col">담당자</th>
              <th scope="col">연락처</th>
              <th scope="col">이메일</th>
              <th scope="col">등록일</th>
              <th
                scope="col"
                className="contact-manage-sort-header"
                onClick={() => handleSortToggle("answerYn")}
              >
                <span className="contact-manage-sort-header-inner">
                  <span>답변여부</span>
                  <span className="contact-manage-sort-button-group">
                    <button
                      type="button"
                      className={`contact-manage-sort-button ${sortState.key === "answerYn" && sortState.direction === "asc" ? "contact-manage-sort-button-active" : ""}`}
                      aria-label="답변여부 정렬 방향 변경"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSortToggle("answerYn");
                      }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className={`contact-manage-sort-button ${sortState.key === "answerYn" && sortState.direction === "desc" ? "contact-manage-sort-button-active" : ""}`}
                      aria-label="답변여부 정렬 방향 변경"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSortToggle("answerYn");
                      }}
                    >
                      ▼
                    </button>
                  </span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 목록 조회 중에는 테이블 안에서 동일한 레이아웃으로 로딩 문구를 노출 */}
            {state.isLoading && <tr><td colSpan={8} className="contact-manage-empty">문의 목록을 불러오는 중입니다.</td></tr>}
            {/* API 오류가 발생하면 같은 위치에 오류 문구를 노출 */}
            {!state.isLoading && state.errorMessage && <tr><td colSpan={8} className="contact-manage-empty">{state.errorMessage}</td></tr>}
            {/* 조회된 문의를 한 줄씩 렌더링하고 제목 셀에서 상세 페이지로 이동 */}
            {!state.isLoading && !state.errorMessage && visibleInquiryList.map((inquiry) => (
              <tr key={inquiry.id}>
                <td>{inquiry.id}</td>
                <td className="contact-manage-title-cell"><PageNavigationLink href={`/contact/manage/${inquiry.id}`} className="contact-manage-title-link">{inquiry.title || "-"}</PageNavigationLink></td>
                <td>{inquiry.businessName || "-"}</td>
                <td>{inquiry.managerName}</td>
                <td>{inquiry.phoneNumber}</td>
                <td>{inquiry.email}</td>
                <td>{formatSubmittedAt(inquiry.submittedAt || inquiry.createdAt)}</td>
                <td>
                  <span className={`contact-manage-answer-badge ${inquiry.answerYn === "Y" ? "contact-manage-answer-badge-done" : "contact-manage-answer-badge-pending"}`}>
                    {inquiry.answerYn === "Y" ? "답변완료" : "답변미완료"}
                  </span>
                </td>
              </tr>
            ))}
            {/* 정상 조회 결과가 비어 있으면 빈 목록 안내 문구를 노출 */}
            {!state.isLoading && !state.errorMessage && filteredInquiryList.length === 0 && <tr><td colSpan={8} className="contact-manage-empty">{query ? "검색 결과가 없습니다." : "접수된 문의가 없습니다."}</td></tr>}
          </tbody>
        </table>
      </div>

      {!state.isLoading && !state.errorMessage && totalPages > 1 && (
        <nav className="contact-manage-pagination" aria-label="문의관리 페이지 이동">
          <button
            type="button"
            className="contact-manage-pagination-button"
            onClick={() => setCurrentPage(1)}
            disabled={normalizedCurrentPage === 1}
          >
            처음
          </button>
          <button
            type="button"
            className="contact-manage-pagination-button"
            onClick={() => setCurrentPage((prev) => clampPage(prev - 1, totalPages))}
            disabled={normalizedCurrentPage === 1}
          >
            이전
          </button>
          {paginationPages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              className={`contact-manage-pagination-button contact-manage-pagination-button-number ${pageNumber === normalizedCurrentPage ? "contact-manage-pagination-button-active" : ""}`}
              onClick={() => setCurrentPage(pageNumber)}
              aria-current={pageNumber === normalizedCurrentPage ? "page" : undefined}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            className="contact-manage-pagination-button"
            onClick={() => setCurrentPage((prev) => clampPage(prev + 1, totalPages))}
            disabled={normalizedCurrentPage === totalPages}
          >
            다음
          </button>
          <button
            type="button"
            className="contact-manage-pagination-button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={normalizedCurrentPage === totalPages}
          >
            마지막
          </button>
        </nav>
      )}
    </>
  );
}

export function ContactManageDetailClient({ inquiryId, erpUserId, refreshKey }: ContactManageDetailClientProps) {
  // 문의 상세 카드와 답변 편집기에서 함께 쓰는 CSR 상태
  const [state, setState] = useState<ContactManageDetailState>({
    isLoading: true,
    errorMessage: "",
    inquiry: null,
    reply: null,
  });

  useEffect(() => {
    let isMounted = true;

    // 상세 페이지 진입 또는 저장 후 새로고침 시 문의 본문과 답변을 함께 다시 읽어온다.
    const loadInquiry = async () => {
      try {
        const [inquiry, reply] = await Promise.all([
          fetchContactInquiryById(inquiryId),
          fetchContactInquiryReplyByInquiryId(inquiryId),
        ]);

        if (isMounted) {
          setState({
            isLoading: false,
            errorMessage: inquiry ? "" : "문의 내역을 찾을 수 없습니다.",
            inquiry,
            reply,
          });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            isLoading: false,
            errorMessage: error instanceof Error ? error.message : "문의 상세 조회 중 오류가 발생했습니다.",
            inquiry: null,
            reply: null,
          });
        }
      }
    };

    setState((prev) => ({ ...prev, isLoading: true, errorMessage: "" }));
    void loadInquiry();
    return () => {
      isMounted = false;
    };
  }, [inquiryId, refreshKey]);

  if (state.isLoading || !state.inquiry) {
    return (
      <div className="contact-manage-wrap">
        <article className="contact-manage-detail-card">
          {/* 상세 데이터가 아직 없을 때 공통 안내 카드로 로딩/오류를 보여준다. */}
          <header className="contact-manage-detail-head"><h1 className="contact-manage-detail-name">문의관리</h1></header>
          <div className="contact-manage-detail-body">
            <div className="contact-manage-detail-row">
              <span className="contact-manage-detail-label">안내</span>
              <p className="contact-manage-detail-value">{state.isLoading ? "문의 상세를 불러오는 중입니다." : state.errorMessage}</p>
            </div>
          </div>
          <div className="contact-manage-detail-actions"><PageNavigationLink href="/contact/manage" className="contact-manage-detail-list-button">목록</PageNavigationLink></div>
        </article>
      </div>
    );
  }

  return (
    <div className="contact-manage-wrap">
      <article className="contact-manage-detail-card">
        {/* 문의 제목과 접수일을 보여주는 상세 상단 영역 */}
        <header className="contact-manage-detail-head">
          <h1 className="contact-manage-detail-name">{state.inquiry.title || "-"}</h1>
          <p className="contact-manage-detail-meta">
            <span className="contact-manage-detail-meta-label">접수일</span>{" "}
            <span className="contact-manage-detail-meta-date">{formatDateTime(state.inquiry.submittedAt || state.inquiry.createdAt)}</span>
          </p>
        </header>
        {/* 문의 본문 필드를 항목별로 보여주는 상세 정보 영역 */}
        <div className="contact-manage-detail-body">
          <div className="contact-manage-detail-row"><span className="contact-manage-detail-label">업장명</span><p className="contact-manage-detail-value">{state.inquiry.businessName}</p></div>
          <div className="contact-manage-detail-row"><span className="contact-manage-detail-label">담당자</span><p className="contact-manage-detail-value">{state.inquiry.managerName}</p></div>
          <div className="contact-manage-detail-row"><span className="contact-manage-detail-label">연락처</span><p className="contact-manage-detail-value">{state.inquiry.phoneNumber}</p></div>
          <div className="contact-manage-detail-row"><span className="contact-manage-detail-label">이메일</span><p className="contact-manage-detail-value">{state.inquiry.email}</p></div>
          <div className="contact-manage-detail-row"><span className="contact-manage-detail-label">현재 식단가</span><p className="contact-manage-detail-value">{state.inquiry.currentMealPrice}</p></div>
          <div className="contact-manage-detail-row"><span className="contact-manage-detail-label">희망 식단가</span><p className="contact-manage-detail-value">{state.inquiry.desiredMealPrice}</p></div>
          <div className="contact-manage-detail-row"><span className="contact-manage-detail-label">일 식수</span><p className="contact-manage-detail-value">{state.inquiry.dailyMealCount}</p></div>
          <div className="contact-manage-detail-row"><span className="contact-manage-detail-label">식사 구분</span><p className="contact-manage-detail-value">{state.inquiry.mealType}</p></div>
          <div className="contact-manage-detail-row"><span className="contact-manage-detail-label">업장 구분</span><p className="contact-manage-detail-value">{state.inquiry.businessType}</p></div>
          <div className="contact-manage-detail-row"><span className="contact-manage-detail-label">업체 변경 이유</span><p className="contact-manage-detail-value">{state.inquiry.switchingReason || "-"}</p></div>
          <div className="contact-manage-detail-row"><span className="contact-manage-detail-label">문의 내용</span><p className="contact-manage-detail-value">{state.inquiry.inquiryContent}</p></div>
        </div>
        {/* 목록으로 돌아가는 공통 액션 영역 */}
        <div className="contact-manage-detail-actions"><PageNavigationLink href="/contact/manage" className="contact-manage-detail-list-button">목록</PageNavigationLink></div>
      </article>
      {/* 저장된 답변 로딩 결과를 넘겨서 상세 하단 편집기와 메일 발송 UI를 구성 */}
      <ContactManageReplyEditor
        inquiryId={inquiryId}
        initialReply={state.reply}
        inquiryTitle={state.inquiry.title || "-"}
        inquiryContent={state.inquiry.inquiryContent || "-"}
        erpUserId={erpUserId}
      />
    </div>
  );
}
