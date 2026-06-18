import { useState } from 'react'
import { LocationContext } from './context/LocationContext'
import LocationGate from './components/LocationGate'
import TabNav from './components/TabNav'
import RouletteTab from './components/RouletteTab'
import FilterTab from './components/FilterTab'
import ListTab from './components/ListTab'
import './App.css'

const TABS = [
  { key: 'roulette', label: '랜덤 룰렛', icon: '🎲' },
  { key: 'filter', label: '필터 추천', icon: '🍽️' },
  { key: 'list', label: '목록', icon: '📋' },
]

export default function App() {
  const [location, setLocation] = useState(null) // { coords, label }
  const [tab, setTab] = useState('roulette')

  return (
    <div className="app">
      <header className="app-header">
        <h1>오늘 점심 뭐 먹지? 🍚</h1>
        {location && (
          <button className="loc-badge" onClick={() => setLocation(null)} title="위치 변경">
            📍 {location.label}
          </button>
        )}
      </header>

      {!location ? (
        <LocationGate onReady={setLocation} />
      ) : (
        <LocationContext.Provider value={location}>
          <TabNav tabs={TABS} active={tab} onChange={setTab} />
          <main className="content">
            {tab === 'roulette' && <RouletteTab />}
            {tab === 'filter' && <FilterTab />}
            {tab === 'list' && <ListTab />}
          </main>
        </LocationContext.Provider>
      )}

      <footer className="app-footer">데이터 제공 · 카카오맵</footer>
    </div>
  )
}
