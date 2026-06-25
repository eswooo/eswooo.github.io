// Phaser를 게임 진입 시에만 동적 import (앱 초기 번들과 분리). 1회 캐시.
let cached = null
export function loadPhaser() {
  if (!cached) cached = import('phaser').then((m) => m.default ?? m)
  return cached
}
