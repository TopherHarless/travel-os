import { useState } from 'react'
import { useTravelStore } from './store/index.js'
import BottomNav from './components/BottomNav.jsx'
import HomeView from './views/Home.jsx'
import NewTripView from './views/NewTrip.jsx'
import TripDetailView from './views/TripDetail.jsx'
import InventoryView from './views/Inventory.jsx'
import TemplatesView from './views/Templates.jsx'
import SettingsView from './views/Settings.jsx'

const NAV_ITEMS = [
  { id: 'home',      icon: '🏠', label: 'Home' },
  { id: 'new-trip',  icon: '✈️', label: 'New Trip' },
  { id: 'inventory', icon: '📦', label: 'Inventory' },
  { id: 'templates', icon: '📋', label: 'Templates' },
  { id: 'settings',  icon: '⚙️', label: 'Settings' },
]

function Sidebar({ currentView, setView }) {
  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-[220px] bg-white border-r border-[#E5E7EB] z-40">
      <div className="px-5 h-16 flex items-center border-b border-[#E5E7EB]">
        <span className="text-xl font-bold text-[#1B4332] tracking-tight">Travel OS</span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
              currentView === item.id
                ? 'bg-[#1B4332] text-white'
                : 'text-[#6B7280] hover:bg-[#F8F6F1] hover:text-[#2D2D2D]'
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-[#E5E7EB]">
        <p className="text-xs text-[#6B7280]">Harless Family</p>
      </div>
    </aside>
  )
}

export default function App() {
  const [view, setView] = useState('home')
  const [activeTripId, setActiveTripId] = useState(null)

  const {
    state,
    addTrip,
    updateTrip,
    deleteTrip,
    archiveTrip,
    toggleItem,
    toggleTask,
    setItemPhase,
    addTraveler,
    updateTraveler,
    addBag,
    updateBag,
    updateSettings,
    addUserItem,
    updateUserItem,
    deleteUserItem,
    addTripItem,
    removeTripItem,
    restoreTripItem,
    addTemplateItem,
    removeTemplateItem,
    restoreTemplateItem,
    deleteTemplateItem,
    updateTemplateItem,
    addCustomTripType,
    deleteCustomTripType,
    softDeleteBuiltinTripType,
    overrideItem,
    deleteItem,
  } = useTravelStore()

  function handleTripCreated(id) {
    setActiveTripId(id)
    setView('trip-detail')
  }

  const navView = view === 'trip-detail' ? 'home' : view

  return (
    <div className="flex min-h-screen bg-[#F8F6F1]">
      <Sidebar currentView={navView} setView={setView} />

      <div className="flex-1 lg:ml-[220px] flex flex-col min-h-screen min-w-0">
        {view === 'home' && (
          <HomeView
            state={state}
            setView={setView}
            setActiveTripId={setActiveTripId}
          />
        )}

        {view === 'new-trip' && (
          <NewTripView
            state={state}
            addTrip={addTrip}
            onBack={() => setView('home')}
            onCreated={handleTripCreated}
          />
        )}

        {view === 'trip-detail' && (
          <TripDetailView
            state={state}
            tripId={activeTripId}
            onBack={() => setView('home')}
            toggleItem={toggleItem}
            toggleTask={toggleTask}
            setItemPhase={setItemPhase}
            archiveTrip={archiveTrip}
            updateTrip={updateTrip}
            addTripItem={addTripItem}
            removeTripItem={removeTripItem}
            restoreTripItem={restoreTripItem}
            addUserItem={addUserItem}
          />
        )}

        {view === 'inventory' && (
          <InventoryView
            state={state}
            addUserItem={addUserItem}
            updateUserItem={updateUserItem}
            deleteUserItem={deleteUserItem}
            overrideItem={overrideItem}
            deleteItem={deleteItem}
          />
        )}

        {view === 'templates' && (
          <TemplatesView
            state={state}
            addUserItem={addUserItem}
            addTemplateItem={addTemplateItem}
            removeTemplateItem={removeTemplateItem}
            restoreTemplateItem={restoreTemplateItem}
            deleteTemplateItem={deleteTemplateItem}
            updateTemplateItem={updateTemplateItem}
            addCustomTripType={addCustomTripType}
            deleteCustomTripType={deleteCustomTripType}
            softDeleteBuiltinTripType={softDeleteBuiltinTripType}
          />
        )}

        {view === 'settings' && (
          <SettingsView
            state={state}
            addTraveler={addTraveler}
            updateTraveler={updateTraveler}
            addBag={addBag}
            updateBag={updateBag}
            updateSettings={updateSettings}
          />
        )}

        <BottomNav currentView={navView} setView={setView} />
      </div>
    </div>
  )
}
