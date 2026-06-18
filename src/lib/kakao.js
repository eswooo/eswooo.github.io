// 카카오맵 JS SDK 로더 + 검색/지오코딩 래퍼
//
// 백엔드가 없는 클라이언트 전용 앱이므로 REST API(REST 키 노출) 대신
// JS SDK의 services 라이브러리(Places, Geocoder)를 사용한다.
// JS 키는 클라이언트에 노출되지만 카카오 콘솔의 도메인 제한으로 보호한다.

const APP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY
const SDK_URL = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${APP_KEY}&libraries=services&autoload=false`

let loadPromise = null

/**
 * 카카오 SDK를 한 번만 로드하고 maps 초기화를 보장한다.
 * @returns {Promise<typeof window.kakao>}
 */
export function loadKakao() {
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    if (!APP_KEY) {
      reject(new Error('VITE_KAKAO_MAP_KEY 가 설정되지 않았습니다. .env 파일을 확인하세요.'))
      return
    }
    // 이미 로드된 경우
    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
      resolve(window.kakao)
      return
    }

    const script = document.createElement('script')
    script.src = SDK_URL
    script.async = true
    script.onload = () => {
      window.kakao.maps.load(() => resolve(window.kakao))
    }
    script.onerror = () =>
      reject(new Error('카카오 지도 SDK 로드 실패. 네트워크 또는 앱 키를 확인하세요.'))
    document.head.appendChild(script)
  })

  return loadPromise
}

// Places 검색 결과(raw)를 앱에서 쓰기 좋은 형태로 정규화
function normalizePlace(p) {
  return {
    id: p.id,
    name: p.place_name,
    category: p.category_name, // "음식점 > 한식 > 국밥" 형태
    categoryGroup: p.category_group_code, // FD6, CE7 등
    phone: p.phone,
    address: p.address_name,
    roadAddress: p.road_address_name,
    x: p.x, // 경도(lng)
    y: p.y, // 위도(lat)
    distance: p.distance ? Number(p.distance) : null, // m 단위 (좌표 기준 검색 시)
    placeUrl: p.place_url,
  }
}

// services.Pagination 콜백을 Promise로 감싸는 공통 헬퍼
function runSearch(executor) {
  return loadKakao().then(
    (kakao) =>
      new Promise((resolve, reject) => {
        const { Status } = kakao.maps.services
        executor(kakao, (data, status) => {
          if (status === Status.OK) {
            resolve(data.map(normalizePlace))
          } else if (status === Status.ZERO_RESULT) {
            resolve([])
          } else {
            reject(new Error('카카오 장소 검색에 실패했습니다.'))
          }
        })
      }),
  )
}

/**
 * 좌표 주변 음식점(FD6) 검색.
 * @param {{ x:number|string, y:number|string, radius?:number, sort?:'distance'|'accuracy', size?:number }} opts
 * @returns {Promise<Array>}
 */
export function searchNearbyRestaurants({ x, y, radius = 1000, sort = 'distance', size = 15 }) {
  return runSearch((kakao, cb) => {
    const places = new kakao.maps.services.Places()
    const sortBy =
      sort === 'distance'
        ? kakao.maps.services.SortBy.DISTANCE
        : kakao.maps.services.SortBy.ACCURACY
    places.categorySearch('FD6', cb, { x, y, radius, sort: sortBy, size })
  })
}

/**
 * 키워드 + 좌표 기반 검색 (예: "한식", "초밥").
 * @param {string} keyword
 * @param {{ x:number|string, y:number|string, radius?:number, size?:number }} opts
 * @returns {Promise<Array>}
 */
export function searchByKeyword(keyword, { x, y, radius = 1000, size = 15 }) {
  return runSearch((kakao, cb) => {
    const places = new kakao.maps.services.Places()
    places.keywordSearch(keyword, cb, {
      x,
      y,
      radius,
      sort: kakao.maps.services.SortBy.DISTANCE,
      size,
      category_group_code: 'FD6',
    })
  })
}

/**
 * 주소 문자열 → 좌표 변환 (위치 수집 실패 시 직접 입력 폴백용).
 * @param {string} address
 * @returns {Promise<{ lat:number, lng:number, addressName:string }>}
 */
export function addressToCoords(address) {
  return loadKakao().then(
    (kakao) =>
      new Promise((resolve, reject) => {
        const geocoder = new kakao.maps.services.Geocoder()
        const { Status } = kakao.maps.services
        geocoder.addressSearch(address, (result, status) => {
          if (status === Status.OK && result.length > 0) {
            const r = result[0]
            resolve({ lat: Number(r.y), lng: Number(r.x), addressName: r.address_name })
          } else {
            // 주소 검색이 안 되면 키워드(지역명/건물명)로 한 번 더 시도
            const places = new kakao.maps.services.Places()
            places.keywordSearch(address, (data, kwStatus) => {
              if (kwStatus === Status.OK && data.length > 0) {
                const d = data[0]
                resolve({ lat: Number(d.y), lng: Number(d.x), addressName: d.place_name })
              } else {
                reject(new Error('해당 위치를 찾을 수 없습니다. 다시 입력해 주세요.'))
              }
            })
          }
        })
      }),
  )
}
