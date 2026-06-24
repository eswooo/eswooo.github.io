// 랜덤/시간 헬퍼 (React Compiler purity 린트 회피 + 재사용)
export const now = () => performance.now()

export const randInt = (n) => Math.floor(Math.random() * n)

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
