// 최근 사용한 위치를 localStorage에 보관 (검색/직접입력/GPS 공통)
const KEY = 'lunch:recent-locations'
const MAX = 6

export function getRecentLocations() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// label 기준 중복 제거 후 맨 앞에 추가, 최대 MAX개 유지
export function addRecentLocation({ label, lat, lng }) {
  if (!label || lat == null || lng == null) return getRecentLocations()
  const list = getRecentLocations().filter((r) => r.label !== label)
  list.unshift({ label, lat, lng, at: Date.now() })
  const trimmed = list.slice(0, MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed))
  } catch {
    /* 저장 실패는 무시 */
  }
  return trimmed
}
