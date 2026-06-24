import { useState } from 'react'

// 카카오 카테고리 경로 "음식점 > 한식 > 국밥" → { genre: '한식', detail: '국밥' }
// detail(세부분류)이 사실상 주메뉴 힌트 역할. (카카오 무료 SDK는 실제 메뉴를 안 줌)
function categoryInfo(category) {
  if (!category) return { genre: '', detail: '' }
  const parts = category
    .split('>')
    .map((s) => s.trim())
    .filter(Boolean)
  const meaningful = parts[0] === '음식점' ? parts.slice(1) : parts
  const genre = meaningful[0] || ''
  const detail = meaningful[meaningful.length - 1] || genre
  return { genre, detail }
}

function formatDistance(d) {
  if (d == null) return ''
  return d >= 1000 ? `${(d / 1000).toFixed(1)}km` : `${d}m`
}

export default function RestaurantCard({ place, highlight = false }) {
  const [copied, setCopied] = useState(false)
  if (!place) return null
  const { genre, detail } = categoryInfo(place.category)
  const hasMenuHint = detail && detail !== genre
  // 카카오맵 길찾기 딥링크 (목적지 = 이 식당). y=위도, x=경도
  const navUrl = `https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.y},${place.x}`

  const handleShare = async () => {
    const text = `오늘 점심 추천: ${place.name}${genre ? ` (${genre})` : ''}\n${place.roadAddress || place.address}`
    const url = place.placeUrl
    const shareData = { title: place.name, text, url }

    // 1) 네이티브 공유 시트 (주로 모바일)
    if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
      try {
        await navigator.share(shareData)
        return
      } catch (err) {
        if (err.name === 'AbortError') return // 사용자가 취소 → 폴백 안 함
        // 그 외 실패는 아래 클립보드 폴백으로 진행
      }
    }

    // 2) 클립보드 복사 폴백 (데스크톱/미지원)
    const full = `${text}\n${url}`
    try {
      await navigator.clipboard.writeText(full)
    } catch {
      // clipboard도 막힌 경우(비보안 컨텍스트 등) 최후 폴백
      const ta = document.createElement('textarea')
      ta.value = full
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch {
        /* 무시 */
      }
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`card ${highlight ? 'card--highlight' : ''}`}>
      <div className="card__head">
        <h3 className="card__name">{place.name}</h3>
        {place.distance != null && (
          <span className="card__distance">{formatDistance(place.distance)}</span>
        )}
      </div>
      <div className="card__meta">
        {genre && <span className="card__cat">{genre}</span>}
        {hasMenuHint && (
          <span className="card__main">{highlight ? `주메뉴 · ${detail}` : `· ${detail}`}</span>
        )}
        {place.phone && <span className="card__phone">{place.phone}</span>}
      </div>
      <p className="card__addr">{place.roadAddress || place.address}</p>
      <div className="card__actions">
        <a className="card__nav" href={navUrl} target="_blank" rel="noreferrer">
          🧭 길찾기
        </a>
        <button type="button" className="card__share" onClick={handleShare}>
          {copied ? '✅ 복사됨!' : '📤 공유'}
        </button>
        <a className="card__link" href={place.placeUrl} target="_blank" rel="noreferrer">
          카카오맵에서 보기 →
        </a>
      </div>
    </div>
  )
}
