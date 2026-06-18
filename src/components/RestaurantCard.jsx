// 카테고리 문자열 "음식점 > 한식 > 국밥" 에서 마지막 의미있는 분류만 추출
function shortCategory(category) {
  if (!category) return ''
  const parts = category.split('>').map((s) => s.trim())
  return parts[parts.length - 1] || parts[0]
}

function formatDistance(d) {
  if (d == null) return ''
  return d >= 1000 ? `${(d / 1000).toFixed(1)}km` : `${d}m`
}

export default function RestaurantCard({ place, highlight = false }) {
  if (!place) return null
  return (
    <div className={`card ${highlight ? 'card--highlight' : ''}`}>
      <div className="card__head">
        <h3 className="card__name">{place.name}</h3>
        {place.distance != null && (
          <span className="card__distance">{formatDistance(place.distance)}</span>
        )}
      </div>
      <div className="card__meta">
        <span className="card__cat">{shortCategory(place.category)}</span>
        {place.phone && <span className="card__phone">{place.phone}</span>}
      </div>
      <p className="card__addr">{place.roadAddress || place.address}</p>
      <a className="card__link" href={place.placeUrl} target="_blank" rel="noreferrer">
        카카오맵에서 보기 / 길찾기 →
      </a>
    </div>
  )
}
