// 홍보 화면: PromotionSearchField 타입 모델
export type PromotionSearchField = "title" | "content" | "all";

// 홍보 화면: PromotionPost 타입 모델
export type PromotionPost = {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
};

// 홍보 화면: PromotionPostSummary 타입 모델
export type PromotionPostSummary = {
  id: number;
  title: string;
  author: string;
  createdAt: string;
};

// 홍보 화면: PromotionPostInput 타입 모델
export type PromotionPostInput = {
  title: string;
  content: string;
  author?: string;
};

// 홍보 화면: PromotionPostUpdate 타입 모델
export type PromotionPostUpdate = Partial<PromotionPostInput>;
