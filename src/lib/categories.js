// 음식 카테고리 (필터/목록 탭 공용). keyword=null 이면 '전체'(카테고리 검색).
export const CATEGORIES = [
  { key: 'all', label: '전체', keyword: null },
  { key: 'korean', label: '한식', keyword: '한식' },
  { key: 'chinese', label: '중식', keyword: '중식' },
  { key: 'japanese', label: '일식', keyword: '일식' },
  { key: 'western', label: '양식', keyword: '양식' },
  { key: 'bunsik', label: '분식', keyword: '분식' },
  { key: 'chicken', label: '치킨', keyword: '치킨' },
  { key: 'burger', label: '햄버거', keyword: '햄버거' },
  { key: 'fastfood', label: '패스트푸드', keyword: '패스트푸드' },
  { key: 'pizza', label: '피자', keyword: '피자' },
  { key: 'cafe', label: '카페/디저트', keyword: '카페' },
]
