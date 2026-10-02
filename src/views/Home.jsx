import { formatDateShort, tripDays } from '../utils/dates.js'
import { TRIP_TYPES } from '../data/tripTypes.js'

const TRAVELER_LABELS = { topher: 'Topher', lanita: 'La Nita', crosby: 'Crosby', penn: 'Penn' }

const TRAVELER_AVATAR_COLORS = {
  topher: '#1B4332',
  lanita: '#9D174D',
  crosby: '#065F46',
  penn:   '#92400E',
}

function TripCard({ trip, onOpen }) {
  const typeData = TRIP_TYPES.find(t => t.id === trip.type)
  const days = tripDays(trip.departureDate, trip.returnDate)
  const depDate = new Date(trip.departureDate + 'T12:00:00')
  const now = new Date()
  const daysUntil = Math.ceil((depDate - now) / (1000 * 60 * 60 * 24))
  const checkedCount = Object.values(trip.checkedItems || {}).filter(Boolean).length

  return (
    <button
      onClick={onOpen}
      className="w-full bg-white rounded-xl border border-[#E5E7EB] p-5 text-left active:scale-[0.99] transition-transform"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl flex-none">{typeData?.icon || '✈️'}</span>
          <h3 className="font-bold text-[#1B4332] text-[17px] leading-tight truncate">{trip.name}</h3>
        </div>
        {!trip.isArchived && daysUntil > 0 && (
          <span className="text-xs bg-[#1B4332] text-white rounded-full px-2.5 py-1 flex-none font-semibold whitespace-nowrap">
            {daysUntil}d away
          </span>
        )}
        {trip.isArchived && (
          <span className="text-xs bg-[#F3F4F6] text-[#6B7280] rounded-full px-2.5 py-1 flex-none">done</span>
        )}
      </div>

      <p className="text-[15px] font-medium text-[#2D2D2D] mb-0.5 truncate">
        {trip.destination || '—'}
      </p>
      <p className="text-[13px] text-[#6B7280] mb-4">
        {formatDateShort(trip.departureDate)} → {formatDateShort(trip.returnDate)} · {days} day{days !== 1 ? 's' : ''}
      </p>

      {/* Traveler avatars + packed count */}
      <div className="flex items-center gap-1.5">
        {(trip.selectedTravelers || []).map(id => {
          const label = TRAVELER_LABELS[id] || id
          const color = TRAVELER_AVATAR_COLORS[id] || '#6B7280'
          return (
            <span
              key={id}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-none"
              style={{ backgroundColor: color }}
              title={label}
            >
              {label.charAt(0)}
            </span>
          )
        })}
        {checkedCount > 0 && (
          <span className="ml-auto text-[13px] text-[#6B7280]">{checkedCount} packed</span>
        )}
      </div>
    </button>
  )
}

export default function HomeView({ state, setView, setActiveTripId }) {
  const { trips } = state
  const upcoming = trips.filter(t => !t.isArchived)
  const archived = trips.filter(t => t.isArchived)

  function openTrip(id) {
    setActiveTripId(id)
    setView('trip-detail')
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 lg:pb-8">
      {/* Page header */}
      <header className="sticky top-0 bg-white border-b border-[#E5E7EB] z-40">
        <div className="flex items-center justify-between gap-3 px-4 lg:px-8 h-14 max-w-[1100px] mx-auto">
          <h1 className="text-[24px] font-bold text-[#1B4332]">Home</h1>
          <button
            onClick={() => setView('new-trip')}
            className="bg-[#1B4332] text-white text-sm font-semibold px-5 py-2 rounded-lg active:bg-[#143528] transition-colors"
          >
            + New Trip
          </button>
        </div>
      </header>

      <div className="flex-1 px-4 lg:px-8 pt-6 max-w-[1100px] mx-auto w-full">
        {/* Upcoming */}
        <section className="mb-6">
          <h2 className="section-header mb-3 pb-2 border-b border-[#E5E7EB]">Upcoming Trips</h2>
          {upcoming.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-[#E5E7EB]" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <p className="text-4xl mb-3">🗺️</p>
              <p className="text-[15px] text-[#6B7280] mb-4">No upcoming trips yet</p>
              <button
                onClick={() => setView('new-trip')}
                className="bg-[#1B4332] text-white text-sm font-semibold px-6 py-2.5 rounded-lg active:bg-[#143528] transition-colors"
              >
                Plan your first trip
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(trip => (
                <TripCard key={trip.id} trip={trip} onOpen={() => openTrip(trip.id)} />
              ))}
            </div>
          )}
        </section>

        {/* New Trip CTA — full width on mobile */}
        {upcoming.length > 0 && (
          <button
            onClick={() => setView('new-trip')}
            className="w-full lg:w-auto bg-[#1B4332] text-white text-[15px] font-semibold px-6 py-3 rounded-lg active:bg-[#143528] transition-colors mb-6"
          >
            + New Trip
          </button>
        )}

        {/* Archive */}
        {archived.length > 0 && (
          <section className="mb-6">
            <h2 className="section-header mb-3 pb-2 border-b border-[#E5E7EB]">Archive</h2>
            <div className="space-y-3">
              {archived.map(trip => (
                <TripCard key={trip.id} trip={trip} onOpen={() => openTrip(trip.id)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
