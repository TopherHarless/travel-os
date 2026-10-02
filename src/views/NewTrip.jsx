import { useState } from 'react'
import { getEffectiveTripTypes, getEffectiveTripType } from '../data/tripTypes.js'
import { tripDays, ageAtDate } from '../utils/dates.js'
import Header from '../components/Header.jsx'
import PhaseBuilder, { makePhase, FlightBuilder } from '../components/PhaseBuilder.jsx'

const TRAVELER_ORDER = ['topher', 'lanita', 'crosby', 'penn']
const TRAVELER_LABELS = { topher: 'Topher', lanita: 'La Nita', crosby: 'Crosby', penn: 'Penn' }
const BAG_OWNER_LABELS = { topher: 'Topher', lanita: 'La Nita', penn: 'Penn', crosby: 'Crosby' }

function initPhases(form) {
  return [
    makePhase({ name: '', destination: form.destination, departureDate: form.departureDate, hasFlights: form.hasFlights, travelDays: form.travelDays }),
    makePhase({ departureDate: '' }),
  ]
}

export default function NewTripView({ state, addTrip, onBack, onCreated }) {
  const { travelers, bags } = state
  const activeBags = bags.filter(b => b.active)
  const [form, setForm] = useState({
    name: '',
    type: 'solo-intl-work',
    destination: '',
    departureDate: '',
    returnDate: '',
    flights: [],
    selectedTravelers: ['topher'],
    washingMachineAvailable: false,
    suitDays: 0,
    dressShirtDays: 0,
    extraDressShirtPhase2: false,
    selectedSuits: [],
    travelDays: 2,
    hasFlights: true,
    selectedBags: activeBags.filter(b => b.owner === 'topher').map(b => b.id),
    isMultiPhase: false,
    phases: null,
    notes: '',
  })
  const [errors, setErrors] = useState({})

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  const tripTypes = getEffectiveTripTypes(state.customTripTypes, state.deletedTripTypeIds)

  function onTypeChange(type) {
    const td = getEffectiveTripType(type, state.customTripTypes, state.deletedTripTypeIds)
    const newTravelers = td?.defaultTravelers || ['topher']
    const newHasFlights = td?.config?.isFlying ?? true
    set('type', type)
    set('selectedTravelers', newTravelers)
    set('hasFlights', newHasFlights)
    if (!newHasFlights) set('travelDays', 0)
    set('selectedBags', activeBags.filter(b => newTravelers.includes(b.owner)).map(b => b.id))
  }

  function toggleTraveler(id) {
    set('selectedTravelers',
      form.selectedTravelers.includes(id)
        ? form.selectedTravelers.filter(t => t !== id)
        : [...form.selectedTravelers, id]
    )
  }

  function toggleBag(bagId) {
    set('selectedBags',
      form.selectedBags.includes(bagId)
        ? form.selectedBags.filter(b => b !== bagId)
        : [...form.selectedBags, bagId]
    )
  }

  function handleMultiPhaseToggle() {
    const next = !form.isMultiPhase
    if (next && !form.phases) {
      setForm(f => ({ ...f, isMultiPhase: true, phases: initPhases(f) }))
    } else {
      set('isMultiPhase', next)
    }
  }

  const days = form.isMultiPhase
    ? (form.phases || []).reduce((s, p) => s + (tripDays(p.departureDate, p.returnDate) || 0), 0)
    : tripDays(form.departureDate, form.returnDate)

  const firstPhaseDate = form.isMultiPhase ? form.phases?.[0]?.departureDate : form.departureDate
  const typeData = getEffectiveTripType(form.type, state.customTripTypes, state.deletedTripTypeIds)
  const isBusiness = typeData?.config?.isBusiness

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Trip name required'
    if (form.isMultiPhase) {
      const phases = form.phases || []
      if (phases.length < 2) e.phases = 'At least 2 phases required'
      if (!phases[0]?.departureDate) e.phases = 'First phase needs a start date'
      if (!phases[phases.length - 1]?.returnDate) e.phases = 'Last phase needs an end date'
    } else {
      if (!form.departureDate) e.departureDate = 'Departure date required'
      if (!form.returnDate) e.returnDate = 'Return date required'
      if (form.departureDate && form.returnDate && form.returnDate < form.departureDate) e.returnDate = 'Return must be after departure'
    }
    if (form.selectedTravelers.length === 0) e.travelers = 'Select at least one traveler'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    let tripData = { ...form }
    if (form.isMultiPhase && form.phases?.length > 0) {
      const phases = form.phases
      const first = phases[0], last = phases[phases.length - 1]
      tripData.departureDate = first.departureDate
      tripData.returnDate    = last.returnDate
      tripData.destination   = phases.map(p => p.name || p.destination).filter(Boolean).join(' → ')
      tripData.hasFlights    = phases.some(p => p.hasFlights)
      tripData.travelDays    = phases.reduce((s, p) => s + (p.hasFlights ? Math.max(2, p.travelDays ?? 2) : 0), 0)
    }

    const id = addTrip(tripData)
    onCreated(id)
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 lg:pb-8">
      <Header title="New Trip" onBack={onBack} />

      <form onSubmit={handleSubmit} className="flex-1 px-4 lg:px-8 pt-5 space-y-5 max-w-[1100px] mx-auto w-full">

        <Field label="Trip Name" error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. MIPCOM 2026"
            className="input"
          />
        </Field>

        <Field label="Trip Type">
          <div className="space-y-2">
            {tripTypes.map(t => (
              <label key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${form.type === t.id ? 'border-[#1B4332] bg-[#f0f7f3]' : 'border-[#E5E7EB] bg-white'}`}>
                <input type="radio" name="type" value={t.id} checked={form.type === t.id} onChange={() => onTypeChange(t.id)} className="sr-only" />
                <span className="text-xl">{t.icon}</span>
                <div>
                  <p className="text-[15px] font-medium text-[#2D2D2D]">{t.label}</p>
                  {t.stub && <p className="text-[13px] text-[#9CA3AF]">— Stub (placeholder) —</p>}
                  {!t.stub && <p className="text-[13px] text-[#6B7280]">{t.description}</p>}
                </div>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Multi-Phase Trip?">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={handleMultiPhaseToggle}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.isMultiPhase ? 'bg-[#1B4332]' : 'bg-[#D1D5DB]'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isMultiPhase ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-[15px] text-[#2D2D2D]">{form.isMultiPhase ? 'Yes — multiple destinations' : 'No'}</span>
          </label>
        </Field>

        {!form.isMultiPhase && (
          <>
            <Field label="Destination">
              <input
                type="text"
                value={form.destination}
                onChange={e => set('destination', e.target.value)}
                placeholder="e.g. Cannes, France"
                className="input"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Departure" error={errors.departureDate}>
                <input type="date" value={form.departureDate} onChange={e => set('departureDate', e.target.value)} className="input" />
              </Field>
              <Field label="Return" error={errors.returnDate}>
                <input type="date" value={form.returnDate} onChange={e => set('returnDate', e.target.value)} className="input" />
              </Field>
            </div>

            <Field label="Flights">
              <FlightBuilder
                flights={form.flights}
                onChange={val => set('flights', val)}
              />
            </Field>

            <Field label="Does this trip include flights?">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => {
                    const next = !form.hasFlights
                    set('hasFlights', next)
                    if (!next) set('travelDays', 0)
                    else set('travelDays', Math.max(2, form.travelDays || 2))
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ${form.hasFlights ? 'bg-[#1B4332]' : 'bg-[#D1D5DB]'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.hasFlights ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-[15px] text-[#2D2D2D]">{form.hasFlights ? 'Yes' : 'No — driving or other'}</span>
              </label>
            </Field>

            {form.hasFlights && (
              <Field label="Flight Days (for compression socks)" hint="Min 2: departure + return">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => set('travelDays', Math.max(2, form.travelDays - 1))} className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#2D2D2D] font-bold text-lg flex items-center justify-center">−</button>
                  <span className="text-xl font-bold text-[#2D2D2D] w-8 text-center">{form.travelDays}</span>
                  <button type="button" onClick={() => set('travelDays', form.travelDays + 1)} className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#2D2D2D] font-bold text-lg flex items-center justify-center">+</button>
                </div>
              </Field>
            )}
          </>
        )}

        {form.isMultiPhase && (
          <Field label="Trip Phases" error={errors.phases}>
            <PhaseBuilder phases={form.phases || []} onChange={phases => set('phases', phases)} />
          </Field>
        )}

        {days > 0 && (
          <div className="bg-[#f0f7f3] rounded-xl p-3.5 text-[15px] text-[#1B4332] font-semibold text-center">
            {days} day trip
            {travelers.map(t => {
              const age = ageAtDate(t.dob, firstPhaseDate)
              if (age === null || !form.selectedTravelers.includes(t.id)) return null
              return <span key={t.id} className="ml-2 text-[#95C4A1]">· {t.name}: {age}yo</span>
            })}
          </div>
        )}

        <Field label="Travelers" error={errors.travelers}>
          <div className="grid grid-cols-2 gap-2">
            {TRAVELER_ORDER.map(id => (
              <label key={id} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${form.selectedTravelers.includes(id) ? 'border-[#1B4332] bg-[#f0f7f3]' : 'border-[#E5E7EB] bg-white'}`}>
                <input type="checkbox" checked={form.selectedTravelers.includes(id)} onChange={() => toggleTraveler(id)} className="sr-only" />
                <span className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-none ${form.selectedTravelers.includes(id) ? 'bg-[#1B4332] border-[#1B4332]' : 'border-[#D1D5DB]'}`}>
                  {form.selectedTravelers.includes(id) && <span className="text-white font-bold" style={{ fontSize: '9px' }}>✓</span>}
                </span>
                <span className="text-[15px] font-medium text-[#2D2D2D]">{TRAVELER_LABELS[id]}</span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Bags for this Trip">
          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
            {activeBags.length === 0 && (
              <p className="px-4 py-3 text-[15px] text-[#9CA3AF]">No active bags — enable bags in Settings</p>
            )}
            {activeBags.map((bag, i) => (
              <label key={bag.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-[#F8F6F1] ${i < activeBags.length - 1 ? 'border-b border-[#E5E7EB]' : ''}`}>
                <span
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-none ${form.selectedBags.includes(bag.id) ? 'bg-[#1B4332] border-[#1B4332]' : 'border-[#D1D5DB]'}`}
                  onClick={() => toggleBag(bag.id)}
                >
                  {form.selectedBags.includes(bag.id) && <span className="text-white font-bold" style={{ fontSize: '9px' }}>✓</span>}
                </span>
                <div>
                  <p className="text-[15px] font-medium text-[#2D2D2D]">{bag.label}</p>
                  <p className="text-[13px] text-[#6B7280]">{BAG_OWNER_LABELS[bag.owner] || bag.owner}{bag.emptyWeight ? ` · ${bag.emptyWeight} lbs empty` : ''}</p>
                </div>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Washing Machine Available?">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('washingMachineAvailable', !form.washingMachineAvailable)}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.washingMachineAvailable ? 'bg-[#1B4332]' : 'bg-[#D1D5DB]'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.washingMachineAvailable ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-[15px] text-[#2D2D2D]">{form.washingMachineAvailable ? 'Yes' : 'No'}</span>
          </label>
        </Field>

        {isBusiness && (
          <Field label="Suit Days">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => set('suitDays', Math.max(0, form.suitDays - 1))} className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#2D2D2D] font-bold text-lg flex items-center justify-center">−</button>
              <span className="text-xl font-bold text-[#2D2D2D] w-8 text-center">{form.suitDays}</span>
              <button type="button" onClick={() => set('suitDays', form.suitDays + 1)} className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#2D2D2D] font-bold text-lg flex items-center justify-center">+</button>
            </div>
          </Field>
        )}

        {isBusiness && form.suitDays > 0 && (
          <Field label="Which Suits?">
            <div className="space-y-2">
              {[
                { id: 't-navy-suit',   label: 'Navy Suit' },
                { id: 't-olive-suit',  label: 'Dark Olive Green Suit' },
                { id: 't-brown-suit',  label: 'Brown Suit' },
                { id: 't-linen-suit',  label: 'Tan Linen Suit' },
              ].map(suit => {
                const checked = form.selectedSuits.includes(suit.id)
                return (
                  <label key={suit.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${checked ? 'border-[#1B4332] bg-[#f0f7f3]' : 'border-[#E5E7EB] bg-white'}`}>
                    <span
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-none ${checked ? 'bg-[#1B4332] border-[#1B4332]' : 'border-[#D1D5DB]'}`}
                      onClick={() => set('selectedSuits', checked ? form.selectedSuits.filter(s => s !== suit.id) : [...form.selectedSuits, suit.id])}
                    >
                      {checked && <span className="text-white font-bold" style={{ fontSize: '9px' }}>✓</span>}
                    </span>
                    <span className="text-[15px] font-medium text-[#2D2D2D]">{suit.label}</span>
                  </label>
                )
              })}
            </div>
            {form.selectedSuits.length > form.suitDays && (
              <p className="text-xs text-[#D97706] mt-1.5">Warning: {form.selectedSuits.length} suits selected but only {form.suitDays} suit day{form.suitDays !== 1 ? 's' : ''}</p>
            )}
          </Field>
        )}

        {isBusiness && (
          <Field label="Dress Shirt Days (no suit)">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => set('dressShirtDays', Math.max(0, form.dressShirtDays - 1))} className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#2D2D2D] font-bold text-lg flex items-center justify-center">−</button>
              <span className="text-xl font-bold text-[#2D2D2D] w-8 text-center">{form.dressShirtDays}</span>
              <button type="button" onClick={() => set('dressShirtDays', form.dressShirtDays + 1)} className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#2D2D2D] font-bold text-lg flex items-center justify-center">+</button>
            </div>
          </Field>
        )}

        {isBusiness && form.isMultiPhase && (form.suitDays + form.dressShirtDays) > 0 && (
          <Field label="Bring extra dress shirt for Phase 2?">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => set('extraDressShirtPhase2', !form.extraDressShirtPhase2)}
                className={`w-12 h-6 rounded-full transition-colors relative ${form.extraDressShirtPhase2 ? 'bg-[#1B4332]' : 'bg-[#D1D5DB]'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.extraDressShirtPhase2 ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-[15px] text-[#2D2D2D]">{form.extraDressShirtPhase2 ? 'Yes' : 'No'}</span>
            </label>
          </Field>
        )}

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            placeholder="Special notes, reminders, etc."
            className="input resize-none"
          />
        </Field>

        <button
          type="submit"
          className="w-full bg-[#1B4332] text-white font-bold py-4 rounded-xl text-[15px] active:bg-[#143528] transition-colors"
        >
          Generate Packing List →
        </button>
      </form>
    </div>
  )
}

function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-[#6B7280] mb-1.5 uppercase tracking-[0.04em]">{label}</label>
      {hint && <p className="text-[13px] text-[#9CA3AF] mb-1.5">{hint}</p>}
      {children}
      {error && <p className="text-xs text-[#EF4444] mt-1">{error}</p>}
    </div>
  )
}
