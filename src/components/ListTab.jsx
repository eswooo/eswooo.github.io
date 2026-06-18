import { useState, useEffect } from 'react'
import { useLocation } from '../context/LocationContext'
import { searchNearbyRestaurants } from '../lib/kakao'
import RestaurantCard from './RestaurantCard'
import MapView from './MapView'

// 주변 음식점을 거리순으로 나열.
export default function ListTab() {
  const { coords } = useLocation()
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [radius, setRadius] = useState(1500)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 데이터 패칭 시작 시 로딩 표시
    setLoading(true)
    setError(null)
    searchNearbyRestaurants({ x: coords.lng, y: coords.lat, radius, sort: 'distance' })
      .then((list) => {
        if (cancelled) return
        // 카카오가 거리순으로 주지만 안전하게 한 번 더 정렬
        setPlaces([...list].sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0)))
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [coords, radius])

  return (
    <div className="tab-panel">
      <div className="radius-row">
        <span className="radius-label">반경</span>
        {[500, 1000, 1500, 2000].map((r) => (
          <button
            key={r}
            className={`chip ${radius === r ? 'chip--active' : ''}`}
            onClick={() => setRadius(r)}
          >
            {r < 1000 ? `${r}m` : `${r / 1000}km`}
          </button>
        ))}
      </div>

      {loading && <p className="status">목록을 불러오는 중…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && places.length === 0 && (
        <p className="status">주변에 음식점이 없어요.</p>
      )}

      {!loading && places.length > 0 && (
        <>
          <MapView center={coords} places={places} />
          <p className="list-count">총 {places.length}곳 (거리순)</p>
          <div className="list">
            {places.map((p) => (
              <RestaurantCard key={p.id} place={p} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
