import { useState } from 'react'
import { tripDays } from '../utils/dates.js'

function makeFlight() {
  return {
    id: `fl-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    depAirport: '',
    arrAirport: '',
    date: '',
    time: '',
    airline: '',
    flightNumber: '',
  }
}

export function makePhase(overrides = {}) {
  return {
    id: `ph-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    hasFlights: true,
    travelDays: 2,
    flights: [],
    ...overrides,
  }
}

export function FlightBuilder({ flights = [], onChange }) {
  function addFlight() {
    onChange([...flights, makeFlight()])
  }

  function update(id, key, val) {
    onChange(flights.map(f => f.id === id ? { ...f, [key]: val } : f))
  }

  function remove(id) {
    onChange(flights.filter(f => f.id !== id))
  }

  return (
    <div className="space-y-2">
      {flights.map(f => (
        <div key={f.id} className="flex flex-wrap gap-1.5 items-center bg-[#F9FAFB] rounded-lg p-2 border border-[#E5E7EB]">
          <input
            value={f.depAirport}
            onChange={e => update(f.id, 'depAirport', e.target.value.toUpperCase())}
            placeholder="DEP"
            maxLength={4}
            className="input text-center font-mono uppercase"
            style={{ width: '4rem' }}
          />
          <span className="text-[#9CA3AF] text-sm font-medium">→</span>
          <input
            value={f.arrAirport}
            onChange={e => update(f.id, 'arrAirport', e.target.value.toUpperCase())}
            placeholder="ARR"
            maxLength={4}
            className="input text-center font-mono uppercase"
            style={{ width: '4rem' }}
          />
          <input
            type="date"
            value={f.date}
            onChange={e => update(f.id, 'date', e.target.value)}
            className="input"
            style={{ width: '9.5rem' }}
          />
          <input
            type="time"
            value={f.time}
            onChange={e => update(f.id, 'time', e.target.value)}
            className="input"
            style={{ width: '7rem' }}
          />
          <input
            value={f.airline}
            onChange={e => update(f.id, 'airline', e.target.value)}
            placeholder="Airline"
            className="input flex-1 min-w-[5rem]"
          />
          <input
            value={f.flightNumber}
            onChange={e => update(f.id, 'flightNumber', e.target.value)}
            placeholder="Flight #"
            className="input"
            style={{ width: '6rem' }}
          />
          <button
            type="button"
            onClick={() => remove(f.id)}
            className="text-[#9CA3AF] hover:text-red-400 text-lg leading-none px-1"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addFlight}
        className="text-sm text-[#1B4332] font-medium flex items-center gap-1 py-1"
      >
        + Add Flight
      </button>
    </div>
  )
}

function PhaseCard({ phase, index, total, onUpdate, onRemove }) {
  const [flightsOpen, setFlightsOpen] = useState(false)
  const days = tripDays(phase.departureDate, phase.returnDate)
  const flights = phase.flights || []

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#f0f7f3] border-b border-[#dcefdf]">
        <span className="text-sm font-semibold text-[#1B4332]">Phase {index + 1}</span>
        <div className="flex items-center gap-3">
          {days > 0 && <span className="text-xs text-[#1B4332]">{days}d</span>}
          {total > 2 && (
            <button type="button" onClick={onRemove} className="text-xs text-red-400 font-medium">
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Phase Name</label>
            <input
              value={phase.name}
              onChange={e => onUpdate('name', e.target.value)}
              placeholder="e.g. Cannes"
              className="input"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Destination</label>
            <input
              value={phase.destination}
              onChange={e => onUpdate('destination', e.target.value)}
              placeholder="e.g. Cannes, France"
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
            <input
              type="date"
              value={phase.departureDate}
              onChange={e => onUpdate('departureDate', e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">End Date</label>
            <input
              type="date"
              value={phase.returnDate}
              onChange={e => onUpdate('returnDate', e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Includes a flight?</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{phase.hasFlights ? 'Yes' : 'No'}</span>
            <div
              onClick={() => onUpdate('hasFlights', !phase.hasFlights)}
              className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${phase.hasFlights ? 'bg-[#1B4332]' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${phase.hasFlights ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </div>
        </div>

        {phase.hasFlights && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 flex-1">Flight days (compression socks):</span>
            <button type="button" onClick={() => onUpdate('travelDays', Math.max(2, (phase.travelDays ?? 2) - 1))} className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold flex items-center justify-center">−</button>
            <span className="text-sm font-semibold text-gray-800 w-5 text-center">{phase.travelDays ?? 2}</span>
            <button type="button" onClick={() => onUpdate('travelDays', (phase.travelDays ?? 2) + 1)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold flex items-center justify-center">+</button>
          </div>
        )}

        <div className="border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={() => setFlightsOpen(o => !o)}
            className="flex items-center justify-between w-full text-sm font-medium text-[#1B4332]"
          >
            <span>✈ Flights{flights.length > 0 ? ` (${flights.length})` : ''}</span>
            <span className="text-xs text-gray-400">{flightsOpen ? '▲ hide' : '▼ show'}</span>
          </button>
          {flightsOpen && (
            <div className="mt-2">
              <FlightBuilder
                flights={flights}
                onChange={val => onUpdate('flights', val)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PhaseBuilder({ phases, onChange }) {
  function updatePhase(i, key, val) {
    const next = phases.map((p, j) => j === i ? { ...p, [key]: val } : p)
    if (key === 'returnDate' && i < next.length - 1 && !next[i + 1].departureDate) {
      next[i + 1] = { ...next[i + 1], departureDate: val }
    }
    onChange(next)
  }

  function addPhase() {
    const last = phases[phases.length - 1]
    onChange([...phases, makePhase({ departureDate: last?.returnDate || '' })])
  }

  function removePhase(i) {
    if (phases.length <= 2) return
    onChange(phases.filter((_, j) => j !== i))
  }

  return (
    <div className="space-y-3">
      {phases.map((ph, i) => (
        <PhaseCard
          key={ph.id}
          phase={ph}
          index={i}
          total={phases.length}
          onUpdate={(key, val) => updatePhase(i, key, val)}
          onRemove={() => removePhase(i)}
        />
      ))}
      <button
        type="button"
        onClick={addPhase}
        className="w-full py-2.5 rounded-xl border border-dashed border-[#95C4A1] text-sm text-[#1B4332] font-medium flex items-center justify-center gap-2"
      >
        <span className="text-base leading-none">+</span> Add Phase
      </button>
    </div>
  )
}
