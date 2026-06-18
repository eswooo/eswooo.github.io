import { createContext, useContext } from 'react'

// 확정된 좌표 { lat, lng } 와 위치 라벨을 하위 탭에 공유
export const LocationContext = createContext({ coords: null, label: '' })

export function useLocation() {
  return useContext(LocationContext)
}
