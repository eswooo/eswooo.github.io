# 오늘 점심 뭐 먹지? 🍚

내 위치 기반 점심 식당 추천 웹앱. 카카오맵으로 주변 음식점을 찾아 3가지 방식으로 추천합니다.

- 🎲 **랜덤 룰렛** — 주변 음식점 중 무작위 1곳
- 🍽️ **필터 추천** — 카테고리(한식/중식/일식 등) + 반경으로 필터 후 랜덤
- 📋 **목록** — 거리순 목록

위치 권한이 거부되면 **주소를 직접 입력**해 같은 흐름으로 추천받을 수 있습니다.

## 기술 스택
- React + Vite (백엔드 없는 클라이언트 SPA)
- 카카오맵 JS SDK (`services` 라이브러리 — Places, Geocoder)

## 시작하기

### 1. 카카오 JavaScript 키 발급
1. [카카오 개발자 콘솔](https://developers.kakao.com)에서 애플리케이션 추가
2. **플랫폼 > Web**에 사이트 도메인 등록: `http://localhost:5173`
   (배포 시 배포 도메인도 추가)
3. **앱 키 > JavaScript 키** 복사

> REST 키가 아니라 **JavaScript 키**입니다. 지도 SDK와 장소 검색 모두 JS 키로 동작하며,
> 도메인 제한으로 키를 보호합니다.

### 2. 환경변수 설정
```bash
cp .env.example .env
# .env 파일을 열어 VITE_KAKAO_MAP_KEY 에 발급받은 JavaScript 키 입력
```

### 3. 실행
```bash
npm install
npm run dev
```
브라우저에서 `http://localhost:5173` 접속.

## 스크립트
- `npm run dev` — 개발 서버
- `npm run build` — 프로덕션 빌드
- `npm run lint` — ESLint
- `npm run preview` — 빌드 결과 미리보기

## 구조
```
src/
  lib/kakao.js              # SDK 로더 + 검색/지오코딩 래퍼
  hooks/useGeolocation.js   # 브라우저 위치 수집
  context/LocationContext   # 확정 좌표 공유
  components/
    LocationGate.jsx        # 위치 권한 / 주소 직접 입력
    TabNav.jsx
    RouletteTab.jsx
    FilterTab.jsx
    ListTab.jsx
    RestaurantCard.jsx
    MapView.jsx             # 카카오 지도 + 마커
```
