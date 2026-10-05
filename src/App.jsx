import { useState, useEffect, useRef } from 'react'
import { useTravelStore } from './store/index.js'
import { auth, db, googleProvider } from './firebase.js'
import BottomNav from './components/BottomNav.jsx'
import LoginScreen from './views/LoginScreen.jsx'
import HomeView from './views/Home.jsx'
import NewTripView from './views/NewTrip.jsx'
import TripDetailView from './views/TripDetail.jsx'
import InventoryView from './views/Inventory.jsx'
import TemplatesView from './views/Templates.jsx'
import SettingsView from './views/Settings.jsx'

const ALLOWED_EMAIL = 'kharless@gmail.com'
const STORAGE_KEY = 'travel-os-v1'

const NAV_ITEMS = [
  { id: 'home',      icon: '🏠', label: 'Home' },
  { id: 'new-trip',  icon: '✈️', label: 'New Trip' },
  { id: 'inventory', icon: '📦', label: 'Inventory' },
  { id: 'templates', icon: '📋', label: 'Templates' },
  { id: 'settings',  icon: '⚙️', label: 'Settings' },
]

function sanitizeForFirestore(state) {
  return JSON.parse(JSON.stringify(state))
}

function SyncBadge({ status }) {
  if (!status) return null
  const map = {
    saving: { label: 'Saving…', color: 'text-[#6B7280]', dot: 'bg-[#9CA3AF] animate-pulse' },
    saved:  { label: 'Saved',   color: 'text-[#1B4332]', dot: 'bg-[#95C4A1]' },
    error:  { label: 'Sync error', color: 'text-[#EF4444]', dot: 'bg-[#EF4444]' },
  }
  const { label, color, dot } = map[status]
  return (
    <div className={`flex items-center gap-1.5 text-[11px] font-medium ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-none ${dot}`} />
      {label}
    </div>
  )
}

function Sidebar({ currentView, setView, user, onSignOut, syncStatus }) {
  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-[220px] bg-white border-r border-[#E5E7EB] z-40">
      <div className="px-5 h-16 flex items-center justify-between border-b border-[#E5E7EB]">
        <span className="text-xl font-bold text-[#1B4332] tracking-tight">Travel OS</span>
        <SyncBadge status={syncStatus} />
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
        <a
          href="https://notsexyfitness.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6B7280] hover:bg-[#F8F6F1] hover:text-[#2D2D2D] transition-colors"
        >
          <span className="text-base leading-none">🏋️</span>
          <span>Workouts</span>
        </a>
      </nav>
      {user && (
        <div className="px-4 py-3 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-2.5 mb-2.5">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || ''}
                className="w-7 h-7 rounded-full flex-none object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-xs font-bold flex-none">
                {(user.displayName || user.email || '?')[0].toUpperCase()}
              </div>
            )}
            <p className="text-xs font-semibold text-[#2D2D2D] truncate min-w-0">
              {user.displayName || user.email}
            </p>
          </div>
          <button
            onClick={onSignOut}
            className="w-full text-xs text-[#6B7280] hover:text-[#2D2D2D] hover:bg-[#F3F4F6] py-1.5 px-2 rounded-lg text-left transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </aside>
  )
}

export default function App() {
  const [view, setView] = useState('home')
  const [activeTripId, setActiveTripId] = useState(null)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const [signingIn, setSigningIn] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null) // null | 'saving' | 'saved' | 'error'
  const syncTimeoutRef = useRef(null)
  const justLoadedFromCloud = useRef(false)

  function showSyncStatus(status) {
    setSyncStatus(status)
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    if (status === 'saved' || status === 'error') {
      syncTimeoutRef.current = setTimeout(() => setSyncStatus(null), 2500)
    }
  }

  const {
    state,
    replaceAllState,
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

  // Auth state listener + handle redirect result (iOS Safari fallback)
  useEffect(() => {
    // On iOS, signInWithPopup silently falls back to a redirect flow.
    // We need to pick up the result when the page reloads after the redirect.
    auth.getRedirectResult()
      .then(result => {
        if (result?.user) {
          if (result.user.email !== ALLOWED_EMAIL) {
            auth.signOut()
            setAuthError('Access restricted.')
          }
        }
      })
      .catch(err => {
        if (err.code !== 'auth/no-auth-event') {
          setAuthError('Sign-in failed. Please try again.')
        }
      })

    const unsubscribe = auth.onAuthStateChanged(u => {
      setUser(u)
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

  // Firestore real-time sync — subscribe when user logs in
  useEffect(() => {
    if (!user) return

    // Track whether the first snapshot has been received (to avoid seeding over existing data)
    let firstSnapshot = true
    const unsubscribe = db.collection('travelos_users').doc(user.uid)
      .onSnapshot({ includeMetadataChanges: true }, doc => {
        const isPending = doc.metadata.hasPendingWrites
        const isFromCache = doc.metadata.fromCache

        if (doc.exists) {
          if (!isPending && !isFromCache) {
            justLoadedFromCloud.current = true
            replaceAllState(doc.data())
          }
        } else if (firstSnapshot) {
          const currentState = sanitizeForFirestore(state)
          if (currentState.trips?.length > 0) {
            db.collection('travelos_users').doc(user.uid)
              .set(currentState)
              .catch(console.error)
          }
        }
        firstSnapshot = false
      }, err => console.error('Firestore sync error:', err))

    return unsubscribe
  }, [user?.uid]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced write to Firestore on every state change
  useEffect(() => {
    if (!user) return
    if (justLoadedFromCloud.current) {
      justLoadedFromCloud.current = false
      return
    }
    showSyncStatus('saving')
    const timer = setTimeout(() => {
      db.collection('travelos_users').doc(user.uid)
        .set(sanitizeForFirestore(state))
        .then(() => showSyncStatus('saved'))
        .catch(err => { console.error(err); showSyncStatus('error') })
    }, 1000)
    return () => clearTimeout(timer)
  }, [state, user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSignIn() {
    setAuthError(null)
    setSigningIn(true)
    try {
      const result = await auth.signInWithPopup(googleProvider)
      if (result.user.email !== ALLOWED_EMAIL) {
        await auth.signOut()
        setAuthError('Access restricted.')
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError('Sign-in failed. Please try again.')
      }
    } finally {
      setSigningIn(false)
    }
  }

  function handleSignOut() {
    localStorage.removeItem(STORAGE_KEY)
    auth.signOut()
  }

  function handleTripCreated(id) {
    setActiveTripId(id)
    setView('trip-detail')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1B4332' }}>
        <div className="text-white text-sm opacity-60">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onSignIn={handleSignIn} error={authError} loading={signingIn} />
  }

  const navView = view === 'trip-detail' ? 'home' : view

  return (
    <div className="flex min-h-screen bg-[#F8F6F1]">
      <Sidebar currentView={navView} setView={setView} user={user} onSignOut={handleSignOut} syncStatus={syncStatus} />

      {/* Mobile sync indicator — only visible on small screens */}
      {syncStatus && (
        <div className="lg:hidden fixed top-3 right-3 z-50 bg-white border border-[#E5E7EB] rounded-full px-3 py-1.5 shadow-sm">
          <SyncBadge status={syncStatus} />
        </div>
      )}


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
