import { useEffect, useState } from 'react'
import { useGeolocation } from '../hooks/useGeolocation'
import { addressToCoords } from '../lib/kakao'

// 위치 확보 게이트.
// 1) 진입 시 자동으로 브라우저 위치 요청
// 2) 실패하면 주소 직접 입력 폼 노출 → 좌표 변환
// 좌표가 확정되면 onReady({ coords, label }) 호출
export default function LocationGate({ onReady }) {
  const { status, coords, error, request } = useGeolocation()
  const [address, setAddress] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [manualError, setManualError] = useState(null)

  // 최초 1회 위치 요청
  useEffect(() => {
    request()
  }, [request])

  // 위치 수집 성공 시 상위로 전달
  useEffect(() => {
    if (status === 'success' && coords) {
      onReady({ coords, label: '현재 위치' })
    }
  }, [status, coords, onReady])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const q = address.trim()
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

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="gate">
        <div className="spinner" />
        <p>현재 위치를 확인하는 중…</p>
        <p className="hint">브라우저에서 위치 권한을 허용해 주세요.</p>
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
      <button className="link-btn" onClick={request} disabled={status === 'loading'}>
        위치 권한 다시 시도
      </button>
    </div>
  )
}
