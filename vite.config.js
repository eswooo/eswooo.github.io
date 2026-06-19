import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // LAN의 다른 기기에서 내 IP로 접속 허용 (0.0.0.0 바인딩)
    port: 5173,
    strictPort: true, // 5173 사용 중이면 다른 포트로 옮기지 않고 실패 (카카오 등록 도메인 고정 목적)
    // 카카오는 raw IP 도메인 등록을 막으므로 nip.io(=IP로 해석되는 공개 DNS)로 우회한다.
    // 예: http://172.29.58.37.nip.io:5173 → 172.29.58.37 로 해석. 이 호스트로의 접속을 허용.
    allowedHosts: ['.nip.io'],
  },
})
