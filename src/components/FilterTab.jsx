import { useState, useCallback } from 'react'
import { useLocation } from '../context/LocationContext'
import { searchByKeyword, searchNearbyRestaurants } from '../lib/kakao'
import RestaurantCard from './RestaurantCard'
import MapView from './MapView'

const CATEGORIES = [
  { key: 'all', label: '전체', keyword: null },
  { key: 'korean', label: '한식', keyword: '한식' },
  { key: 'chinese', label: '중식', keyword: '중식' },
  { key: 'japanese', label: '일식', keyword: '일식' },
  { key: 'western', label: '양식', keyword: '양식' },
  { key: 'bunsik', label: '분식', keyword: '분식' },
  { key: 'chicken', label: '치킨', keyword: '치킨' },
  { key: 'cafe', label: '카페/디저트', keyword: '카페' },
]

const RADIUS_OPTIONS = [500, 1000, 1500, 2000]

// 카테고리 + 반경으로 필터 후, 그 안에서 랜덤 1곳.
export default function FilterTab() {
  const { coords } = useLocation()
  const [category, setCategory] = useState('all')
  const [radius, setRadius] = useState(1000)
  const [results, setResults] = useState([])
  const [picked, setPicked] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  const pickRandom = useCallback((list) => {
    if (!list.length) return null
    return list[Math.floor(Math.random() * list.length)]
  }, [])

  const search = async () => {
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const cat = CATEGORIES.find((c) => c.key === category)
      const list = cat.keyword
        ? await searchByKeyword(cat.keyword, { x: coords.lng, y: coords.lat, radius })
        : await searchNearbyRestaurants({ x: coords.lng, y: coords.lat, radius, sort: 'distance' })
      setResults(list)
      setPicked(pickRandom(list))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tab-panel">
      <div className="filter-controls">
        <div className="chip-row">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              className={`chip ${category === c.key ? 'chip--active' : ''}`}
              onClick={() => setCategory(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="radius-row">
          <span className="radius-label">반경</span>
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              className={`chip ${radius === r ? 'chip--active' : ''}`}
              onClick={() => setRadius(r)}
            >
              {r < 1000 ? `${r}m` : `${r / 1000}km`}
            </button>
          ))}
        </div>
        <button className="primary-btn" onClick={search} disabled={loading}>
          {loading ? '검색 중…' : '🍽️ 추천 받기'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {searched && !loading && !error && results.length === 0 && (
        <p className="status">조건에 맞는 음식점이 없어요. 반경을 넓혀보세요.</p>
      )}

      {picked && (
        <>
          <RestaurantCard place={picked} highlight />
          <button className="secondary-btn" onClick={() => setPicked(pickRandom(results))}>
            🎲 다른 곳 추천 ({results.length}곳 중)
          </button>
          <MapView center={coords} places={picked ? [picked] : []} selected={picked} />
        </>
      )}
    </div>
  )
}
