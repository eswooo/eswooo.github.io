import { useState, useEffect } from 'react'
import { useLocation } from '../context/LocationContext'
import { searchByKeyword, searchNearbyRestaurants } from '../lib/kakao'
import { CATEGORIES } from '../lib/categories'
import RestaurantCard from './RestaurantCard'
import MapView from './MapView'

const RADIUS_OPTIONS = [500, 1000, 1500, 2000]

// 주변 음식점 목록: 검색 + 카테고리 + 반경 + 정렬(거리순/추천순)
export default function ListTab() {
  const { coords } = useLocation()
  const [category, setCategory] = useState('all')
  const [keyword, setKeyword] = useState('') // 입력 중인 검색어
  const [query, setQuery] = useState('') // 확정된 검색어(검색 실행 시)
  const [radius, setRadius] = useState(1500)
  const [sort, setSort] = useState('distance') // 'distance' | 'accuracy'
  const [places, setPlaces] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 데이터 패칭 시작 시 로딩 표시
    setLoading(true)
    setError(null)
    setSelected(null) // 새 검색이면 선택 해제

    const opts = { x: coords.lng, y: coords.lat, radius, sort, maxResults: 45 }
    const cat = CATEGORIES.find((c) => c.key === category)
    let req
    if (query.trim()) {
      req = searchByKeyword(query.trim(), opts) // 검색어 우선
    } else if (cat.keyword) {
      req = searchByKeyword(cat.keyword, opts) // 카테고리
    } else {
      req = searchNearbyRestaurants(opts) // 전체
    }

    req
      .then((list) => {
        if (cancelled) return
        const sorted =
          sort === 'distance'
            ? [...list].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
            : list
        setPlaces(sorted)
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [coords, category, query, radius, sort])

  const submitSearch = (e) => {
    e.preventDefault()
    setQuery(keyword)
  }

  const clearSearch = () => {
    setKeyword('')
    setQuery('')
  }

  return (
    <div className="tab-panel">
      <form className="search-row" onSubmit={submitSearch}>
        <input
          className="search-row__input"
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="검색 (예: 김밥, 스타벅스)"
        />
        {query && (
          <button type="button" className="search-row__clear" onClick={clearSearch} title="검색 지우기">
            ✕
          </button>
        )}
        <button type="submit" className="search-row__btn">
          검색
        </button>
      </form>

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

      <div className="radius-row">
        <span className="radius-label">정렬</span>
        <button
          className={`chip ${sort === 'distance' ? 'chip--active' : ''}`}
          onClick={() => setSort('distance')}
        >
          거리순
        </button>
        <button
          className={`chip ${sort === 'accuracy' ? 'chip--active' : ''}`}
          onClick={() => setSort('accuracy')}
        >
          추천순
        </button>
      </div>

      {loading && <p className="status">목록을 불러오는 중…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && places.length === 0 && (
        <p className="status">조건에 맞는 음식점이 없어요. 반경을 넓혀보세요.</p>
      )}

      {!loading && places.length > 0 && (
        <>
          <MapView center={coords} places={places} selected={selected} />
          <p className="list-count">
            총 {places.length}곳 ({sort === 'distance' ? '거리순' : '추천순'}) · 카드를 누르면 지도에 표시
          </p>
          <div className="list">
            {places.map((p) => (
              <RestaurantCard
                key={p.id}
                place={p}
                selected={selected?.id === p.id}
                onSelect={() => setSelected(p)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
