import { useEffect, useState } from 'react'
import { useGeolocation } from '../hooks/useGeolocation'
import { addressToCoords, coordsToAddress } from '../lib/kakao'
import { getRecentLocations } from '../lib/recentLocations'

// 자주 쓰는 위치 빠른 선택 (고정 프리셋)
const PRESETS = [{ label: '🏢 중앙일보 빌딩', query: '중앙일보' }]

// 위치 확보 게이트.
// 1) 진입 시 자동으로 브라우저 위치 요청 → 성공 시 역지오코딩해 라벨 부여
// 2) 실패하면 주소 직접 입력 폼 노출 → 좌표 변환
// 프리셋/최근 위치로도 바로 진입 가능. 좌표 확정 시 onReady({ coords, label }) 호출
export default function LocationGate({ onReady }) {
  const { status, coords, error, request } = useGeolocation()
  const [address, setAddress] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [manualError, setManualError] = useState(null)
  const [recents] = useState(getRecentLocations)

  // 최초 1회 위치 요청
  useEffect(() => {
    request()
  }, [request])

  // 위치 수집 성공 시 역지오코딩으로 라벨을 붙여 상위로 전달
  useEffect(() => {
    if (status !== 'success' || !coords) return
    let cancelled = false
    coordsToAddress(coords).then((label) => {
      if (!cancelled) onReady({ coords, label })
    })
    return () => {
      cancelled = true
    }
  }, [status, coords, onReady])

  const goToAddress = async (query) => {
    const q = query.trim()
    if (!q) return
    setGeocoding(true)
    setManualError(null)
    try {
      const r = await addressToCoords(q)
      onReady({ coords: { lat: r.lat, lng: r.lng }, label: r.addressName })
    } catch (err) {
      setManualError(err.message)
    } finally {
      setGeocoding(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    goToAddress(address)
  }

  // 프리셋 + 최근 위치 빠른 선택 (로딩/직접입력 화면 공통)
  const quickPicks = (
    <>
      <div className="preset-row">
        <span className="radius-label">빠른 선택</span>
        {PRESETS.map((p) => (
          <button key={p.query} className="chip" onClick={() => goToAddress(p.query)} disabled={geocoding}>
            {p.label}
          </button>
        ))}
      </div>
      {recents.length > 0 && (
        <div className="preset-row">
          <span className="radius-label">최근 위치</span>
          {recents.map((r) => (
            <button
              key={r.label}
              className="chip"
              onClick={() => onReady({ coords: { lat: r.lat, lng: r.lng }, label: r.label })}
              disabled={geocoding}
            >
              📍 {r.label}
            </button>
          ))}
        </div>
      )}
    </>
  )

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="gate">
        <div className="spinner" />
        <p>현재 위치를 확인하는 중…</p>
        <p className="hint">브라우저에서 위치 권한을 허용해 주세요.</p>
        {quickPicks}
      </div>
    )
  }

  // status === 'error' → 직접 입력
  return (
    <div className="gate">
      <h2>위치를 직접 입력해 주세요</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="address-form">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="예: 강남역, 서울시 중구 세종대로 110"
          autoFocus
        />
        <button type="submit" disabled={geocoding || !address.trim()}>
          {geocoding ? '찾는 중…' : '이 위치로 시작'}
        </button>
      </form>
      {manualError && <p className="error">{manualError}</p>}

      {quickPicks}

      <button className="link-btn" onClick={request} disabled={status === 'loading'}>
        위치 권한 다시 시도
      </button>
    </div>
  )
}
