// 홍보 화면: 표시용 포맷 처리
export const formatPromotionDate = (isoString: string) => {
// 홍보 화면: date 정의
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }

// 홍보 화면: year 정의
  const year = date.getFullYear();
// 홍보 화면: month 정의
  const month = String(date.getMonth() + 1).padStart(2, "0");
// 홍보 화면: day 정의
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
