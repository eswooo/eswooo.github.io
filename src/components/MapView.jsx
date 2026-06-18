import { useEffect, useRef } from 'react'
import { loadKakao } from '../lib/kakao'

// 중심 좌표 + 식당 목록을 마커로 표시. selected 가 있으면 강조 + 중심 이동.
export default function MapView({ center, places = [], selected }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])

  // 지도 1회 생성
  useEffect(() => {
    let cancelled = false
    loadKakao().then((kakao) => {
      if (cancelled || !containerRef.current) return
      mapRef.current = new kakao.maps.Map(containerRef.current, {
        center: new kakao.maps.LatLng(center.lat, center.lng),
        level: 4,
      })
    })
    return () => {
      cancelled = true
    }
    // center 는 최초 1회만 사용 (이후 갱신은 아래 effect가 처리)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 마커 갱신
  useEffect(() => {
    if (!mapRef.current) return
    loadKakao().then((kakao) => {
      const map = mapRef.current
      if (!map) return

      // 기존 마커 제거
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []

      const bounds = new kakao.maps.LatLngBounds()

      // 내 위치 마커
      const myPos = new kakao.maps.LatLng(center.lat, center.lng)
      bounds.extend(myPos)

      places.forEach((p) => {
        const pos = new kakao.maps.LatLng(Number(p.y), Number(p.x))
        const isSel = selected && selected.id === p.id
        const marker = new kakao.maps.Marker({ position: pos, map })
        if (isSel) {
          const info = new kakao.maps.InfoWindow({
            content: `<div style="padding:4px 8px;font-size:12px;white-space:nowrap;">${p.name}</div>`,
          })
          info.open(map, marker)
        }
        markersRef.current.push(marker)
        bounds.extend(pos)
      })

      if (selected) {
        map.setCenter(new kakao.maps.LatLng(Number(selected.y), Number(selected.x)))
        map.setLevel(3)
      } else if (places.length > 0) {
        map.setBounds(bounds)
      }
    })
  }, [places, selected, center])

  return <div ref={containerRef} className="map" />
}
