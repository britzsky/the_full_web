import React from "react";
import { Metadata } from "next";
import MainLanding from "@/app/components/Home/MainLanding";
import { getContactManageAccess } from "@/app/lib/adminAccess";

// 루트 페이지 메타데이터 정의
export const metadata: Metadata = {
  // 메인 페이지 메타데이터
  title: "(주)더채움 | 메인",
};

// 메인 화면: Home 함수 로직
export default async function Home() {
  const canManageContact = await getContactManageAccess();

  // 메인 랜딩 화면 컴포넌트 렌더링
  return <MainLanding canManageContact={canManageContact} />;
}
