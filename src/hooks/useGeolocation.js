import { useState, useCallback } from 'react'

// 브라우저 Geolocation 래핑 훅.
// status: 'idle' | 'loading' | 'success' | 'error'
export function useGeolocation() {
  const [status, setStatus] = useState('idle')
  const [coords, setCoords] = useState(null) // { lat, lng }
  const [error, setError] = useState(null)

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('error')
      setError('이 브라우저는 위치 기능을 지원하지 않습니다.')
      return
    }

    setStatus('loading')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('success')
      },
      (err) => {
        const messages = {
          1: '위치 권한이 거부되었습니다. 주소를 직접 입력해 주세요.',
          2: '위치를 확인할 수 없습니다. 주소를 직접 입력해 주세요.',
          3: '위치 확인 시간이 초과되었습니다. 주소를 직접 입력해 주세요.',
        }
        setError(messages[err.code] || '위치를 가져오지 못했습니다.')
        setStatus('error')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }, [])

  // 직접 입력 등으로 좌표를 외부에서 확정할 때
  const setManualCoords = useCallback((c) => {
    setCoords(c)
    setStatus('success')
    setError(null)
  }, [])

  return { status, coords, error, request, setManualCoords }
}
