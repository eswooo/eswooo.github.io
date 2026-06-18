import { useState, useEffect, useCallback } from 'react'
import { useLocation } from '../context/LocationContext'
import { searchNearbyRestaurants } from '../lib/kakao'
import RestaurantCard from './RestaurantCard'
import MapView from './MapView'

// 주변 음식점 중 랜덤 1곳을 뽑아준다.
export default function RouletteTab() {
  const { coords } = useLocation()
  const [places, setPlaces] = useState([])
  const [picked, setPicked] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [spinning, setSpinning] = useState(false)

  const pickRandom = useCallback((list) => {
    if (!list.length) return null
    return list[Math.floor(Math.random() * list.length)]
  }, [])

  // 좌표 기준 주변 음식점 로드
  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 데이터 패칭 시작 시 로딩 표시
    setLoading(true)
    setError(null)
    searchNearbyRestaurants({ x: coords.lng, y: coords.lat, radius: 1500, sort: 'distance' })
      .then((list) => {
        if (cancelled) return
        setPlaces(list)
        setPicked(pickRandom(list))
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [coords, pickRandom])

  const reroll = () => {
    if (!places.length) return
    setSpinning(true)
    // 잠깐 돌아가는 느낌의 연출
    let count = 0
    const timer = setInterval(() => {
      setPicked(pickRandom(places))
      count += 1
      if (count >= 8) {
        clearInterval(timer)
        setSpinning(false)
      }
    }, 80)
  }

  if (loading) return <p className="status">주변 음식점을 찾는 중…</p>
  if (error) return <p className="error">{error}</p>
  if (!places.length) return <p className="status">주변 1.5km 내 음식점을 찾지 못했어요.</p>

  return (
    <div className="tab-panel">
      <div className="roulette-result">
        <RestaurantCard place={picked} highlight />
      </div>
      <button className="primary-btn" onClick={reroll} disabled={spinning}>
        {spinning ? '뽑는 중…' : '🎲 다시 뽑기'}
      </button>
      <MapView center={coords} places={picked ? [picked] : []} selected={picked} />
    </div>
  )
}
