// 카카오맵 JS SDK 로더 + 검색/지오코딩 래퍼
//
// 백엔드가 없는 클라이언트 전용 앱이므로 REST API(REST 키 노출) 대신
// JS SDK의 services 라이브러리(Places, Geocoder)를 사용한다.
// JS 키는 클라이언트에 노출되지만 카카오 콘솔의 도메인 제한으로 보호한다.

const APP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY
// HTTPS 명시. 프로토콜 상대(//)는 HTTP 페이지(LAN IP 접속)에서 http://dapi... 로 풀려 로드 실패할 수 있음.
const SDK_URL = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${APP_KEY}&libraries=services&autoload=false`

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

// 페이지네이션 누적 헬퍼.
// 카카오는 한 페이지에 최대 15곳만 주므로, maxResults 까지 페이지를 누적한다.
// start(kakao, handle) 로 첫 검색을 시작하고, handle 의 3번째 인자 pagination 으로 이어 받는다.
function paginatedSearch(start, maxResults) {
  return loadKakao().then(
    (kakao) =>
      new Promise((resolve, reject) => {
        const { Status } = kakao.maps.services
        const acc = []
        const handle = (data, status, pagination) => {
          if (status === Status.OK) {
            acc.push(...data.map(normalizePlace))
            if (pagination.hasNextPage && acc.length < maxResults) {
              pagination.nextPage() // 같은 콜백을 다음 페이지로 재호출
            } else {
              resolve(acc.slice(0, maxResults))
            }
          } else if (status === Status.ZERO_RESULT) {
            resolve(acc) // 첫 페이지 없거나 더 없으면 지금까지 누적분 반환
          } else {
            reject(new Error('카카오 장소 검색에 실패했습니다.'))
          }
        }
        start(kakao, handle)
      }),
  )
}

/**
 * 좌표 주변 음식점(FD6) 검색.
 * 카카오는 한 페이지에 최대 15곳만 주므로, maxResults 까지 페이지를 누적한다.
 * 기본 정렬은 accuracy — distance 로 두면 "가장 가까운 15곳"에만 몰려 랜덤 풀이 좁아진다.
 * (좌표를 넘기므로 정렬과 무관하게 각 결과의 distance 필드는 채워진다.)
 * @param {{ x:number|string, y:number|string, radius?:number, sort?:'distance'|'accuracy', maxResults?:number }} opts
 * @returns {Promise<Array>}
 */
export function searchNearbyRestaurants({ x, y, radius = 1000, sort = 'accuracy', maxResults = 45 }) {
  return paginatedSearch((kakao, handle) => {
    const places = new kakao.maps.services.Places()
    const { SortBy } = kakao.maps.services
    const sortBy = sort === 'distance' ? SortBy.DISTANCE : SortBy.ACCURACY
    places.categorySearch('FD6', handle, { x, y, radius, sort: sortBy, size: 15 })
  }, maxResults)
}

/**
 * 키워드 + 좌표 기반 검색 (예: "한식", "초밥"). maxResults 까지 페이지 누적.
 * @param {string} keyword
 * @param {{ x:number|string, y:number|string, radius?:number, maxResults?:number }} opts
 * @returns {Promise<Array>}
 */
export function searchByKeyword(keyword, { x, y, radius = 1000, maxResults = 15 }) {
  return paginatedSearch((kakao, handle) => {
    const places = new kakao.maps.services.Places()
    places.keywordSearch(keyword, handle, {
      x,
      y,
      radius,
      sort: kakao.maps.services.SortBy.DISTANCE,
      size: 15,
      category_group_code: 'FD6',
    })
  }, maxResults)
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

/**
 * 좌표 → 주소명 변환 (GPS로 잡은 위치에 사람이 읽을 라벨을 붙일 때).
 * 실패해도 reject하지 않고 '현재 위치' 로 폴백한다.
 * @param {{ lat:number, lng:number }} coords
 * @returns {Promise<string>}
 */
export function coordsToAddress({ lat, lng }) {
  return loadKakao().then(
    (kakao) =>
      new Promise((resolve) => {
        const geocoder = new kakao.maps.services.Geocoder()
        const { Status } = kakao.maps.services
        geocoder.coord2Address(lng, lat, (result, status) => {
          if (status === Status.OK && result.length > 0) {
            const r = result[0]
            const road = r.road_address && r.road_address.address_name
            const jibun = r.address && r.address.address_name
            resolve(road || jibun || '현재 위치')
          } else {
            resolve('현재 위치')
          }
        })
      }),
  )
}
