import { useState } from 'react'

// 멤버(참가자) 로스터를 localStorage에 보관하고 참여 토글을 관리.
// '누가 쏠까'와 미니게임 멀티플레이가 같은 멤버를 공유한다.
const MEMBERS_KEY = 'lunch:bet-members'
const ACTIVE_KEY = 'lunch:bet-active'
const LEGACY_KEY = 'lunch:bet-names'

export function parseNames(text) {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function loadRoster() {
  try {
    const raw = localStorage.getItem(MEMBERS_KEY)
    if (raw) return JSON.parse(raw)
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) return parseNames(legacy)
  } catch {
    /* 무시 */
  }
  return []
}

function loadActive(roster) {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch {
    /* 무시 */
  }
  return new Set(roster)
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 무시 */
  }
}

export function useMembers() {
  const [roster, setRoster] = useState(loadRoster)
  const [active, setActive] = useState(() => loadActive(loadRoster()))

  const names = roster.filter((n) => active.has(n)) // 참여자

  const add = (text) => {
    const toAdd = parseNames(text)
    if (!toAdd.length) return
    setRoster((prev) => {
      const next = [...prev]
      toAdd.forEach((n) => {
        if (!next.includes(n)) next.push(n)
      })
      save(MEMBERS_KEY, next)
      return next
    })
    setActive((prev) => {
      const next = new Set(prev)
      toAdd.forEach((n) => next.add(n))
      save(ACTIVE_KEY, [...next])
      return next
    })
  }

  const toggle = (name) => {
    setActive((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      save(ACTIVE_KEY, [...next])
      return next
    })
  }

  const remove = (name) => {
    setRoster((prev) => {
      const next = prev.filter((n) => n !== name)
      save(MEMBERS_KEY, next)
      return next
    })
    setActive((prev) => {
      const next = new Set(prev)
      next.delete(name)
      save(ACTIVE_KEY, [...next])
      return next
    })
  }

  const setAll = (on) => {
    const next = on ? new Set(roster) : new Set()
    setActive(next)
    save(ACTIVE_KEY, [...next])
  }

  return { roster, active, names, add, toggle, remove, setAll }
}
