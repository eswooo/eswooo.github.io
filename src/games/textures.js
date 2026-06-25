// 코드로 그린 재사용 텍스처 (에셋 없이 스프라이트 사용 → 회전/스쿼시/파티클 가능)
export function makeTextures(scene, Phaser) {
  const rad = Phaser.Math.DegToRad
  const g = scene.make.graphics({ x: 0, y: 0, add: false })

  // 야구공: 흰 원 + 빨강 시접
  g.clear()
  g.fillStyle(0xffffff, 1)
  g.fillCircle(22, 22, 20)
  g.lineStyle(2, 0xdcdcdc, 1)
  g.strokeCircle(22, 22, 20)
  g.lineStyle(2.5, 0xd23a3a, 1)
  g.beginPath()
  g.arc(22, 22, 15, rad(118), rad(242), false)
  g.strokePath()
  g.beginPath()
  g.arc(22, 22, 15, rad(-62), rad(62), false)
  g.strokePath()
  g.generateTexture('bb_ball', 44, 44)

  // 축구공: 흰 원 + 검정 오각형 근사
  g.clear()
  g.fillStyle(0xffffff, 1)
  g.fillCircle(22, 22, 20)
  g.lineStyle(2, 0xcccccc, 1)
  g.strokeCircle(22, 22, 20)
  g.fillStyle(0x1a1a1a, 1)
  g.fillCircle(22, 22, 6) // 중앙
  for (let i = 0; i < 5; i++) {
    const a = rad(-90 + i * 72)
    g.fillCircle(22 + Math.cos(a) * 13, 22 + Math.sin(a) * 13, 3.6)
  }
  g.generateTexture('soccer', 44, 44)

  // 스파크 (파티클)
  g.clear()
  g.fillStyle(0xffffff, 1)
  g.fillCircle(6, 6, 5)
  g.generateTexture('spark', 12, 12)

  // 배트 (테이퍼 + 손잡이 + 하이라이트)
  g.clear()
  g.fillStyle(0xa9743e, 1)
  g.fillRoundedRect(6, 3, 42, 9, 4)
  g.fillStyle(0x7a4f25, 1)
  g.fillCircle(5, 7.5, 4) // 손잡이 끝
  g.fillStyle(0xcd9b66, 0.7)
  g.fillRoundedRect(10, 4.5, 34, 2.4, 1)
  g.generateTexture('bat', 52, 16)

  // 골키퍼 (머리 + 유니폼 + 장갑)
  g.clear()
  g.fillStyle(0xe85a26, 1)
  g.fillRoundedRect(11, 18, 18, 24, 6) // 몸통
  g.fillStyle(0x1f2330, 1)
  g.fillRoundedRect(13, 40, 6, 9, 2)
  g.fillRoundedRect(21, 40, 6, 9, 2) // 다리
  g.fillStyle(0xffd9b3, 1)
  g.fillCircle(20, 12, 8) // 머리
  g.fillStyle(0x2d6cdf, 1)
  g.fillCircle(6, 22, 6)
  g.fillCircle(34, 22, 6) // 장갑
  g.generateTexture('keeper', 40, 54)

  g.destroy()
}
