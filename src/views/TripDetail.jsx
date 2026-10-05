import { useState, useMemo, useEffect, useCallback } from 'react'
import { generatePackingList, buildTripConfig, getPackingListForTraveler } from '../utils/packingEngine.js'
import { generateTasks } from '../utils/taskEngine.js'
import { exportTripMarkdown, downloadMarkdown } from '../utils/markdown.js'
import { tripDays, ageAtDate, formatDate } from '../utils/dates.js'
import { TRIP_TYPES, getTripType } from '../data/tripTypes.js'
import { getWeatherForTrip, summarizeWeather, computeWeatherConditions } from '../utils/weather.js'
import Header from '../components/Header.jsx'
import PackingSection from '../components/PackingSection.jsx'
import WeatherCard from '../components/WeatherCard.jsx'
import BagWeightPanel from '../components/BagWeightPanel.jsx'
import AddItemDrawer from '../components/AddItemDrawer.jsx'
import PhaseBuilder, { makePhase, FlightBuilder } from '../components/PhaseBuilder.jsx'

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')}${ampm}`
}

// ── Weather-based packing modifiers ─────────────────────────────────────────
const WEATHER_ITEMS = {
  topher: {
    rain: [
      { id: 't-umbrella',        name: 'Portable Umbrella',          category: 'comfort' },
      { id: 't-rain-jacket',     name: 'Rain Jacket',                 category: 'clothing' },
      { id: 't-wp-phone-case',   name: 'Waterproof Phone Case',       category: 'clothing' },
    ],
    cold: [
      { id: 't-puffy-jacket',      name: 'Puffy Jacket',                 category: 'clothing' },
      { id: 't-waterproof-jacket', name: 'Heavy Duty Waterproof Jacket', category: 'clothing' },
      { id: 't-beanie',            name: 'Knit Cap (Beanie)',            category: 'clothing' },
      { id: 't-face-cover',        name: 'Face Cover for Cold',          category: 'clothing' },
      { id: 't-wool-leggings',     name: 'Wool Leggings',               category: 'clothing' },
      { id: 't-wool-boxers',       name: 'Wool Boxer Briefs',           category: 'clothing' },
    ],
    mild: [
      { id: 't-light-jacket', name: 'Lightweight Jacket / Sweater', category: 'clothing' },
      { id: 't-hoodie',       name: 'Hoodie',                       category: 'clothing' },
    ],
    hot: [
      { id: 't-swim-trunks',    name: 'Swim Trunks',    category: 'clothing' },
      { id: 't-face-sunscreen', name: 'Face Sunscreen', category: 'toiletries' },
      { id: 't-baseball-cap',   name: 'Hat / Cap',      category: 'clothing' },
    ],
  },
  lanita: {
    rain: [
      { id: 'wx-l-umbrella',    name: 'Portable Umbrella', category: 'misc' },
      { id: 'wx-l-rain-jacket', name: 'Rain Jacket',       category: 'clothing' },
    ],
    cold: [
      { id: 'wx-l-puffy-jacket', name: 'Puffy Jacket',      category: 'clothing' },
      { id: 'wx-l-beanie',       name: 'Knit Cap (Beanie)', category: 'clothing' },
    ],
    mild: [
      { id: 'l-light-jacket', name: 'Light Jacket', category: 'clothing' },
    ],
    hot: [
      { id: 'l-swimwear',  name: 'Swimwear',             category: 'clothing' },
      { id: 'l-sunscreen', name: 'Sunscreen (high SPF)',  category: 'toiletries' },
      { id: 'l-hat',       name: 'Hat / Cap',             category: 'clothing' },
    ],
  },
  crosby: {
    rain: [
      { id: 'wx-c-umbrella',    name: 'Portable Umbrella', category: 'misc' },
      { id: 'wx-c-rain-jacket', name: 'Rain Jacket',       category: 'clothing' },
    ],
    cold: [
      { id: 'wx-c-puffy-jacket', name: 'Puffy Jacket',      category: 'clothing' },
      { id: 'wx-c-beanie',       name: 'Knit Cap (Beanie)', category: 'clothing' },
    ],
    mild: [
      { id: 'c-light-jacket', name: 'Light Jacket', category: 'clothing' },
    ],
    hot: [
      { id: 'c-swimwear',  name: 'Swimwear',                category: 'clothing' },
      { id: 'c-sunscreen', name: 'Sunscreen (kid-friendly)', category: 'toiletries' },
      { id: 'c-hat',       name: 'Hat',                     category: 'clothing' },
    ],
  },
  penn: {
    rain: [],
    cold: [
      { id: 'wx-p-warm-layers', name: 'Warm Layers / Fleece', category: 'clothing' },
    ],
    mild: [
      { id: 'p-light-jacket', name: 'Light Jacket', category: 'clothing' },
    ],
    hot: [
      { id: 'p-swimsuit-hat', name: 'Swimsuit + Sun Hat', category: 'clothing' },
    ],
  },
  shared: { rain: [], cold: [], mild: [], hot: [] },
}

function applyWeatherModifiers(list, conditions, phaseConditions = null) {
  if (!conditions) return { weatherList: list, flagCount: 0, flagLabel: null }

  function condSources(condKey) {
    if (!phaseConditions) return null
    const srcs = phaseConditions.filter(pc => pc.conditions?.[condKey]).map(pc => pc.label)
    return srcs.length ? srcs.join(', ') : null
  }

  let flagCount = 0
  const weatherList = {}

  for (const [tid, cats] of Object.entries(list)) {
    const tMap = WEATHER_ITEMS[tid] || {}
    const weatherItems = [
      ...(conditions.isRainy ? (tMap.rain || []).map(wi => ({ ...wi, _ct: 'rain' })) : []),
      ...(conditions.isCold  ? (tMap.cold || []).map(wi => ({ ...wi, _ct: 'cold' })) : []),
      ...(conditions.isMild  ? (tMap.mild || []).map(wi => ({ ...wi, _ct: 'mild' })) : []),
      ...(conditions.isHot   ? (tMap.hot  || []).map(wi => ({ ...wi, _ct: 'hot'  })) : []),
    ]
    if (!weatherItems.length) { weatherList[tid] = cats; continue }

    const existingIds = new Set(Object.values(cats).flat().map(i => i.id))
    weatherList[tid] = {}

    for (const [cat, items] of Object.entries(cats)) {
      weatherList[tid][cat] = items.map(item => {
        const match = weatherItems.find(wi => wi.id === item.id)
        if (match) {
          flagCount++
          const src = condSources(match._ct === 'rain' ? 'isRainy' : match._ct === 'cold' ? 'isCold' : match._ct === 'mild' ? 'isMild' : 'isHot')
          return { ...item, weatherFlag: true, ...(src ? { weatherSource: src } : {}) }
        }
        return item
      })
    }

    for (const wi of weatherItems) {
      if (!existingIds.has(wi.id)) {
        flagCount++
        const cat = wi.category
        const src = condSources(wi._ct === 'rain' ? 'isRainy' : wi._ct === 'cold' ? 'isCold' : wi._ct === 'mild' ? 'isMild' : 'isHot')
        if (!weatherList[tid][cat]) weatherList[tid][cat] = []
        weatherList[tid][cat] = [...weatherList[tid][cat], {
          id: wi.id, name: wi.name, qty: 1, resolvedQty: 1,
          weatherFlag: true, conditions: ['weatherInjected'],
          ...(src ? { weatherSource: src } : {}),
        }]
      }
    }

    const triggerCondMap = { rain: 'isRainy', cold: 'isCold', mild: 'isMild', hot: 'isHot' }
    for (const [cat, items] of Object.entries(weatherList[tid])) {
      weatherList[tid][cat] = items.map(item => {
        if (!item.weatherTrigger || item.weatherFlag) return item
        const condKey = triggerCondMap[item.weatherTrigger]
        if (condKey && conditions[condKey]) {
          flagCount++
          const src = condSources(condKey)
          return { ...item, weatherFlag: true, ...(src ? { weatherSource: src } : {}) }
        }
        return item
      })
    }
  }

  const { location, period } = conditions
  const flagLabel = flagCount > 0
    ? `${flagCount} item${flagCount !== 1 ? 's' : ''} flagged based on ${location} ${period} weather`
    : null

  return { weatherList, flagCount, flagLabel }
}

const TABS = ['Tasks', 'Packing', 'Weather', 'Bags']
const TRAVELER_LABELS = { topher: 'Topher', lanita: 'La Nita', crosby: 'Crosby', penn: 'Penn', shared: 'Shared' }
const BAG_OWNER_LABELS = { topher: 'Topher', lanita: 'La Nita', penn: 'Penn', crosby: 'Crosby' }
const TRAVELER_ORDER = ['topher', 'lanita', 'crosby', 'penn']

export default function TripDetailView({ state, tripId, onBack, toggleItem, toggleTask, setItemPhase, archiveTrip, updateTrip, addTripItem, removeTripItem, restoreTripItem, addUserItem, addCustomTask, updateCustomTask, deleteTask }) {
  function setQtyOverride(itemId, qty) {
    const current = trip?.qtyOverrides || {}
    if (qty === null) {
      const { [itemId]: _removed, ...rest } = current
      updateTrip(tripId, { qtyOverrides: rest })
    } else {
      updateTrip(tripId, { qtyOverrides: { ...current, [itemId]: qty } })
    }
  }
  const [tab, setTab] = useState('Tasks')
  const [showExport, setShowExport] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showFlightDiff, setShowFlightDiff] = useState(false)
  const [drawerTraveler, setDrawerTraveler] = useState(null)

  const trip = state.trips.find(t => t.id === tripId)
  const { travelers, bags, userInventory = {} } = state

  const [weatherResult, setWeatherResult]   = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError]     = useState(null)
  const [phaseWeathers, setPhaseWeathers]   = useState([])

  const phasesKey = useMemo(() => {
    if (!trip?.isMultiPhase || !trip?.phases) return null
    return trip.phases.map(p => `${p.destination}|${p.departureDate}|${p.returnDate}`).join('||')
  }, [trip?.isMultiPhase, trip?.phases])

  useEffect(() => {
    if (!trip) return
    if (trip.isMultiPhase && trip.phases?.length > 0) {
      setPhaseWeathers(trip.phases.map(() => ({ loading: true, error: null, result: null })))
      setWeatherResult(null)
      trip.phases.forEach((ph, i) => {
        if (!ph.destination || !ph.departureDate || !ph.returnDate) {
          setPhaseWeathers(prev => prev.map((pw, j) => j === i ? { loading: false, error: null, result: null } : pw))
          return
        }
        getWeatherForTrip(ph.destination, ph.departureDate, ph.returnDate)
          .then(result => setPhaseWeathers(prev => prev.map((pw, j) => j === i ? { loading: false, error: null, result } : pw)))
          .catch(e  => setPhaseWeathers(prev => prev.map((pw, j) => j === i ? { loading: false, error: e.message, result: null } : pw)))
      })
    } else {
      if (!trip.destination || !trip.departureDate || !trip.returnDate) return
      setPhaseWeathers([])
      setWeatherLoading(true)
      setWeatherError(null)
      setWeatherResult(null)
      getWeatherForTrip(trip.destination, trip.departureDate, trip.returnDate)
        .then(setWeatherResult)
        .catch(e => setWeatherError(e.message))
        .finally(() => setWeatherLoading(false))
    }
  }, [trip?.destination, trip?.departureDate, trip?.returnDate, trip?.isMultiPhase, phasesKey])

  const { cfg, list } = useMemo(
    () => (trip ? generatePackingList(trip, travelers, userInventory, state.templateOverrides ?? {}, state.itemOverrides ?? {}) : { cfg: {}, list: {} }),
    [trip, travelers, userInventory, state.templateOverrides, state.itemOverrides]
  )

  const weatherConditions = useMemo(() => {
    if (trip?.isMultiPhase && phaseWeathers.length > 0) {
      const withResults = phaseWeathers
        .map((pw, i) => ({ label: trip.phases?.[i]?.name || `Phase ${i + 1}`, conditions: computeWeatherConditions(summarizeWeather(pw.result)) }))
        .filter(pc => pc.conditions)
      if (!withResults.length) return null
      return {
        isRainy: withResults.some(pc => pc.conditions.isRainy),
        isCold:  withResults.some(pc => pc.conditions.isCold),
        isMild:  withResults.some(pc => pc.conditions.isMild),
        isHot:   withResults.some(pc => pc.conditions.isHot),
        phaseConditions: withResults,
        location: withResults.map(pc => pc.label).join(' + '),
        period: 'multi-phase',
      }
    }
    return computeWeatherConditions(summarizeWeather(weatherResult))
  }, [weatherResult, phaseWeathers, trip?.isMultiPhase, trip?.phases])

  const { weatherList, flagLabel } = useMemo(
    () => applyWeatherModifiers(list, weatherConditions, weatherConditions?.phaseConditions ?? null),
    [list, weatherConditions]
  )

  const FORMAL_ITEM_IDS = new Set([
    't-navy-suit', 't-olive-suit', 't-brown-suit', 't-linen-suit',
    't-black-dress-shoes', 't-brown-dress-shoes', 't-ties', 't-collar-stays',
    't-dress-socks', 't-black-belt', 't-brown-belt', 't-dress-shirts',
    't-white-undershirts',
  ])

  const effectiveItemPhases = useMemo(() => {
    const saved = trip?.itemPhases || {}
    if (!trip?.isMultiPhase || !cfg.isBusiness) return saved
    const defaults = {}
    for (const [, cats] of Object.entries(weatherList)) {
      for (const items of Object.values(cats)) {
        for (const item of items) {
          if (FORMAL_ITEM_IDS.has(item.id) && !(item.id in saved)) {
            defaults[item.id] = '1'
          }
        }
      }
    }
    return Object.keys(defaults).length > 0 ? { ...defaults, ...saved } : saved
  }, [trip?.itemPhases, trip?.isMultiPhase, cfg.isBusiness, weatherList])

  const { preTripTasks, day1Tasks, repackTasks, nightBeforeTasks } = useMemo(
    () => (trip ? generateTasks(trip, cfg, travelers, list) : { preTripTasks: [], day1Tasks: [], repackTasks: [], nightBeforeTasks: [] }),
    [trip, cfg, travelers, list]
  )

  const flightOnlyItems = useMemo(() => {
    if (!trip) return []
    const cfgWith    = buildTripConfig({ ...trip, hasFlights: true  }, travelers)
    const cfgWithout = buildTripConfig({ ...trip, hasFlights: false }, travelers)
    const removed = []
    for (const tid of trip.selectedTravelers) {
      const withList    = getPackingListForTraveler(tid, cfgWith)
      const withoutList = getPackingListForTraveler(tid, cfgWithout)
      for (const [, items] of Object.entries(withList)) {
        const withoutIds = new Set(Object.values(withoutList).flat().map(i => i.id))
        for (const item of items) {
          if (!withoutIds.has(item.id)) removed.push(item)
        }
      }
    }
    return removed
  }, [trip, travelers])

  if (!trip) return <div className="p-8 text-center text-[#6B7280]">Trip not found</div>

  const typeData = TRIP_TYPES.find(t => t.id === trip.type)
  const effectiveHasFlights = trip.hasFlights !== undefined
    ? trip.hasFlights
    : (typeData?.config?.isFlying ?? true)

  const days = tripDays(trip.departureDate, trip.returnDate)
  const totalItems = Object.values(weatherList).flatMap(cats => Object.values(cats).flat()).length
  const checkedCount = Object.keys(trip.checkedItems || {}).filter(k => trip.checkedItems[k]).length
  const progressPct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0

  function handleExportMd() {
    const md = exportTripMarkdown(trip, list, preTripTasks, day1Tasks)
    downloadMarkdown(md, `${trip.name || 'trip'}-packing.md`)
  }

  function handleCopyMd() {
    const md = exportTripMarkdown(trip, list, preTripTasks, day1Tasks)
    navigator.clipboard.writeText(md).then(() => alert('Copied to clipboard!'))
  }

  if (editing) {
    return (
      <EditTripForm
        trip={trip}
        state={state}
        onSave={updates => { updateTrip(trip.id, updates); setEditing(false) }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 lg:pb-8">
      <Header
        title={trip.name}
        onBack={onBack}
        action={
          <div className="flex gap-3">
            <button onClick={() => setEditing(true)} className="text-sm text-[#1B4332] font-semibold">Edit</button>
            <button onClick={() => setShowExport(!showExport)} className="text-sm text-[#6B7280] font-medium">Export</button>
          </div>
        }
      />

      {/* Export panel */}
      {showExport && (
        <div className="bg-[#f0f7f3] border-b border-[#dcefdf] px-4 py-3 flex gap-2">
          <button onClick={handleCopyMd} className="flex-1 bg-white border border-[#dcefdf] text-[#1B4332] text-sm font-medium py-2 rounded-lg">
            Copy as Markdown
          </button>
          <button onClick={handleExportMd} className="flex-1 bg-[#1B4332] text-white text-sm font-medium py-2 rounded-lg">
            Download .md
          </button>
        </div>
      )}

      <div className="max-w-[1100px] mx-auto w-full">
        {/* Trip header card */}
        <div className="bg-white border-b border-[#E5E7EB] px-4 lg:px-8 py-5">
          <div className="flex items-start gap-3 mb-2">
            <span className="text-3xl flex-none">{typeData?.icon || '✈️'}</span>
            <div className="flex-1 min-w-0">
              <h2 className="text-[22px] font-bold text-[#1B4332] leading-tight truncate">{trip.destination || trip.name}</h2>
              <p className="text-[13px] text-[#6B7280] mt-0.5">
                {formatDate(trip.departureDate)} → {formatDate(trip.returnDate)} · {days} day{days !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Traveler age pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {trip.selectedTravelers.map(tid => {
              const t = travelers.find(x => x.id === tid)
              if (!t) return null
              const age = ageAtDate(t.dob, trip.departureDate)
              return (
                <span key={tid} className="text-[13px] bg-[#95C4A1] text-[#1B4332] rounded-full px-3 py-1 font-semibold">
                  {TRAVELER_LABELS[tid]}: {age}yo
                </span>
              )
            })}
          </div>

          {/* Progress bar */}
          <div>
            <div className="bg-[#E5E7EB] rounded-full h-2 mb-1.5">
              <div
                className="bg-[#95C4A1] rounded-full h-2 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[13px] text-[#6B7280] text-right">{checkedCount}/{totalItems} packed ({progressPct}%)</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex bg-white border-b border-[#E5E7EB] sticky top-14 z-30">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                tab === t ? 'border-[#1B4332] text-[#1B4332]' : 'border-transparent text-[#6B7280]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="px-4 lg:px-8 pt-5">

          {/* TASKS TAB */}
          {tab === 'Tasks' && (
            <div className="space-y-5">
              {(() => {
                const allFlights = trip.isMultiPhase && trip.phases?.length > 0
                  ? trip.phases.flatMap(ph => ph.flights || [])
                  : (trip.flights || [])
                const sorted = [...allFlights].sort((a, b) => {
                  const da = (a.date || '') + (a.time || '00:00')
                  const db = (b.date || '') + (b.time || '00:00')
                  return da < db ? -1 : da > db ? 1 : 0
                })
                if (!sorted.length) return null
                return (
                  <div>
                    <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-2">Flights</h3>
                    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                      {sorted.map((f, i) => (
                        <div key={f.id} className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 px-4 py-3 text-[14px] ${i < sorted.length - 1 ? 'border-b border-[#E5E7EB]' : ''}`}>
                          <span className="text-base">✈</span>
                          <span className="font-semibold text-[#2D2D2D]">{f.depAirport || '?'} → {f.arrAirport || '?'}</span>
                          {f.date && <span className="text-[#6B7280]">· {formatDate(f.date)}</span>}
                          {f.time && <span className="text-[#6B7280]">· {formatTime(f.time)}</span>}
                          {(f.airline || f.flightNumber) && (
                            <span className="text-[#6B7280]">· {[f.airline, f.flightNumber].filter(Boolean).join(' ')}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {(() => {
                const deleted = new Set(trip.deletedTaskIds || [])
                const customTasks = trip.customTasks || []
                const checked = trip.checkedTasks || {}
                const sharedProps = {
                  checked,
                  onToggle: id => toggleTask(trip.id, id),
                  onDelete: deleteTask ? id => deleteTask(trip.id, id) : null,
                  onEditTask: updateCustomTask ? (id, text) => updateCustomTask(trip.id, id, text) : null,
                  onAddTask: addCustomTask ? (section, text) => addCustomTask(trip.id, section, text) : null,
                  isArchived: !!trip.isArchived,
                }
                const filteredPre = preTripTasks.filter(t => !deleted.has(t.id))
                const filteredDay1 = day1Tasks.filter(t => !deleted.has(t.id))
                const filteredRepack = (repackTasks || []).filter(t => !deleted.has(t.id))
                const filteredNightBefore = (nightBeforeTasks || []).filter(t => !deleted.has(t.id))
                const customPre = customTasks.filter(t => t.section === 'pre')
                const customDay1 = customTasks.filter(t => t.section === 'day1')
                const customRepack = customTasks.filter(t => t.section === 'repack')
                const customNightBefore = customTasks.filter(t => t.section === 'nightbefore')
                return (<>
                  <TaskGroup title="Pre-Trip Tasks" tasks={[...filteredPre, ...customPre]} section="pre" {...sharedProps} />
                  {(filteredNightBefore.length > 0 || customNightBefore.length > 0) && (
                    <TaskGroup title="🌙 Night Before — Charge Everything" tasks={[...filteredNightBefore, ...customNightBefore]} section="nightbefore" {...sharedProps} />
                  )}
                  <TaskGroup title="Day 1 Tasks" tasks={[...filteredDay1, ...customDay1]} section="day1" {...sharedProps} />
                  {(filteredRepack.length > 0 || customRepack.length > 0) && (
                    <TaskGroup title="🔄 Repack Plan — Phase Transition" tasks={[...filteredRepack, ...customRepack]} section="repack" {...sharedProps} />
                  )}
                  {filteredPre.length === 0 && filteredDay1.length === 0 && !filteredRepack.length && !filteredNightBefore.length && customTasks.length === 0 && (
                    <p className="text-center text-[#6B7280] text-sm py-8">No tasks generated for this trip type</p>
                  )}
                </>)
              })()}
              {!trip.isArchived && (
                <button
                  onClick={() => archiveTrip(trip.id)}
                  className="w-full mt-2 py-3 text-sm text-[#6B7280] border border-[#E5E7EB] rounded-xl bg-white"
                >
                  Mark Trip as Done (Archive)
                </button>
              )}
            </div>
          )}

          {/* PACKING TAB */}
          {tab === 'Packing' && (
            <div>
              {/* Flight toggle */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] px-4 py-3 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-medium text-[#2D2D2D]">Includes flights?</p>
                    <p className="text-[13px] text-[#6B7280]">Affects compression socks &amp; flight items</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[#6B7280]">{effectiveHasFlights ? 'Yes' : 'No'}</span>
                    <div
                      onClick={() => {
                        const next = !effectiveHasFlights
                        updateTrip(trip.id, { hasFlights: next })
                        if (!next) setShowFlightDiff(true)
                        else setShowFlightDiff(false)
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${effectiveHasFlights ? 'bg-[#1B4332]' : 'bg-[#D1D5DB]'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${effectiveHasFlights ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                </div>

                {!effectiveHasFlights && flightOnlyItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                    <button
                      onClick={() => setShowFlightDiff(!showFlightDiff)}
                      className="flex items-center gap-1 text-xs font-semibold text-[#D97706] w-full text-left"
                    >
                      <span>{showFlightDiff ? '▾' : '▸'}</span>
                      <span>{flightOnlyItems.length} items removed (flights = No)</span>
                    </button>
                    {showFlightDiff && (
                      <ul className="mt-2 space-y-1">
                        {flightOnlyItems.map(item => (
                          <li key={item.id} className="text-xs text-[#6B7280] flex items-start gap-1.5">
                            <span className="text-[#D97706] mt-0.5">–</span>
                            <span>{item.name}{typeof item.resolvedQty === 'number' ? ` ×${item.resolvedQty}` : item.resolvedQty ? ` (${item.resolvedQty})` : ''}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {flagLabel && (
                <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
                  <span className="text-base">🌤</span>
                  <p className="text-xs text-[#1D4ED8] font-medium">{flagLabel}</p>
                </div>
              )}

              {trip.isMultiPhase && (
                <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-3 mb-4 text-xs text-[#92400E]">
                  <p className="font-semibold mb-1">Multi-Phase Mode</p>
                  <p>🟦 Phase 1 only · 🟩 Both phases · 🟧 Phase 2 only</p>
                  <p className="mt-1 opacity-80">Tag items using the selectors on the right. Items tagged 🟦 ship home after Phase 1.</p>
                </div>
              )}

              {Object.entries(weatherList).map(([tid, cats]) => {
                if (!cats || Object.keys(cats).length === 0) return null
                return (
                  <PackingSection
                    key={tid}
                    travelerId={tid}
                    categories={cats}
                    checkedItems={trip.checkedItems || {}}
                    onToggle={itemId => toggleItem(trip.id, itemId)}
                    isMultiPhase={trip.isMultiPhase}
                    itemPhases={effectiveItemPhases}
                    onSetPhase={(itemId, phase) => setItemPhase(trip.id, itemId, phase)}
                    onRemoveItem={removeTripItem ? itemId => removeTripItem(trip.id, itemId) : undefined}
                    onAddItem={addTripItem ? travelerId => setDrawerTraveler(travelerId) : undefined}
                    qtyOverrides={trip.qtyOverrides || {}}
                    onSetQtyOverride={setQtyOverride}
                  />
                )
              })}

              {trip.isMultiPhase && (() => {
                const shipHome = Object.values(weatherList)
                  .flatMap(cats => Object.values(cats).flat())
                  .filter(item => effectiveItemPhases[item.id] === '1')
                if (!shipHome.length) return (
                  <div className="mt-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 text-xs text-[#1D4ED8]">
                    🟦 No items tagged for ship-home yet. Tag items with 🟦 (Phase 1 only) to see them here.
                  </div>
                )
                return (
                  <div className="mt-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4">
                    <p className="text-sm font-semibold text-[#1E40AF] mb-1">🟦 Ship Home After Phase 1</p>
                    <p className="text-xs text-[#3B82F6] mb-2">{shipHome.length} item{shipHome.length !== 1 ? 's' : ''} to pack in the ship-home box</p>
                    <div className="space-y-1">
                      {shipHome.map(item => (
                        <p key={item.id} className="text-sm text-[#1E3A8A]">· {item.name}</p>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* ADD ITEM DRAWER */}
          {drawerTraveler && (
            <AddItemDrawer
              travelerId={drawerTraveler}
              trip={trip}
              userInventory={userInventory}
              itemOverrides={state.itemOverrides ?? {}}
              onClose={() => setDrawerTraveler(null)}
              onAddToTrip={(travelerId, category, item) => {
                if (item._restore) {
                  restoreTripItem && restoreTripItem(trip.id, item.id)
                } else {
                  addTripItem && addTripItem(trip.id, travelerId, category, item)
                }
              }}
              onSaveToInventory={(travelerId, category, item) => {
                addUserItem && addUserItem(travelerId, category, item)
              }}
            />
          )}

          {/* WEATHER TAB */}
          {tab === 'Weather' && (
            trip?.isMultiPhase && trip.phases?.length > 0
              ? (
                <div className="space-y-4">
                  {trip.phases.map((ph, i) => {
                    const pw = phaseWeathers[i]
                    const phLabel = `Phase ${i + 1}${ph.name ? `: ${ph.name}` : ''}`
                    return (
                      <WeatherCard
                        key={ph.id || i}
                        label={phLabel}
                        weather={pw?.result ?? null}
                        loading={pw?.loading ?? true}
                        error={pw?.error ?? null}
                      />
                    )
                  })}
                </div>
              )
              : <WeatherCard weather={weatherResult} loading={weatherLoading} error={weatherError} />
          )}

          {/* BAGS TAB */}
          {tab === 'Bags' && (() => {
            const activeBags = bags.filter(b => b.active)
            const defaultBagIds = activeBags.filter(b => trip.selectedTravelers.includes(b.owner)).map(b => b.id)
            const selectedBagIds = trip.selectedBags ?? defaultBagIds

            function toggleBagForTrip(bagId) {
              const next = selectedBagIds.includes(bagId)
                ? selectedBagIds.filter(id => id !== bagId)
                : [...selectedBagIds, bagId]
              updateTrip(trip.id, { selectedBags: next })
            }

            return (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <div className="px-4 py-3 border-b border-[#E5E7EB]">
                    <p className="text-[15px] font-semibold text-[#2D2D2D]">Bags for this Trip</p>
                    <p className="text-[13px] text-[#6B7280] mt-0.5">Select which bags are traveling</p>
                  </div>
                  {activeBags.map((bag, i) => (
                    <button
                      key={bag.id}
                      type="button"
                      onClick={() => toggleBagForTrip(bag.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left active:bg-[#F8F6F1] ${i < activeBags.length - 1 ? 'border-b border-[#E5E7EB]' : ''}`}
                    >
                      <span className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-none ${selectedBagIds.includes(bag.id) ? 'bg-[#1B4332] border-[#1B4332]' : 'border-[#D1D5DB]'}`}>
                        {selectedBagIds.includes(bag.id) && <span className="text-white font-bold" style={{ fontSize: '9px' }}>✓</span>}
                      </span>
                      <div>
                        <p className="text-[15px] font-medium text-[#2D2D2D]">{bag.label}</p>
                        <p className="text-[13px] text-[#6B7280]">{BAG_OWNER_LABELS[bag.owner] || bag.owner}{bag.emptyWeight ? ` · ${bag.emptyWeight} lbs empty` : ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <BagWeightPanel
                  bags={bags}
                  airline={trip.airline}
                  selectedTravelers={trip.selectedTravelers}
                  selectedBagIds={selectedBagIds}
                />
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

function TaskGroup({ title, tasks, section, checked, onToggle, onDelete, onEditTask, onAddTask, isArchived }) {
  const [addingText, setAddingText] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')

  const doneCount = tasks.filter(t => checked[t.id]).length

  function submitAdd() {
    const t = addingText.trim()
    if (t && onAddTask) { onAddTask(section, t) }
    setAddingText('')
    setIsAdding(false)
  }

  function submitEdit() {
    const t = editingText.trim()
    if (t && onEditTask) onEditTask(editingId, t)
    setEditingId(null)
  }

  return (
    <div>
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-2">
        {title} <span className="normal-case font-normal text-[#9CA3AF]">({doneCount}/{tasks.length})</span>
      </h3>
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {tasks.map((task, i) => (
          <div
            key={task.id}
            className={`flex items-center gap-2 px-3 min-h-[52px] ${i < tasks.length - 1 || isAdding || !isArchived ? 'border-b border-[#E5E7EB]' : ''}`}
          >
            {editingId === task.id ? (
              <>
                <input
                  autoFocus
                  value={editingText}
                  onChange={e => setEditingText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submitEdit(); if (e.key === 'Escape') setEditingId(null) }}
                  className="flex-1 text-[15px] border border-[#95C4A1] rounded-lg px-3 py-1.5 outline-none"
                />
                <button onClick={submitEdit} className="text-[13px] font-semibold text-[#1B4332] px-2 py-1">Save</button>
                <button onClick={() => setEditingId(null)} className="text-[13px] text-[#9CA3AF] px-1 py-1">✕</button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onToggle(task.id)}
                  className={`w-6 h-6 flex-none rounded-full border-2 flex items-center justify-center transition-colors ${checked[task.id] ? 'bg-[#1B4332] border-[#1B4332]' : 'border-[#D1D5DB]'}`}
                >
                  {checked[task.id] && <span className="text-white text-xs font-bold">✓</span>}
                </button>
                <span
                  className={`flex-1 text-[15px] font-medium py-3 ${checked[task.id] ? 'line-through text-[#9CA3AF]' : 'text-[#2D2D2D]'}`}
                  onClick={() => onToggle(task.id)}
                >
                  {task.text}
                </span>
                {!isArchived && (
                  <div className="flex items-center gap-1 flex-none">
                    <button
                      onClick={() => { setEditingId(task.id); setEditingText(task.text) }}
                      className="w-7 h-7 flex items-center justify-center text-[#9CA3AF] hover:text-[#1B4332] text-sm rounded"
                      title="Edit task"
                    >✎</button>
                    <button
                      onClick={() => onDelete && onDelete(task.id)}
                      className="w-7 h-7 flex items-center justify-center text-[#9CA3AF] hover:text-[#EF4444] text-lg leading-none rounded"
                      title="Delete task"
                    >×</button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {/* Add task row */}
        {!isArchived && onAddTask && (
          isAdding ? (
            <div className="flex items-center gap-2 px-3 py-2">
              <input
                autoFocus
                value={addingText}
                onChange={e => setAddingText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitAdd(); if (e.key === 'Escape') { setIsAdding(false); setAddingText('') } }}
                placeholder="New task…"
                className="flex-1 text-[15px] border border-[#95C4A1] rounded-lg px-3 py-1.5 outline-none"
              />
              <button onClick={submitAdd} className="text-[13px] font-semibold text-[#1B4332] px-2 py-1">Add</button>
              <button onClick={() => { setIsAdding(false); setAddingText('') }} className="text-[13px] text-[#9CA3AF] px-1">✕</button>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center gap-2 px-4 py-3 text-[14px] text-[#95C4A1] hover:text-[#1B4332] hover:bg-[#F8F6F1] transition-colors"
            >
              <span className="text-lg leading-none">+</span> Add task
            </button>
          )
        )}
      </div>
    </div>
  )
}

// ── Edit Trip Form ────────────────────────────────────────────────────────────

function EditTripForm({ trip, state, onSave, onCancel }) {
  const { travelers, bags } = state
  const activeBags = bags.filter(b => b.active)

  const typeData = getTripType(trip.type)
  const initialHasFlights = trip.hasFlights !== undefined
    ? trip.hasFlights
    : (typeData?.config?.isFlying ?? true)

  const [form, setForm] = useState({
    name:                   trip.name || '',
    type:                   trip.type || 'solo-intl-work',
    destination:            trip.destination || '',
    departureDate:          trip.departureDate || '',
    returnDate:             trip.returnDate || '',
    flights:                trip.flights || [],
    selectedTravelers:      trip.selectedTravelers || ['topher'],
    washingMachineAvailable: trip.washingMachineAvailable ?? false,
    suitDays:               trip.suitDays ?? 0,
    dressShirtDays:         trip.dressShirtDays ?? 0,
    extraDressShirtPhase2:  trip.extraDressShirtPhase2 ?? false,
    selectedSuits:          trip.selectedSuits || [],
    travelDays:             trip.travelDays ?? 2,
    hasFlights:             initialHasFlights,
    selectedBags:           trip.selectedBags ?? activeBags.filter(b => (trip.selectedTravelers || ['topher']).includes(b.owner)).map(b => b.id),
    isMultiPhase:           trip.isMultiPhase ?? false,
    phases:                 trip.phases?.map(ph => ({ flights: [], ...ph })) ?? null,
    notes:                  trip.notes || '',
  })

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function onTypeChange(type) {
    const td = getTripType(type)
    const newHasFlights = td?.config?.isFlying ?? true
    set('type', type)
    set('hasFlights', newHasFlights)
    if (!newHasFlights) set('travelDays', 0)
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
      setForm(f => ({
        ...f, isMultiPhase: true,
        phases: [
          makePhase({ name: '', destination: f.destination, departureDate: f.departureDate, hasFlights: f.hasFlights, travelDays: f.travelDays }),
          makePhase({ departureDate: '' }),
        ],
      }))
    } else {
      set('isMultiPhase', next)
    }
  }

  const days = form.isMultiPhase
    ? (form.phases || []).reduce((s, p) => s + (tripDays(p.departureDate, p.returnDate) || 0), 0)
    : tripDays(form.departureDate, form.returnDate)
  const firstPhaseDate = form.isMultiPhase ? form.phases?.[0]?.departureDate : form.departureDate
  const currentTypeData = getTripType(form.type)
  const isBusiness = currentTypeData?.config?.isBusiness

  function handleSave() {
    if (!form.name.trim()) return
    let save = { ...form }
    if (form.isMultiPhase && form.phases?.length > 0) {
      const phases = form.phases
      const first = phases[0], last = phases[phases.length - 1]
      save.departureDate = first.departureDate
      save.returnDate    = last.returnDate
      save.destination   = phases.map(p => p.name || p.destination).filter(Boolean).join(' → ')
      save.hasFlights    = phases.some(p => p.hasFlights)
      save.travelDays    = phases.reduce((s, p) => s + (p.hasFlights ? Math.max(2, p.travelDays ?? 2) : 0), 0)
    }
    onSave(save)
  }

  const TRIP_TYPES_LIST = TRIP_TYPES
  const TRAVELER_ORDER_EDIT = ['topher', 'lanita', 'crosby', 'penn']
  const TRAVELER_LABELS_EDIT = { topher: 'Topher', lanita: 'La Nita', crosby: 'Crosby', penn: 'Penn' }
  const BAG_OWNER_LABELS_EDIT = { topher: 'Topher', lanita: 'La Nita', penn: 'Penn', crosby: 'Crosby' }

  return (
    <div className="flex flex-col min-h-screen pb-20 lg:pb-8">
      <Header
        title="Edit Trip"
        onBack={onCancel}
        action={
          <button onClick={handleSave} className="text-sm font-bold text-[#1B4332]">Save</button>
        }
      />

      <div className="flex-1 px-4 lg:px-8 pt-5 space-y-5 max-w-[1100px] mx-auto w-full">

        <EField label="Trip Name">
          <input value={form.name} onChange={e => set('name', e.target.value)} className="input" />
        </EField>

        <EField label="Trip Type">
          <div className="space-y-2">
            {TRIP_TYPES_LIST.map(t => (
              <label key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${form.type === t.id ? 'border-[#1B4332] bg-[#f0f7f3]' : 'border-[#E5E7EB] bg-white'}`}>
                <input type="radio" name="edit-type" value={t.id} checked={form.type === t.id} onChange={() => onTypeChange(t.id)} className="sr-only" />
                <span className="text-xl">{t.icon}</span>
                <div>
                  <p className="text-[15px] font-medium text-[#2D2D2D]">{t.label}</p>
                  {t.stub && <p className="text-[13px] text-[#6B7280]">— Stub —</p>}
                  {!t.stub && <p className="text-[13px] text-[#6B7280]">{t.description}</p>}
                </div>
              </label>
            ))}
          </div>
        </EField>

        <EField label="Multi-Phase Trip?">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={handleMultiPhaseToggle}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.isMultiPhase ? 'bg-[#1B4332]' : 'bg-[#D1D5DB]'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isMultiPhase ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-[15px] text-[#2D2D2D]">{form.isMultiPhase ? 'Yes — multiple destinations' : 'No'}</span>
          </label>
        </EField>

        {!form.isMultiPhase && (
          <>
            <EField label="Destination">
              <input value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="e.g. Cannes, France" className="input" />
            </EField>
            <div className="grid grid-cols-2 gap-3">
              <EField label="Departure">
                <input type="date" value={form.departureDate} onChange={e => set('departureDate', e.target.value)} className="input" />
              </EField>
              <EField label="Return">
                <input type="date" value={form.returnDate} onChange={e => set('returnDate', e.target.value)} className="input" />
              </EField>
            </div>
            <EField label="Flights">
              <FlightBuilder
                flights={form.flights}
                onChange={val => set('flights', val)}
              />
            </EField>
            <EField label="Does this trip include flights?">
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
            </EField>
            {form.hasFlights && (
              <EField label="Flight Days (for compression socks)" hint="Min 2: departure + return">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => set('travelDays', Math.max(2, form.travelDays - 1))} className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#2D2D2D] font-bold text-lg flex items-center justify-center">−</button>
                  <span className="text-xl font-bold text-[#2D2D2D] w-8 text-center">{form.travelDays}</span>
                  <button type="button" onClick={() => set('travelDays', form.travelDays + 1)} className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#2D2D2D] font-bold text-lg flex items-center justify-center">+</button>
                </div>
              </EField>
            )}
          </>
        )}

        {form.isMultiPhase && (
          <EField label="Trip Phases">
            <PhaseBuilder phases={form.phases || []} onChange={phases => set('phases', phases)} />
          </EField>
        )}

        {days > 0 && (
          <div className="bg-[#f0f7f3] rounded-xl p-3 text-[15px] text-[#1B4332] font-semibold text-center">
            {days} day trip
            {travelers.map(t => {
              const age = ageAtDate(t.dob, firstPhaseDate)
              if (age === null || !form.selectedTravelers.includes(t.id)) return null
              return <span key={t.id} className="ml-2 text-[#95C4A1]">· {t.name}: {age}yo</span>
            })}
          </div>
        )}

        <EField label="Travelers">
          <div className="grid grid-cols-2 gap-2">
            {TRAVELER_ORDER_EDIT.map(id => (
              <label key={id} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${form.selectedTravelers.includes(id) ? 'border-[#1B4332] bg-[#f0f7f3]' : 'border-[#E5E7EB] bg-white'}`}>
                <input type="checkbox" checked={form.selectedTravelers.includes(id)} onChange={() => toggleTraveler(id)} className="sr-only" />
                <span className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-none ${form.selectedTravelers.includes(id) ? 'bg-[#1B4332] border-[#1B4332]' : 'border-[#D1D5DB]'}`}>
                  {form.selectedTravelers.includes(id) && <span className="text-white font-bold" style={{ fontSize: '9px' }}>✓</span>}
                </span>
                <span className="text-[15px] font-medium text-[#2D2D2D]">{TRAVELER_LABELS_EDIT[id]}</span>
              </label>
            ))}
          </div>
        </EField>

        <EField label="Bags for this Trip">
          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
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
                  <p className="text-[13px] text-[#6B7280]">{BAG_OWNER_LABELS_EDIT[bag.owner] || bag.owner}{bag.emptyWeight ? ` · ${bag.emptyWeight} lbs empty` : ''}</p>
                </div>
              </label>
            ))}
          </div>
        </EField>

        <EField label="Washing Machine Available?">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('washingMachineAvailable', !form.washingMachineAvailable)}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.washingMachineAvailable ? 'bg-[#1B4332]' : 'bg-[#D1D5DB]'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.washingMachineAvailable ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-[15px] text-[#2D2D2D]">{form.washingMachineAvailable ? 'Yes' : 'No'}</span>
          </label>
        </EField>

        {isBusiness && (
          <EField label="Suit Days">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => set('suitDays', Math.max(0, form.suitDays - 1))} className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#2D2D2D] font-bold text-lg flex items-center justify-center">−</button>
              <span className="text-xl font-bold text-[#2D2D2D] w-8 text-center">{form.suitDays}</span>
              <button type="button" onClick={() => set('suitDays', form.suitDays + 1)} className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#2D2D2D] font-bold text-lg flex items-center justify-center">+</button>
            </div>
          </EField>
        )}

        {isBusiness && form.suitDays > 0 && (
          <EField label="Which Suits?">
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
          </EField>
        )}

        {isBusiness && (
          <EField label="Dress Shirt Days (no suit)">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => set('dressShirtDays', Math.max(0, form.dressShirtDays - 1))} className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#2D2D2D] font-bold text-lg flex items-center justify-center">−</button>
              <span className="text-xl font-bold text-[#2D2D2D] w-8 text-center">{form.dressShirtDays}</span>
              <button type="button" onClick={() => set('dressShirtDays', form.dressShirtDays + 1)} className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#2D2D2D] font-bold text-lg flex items-center justify-center">+</button>
            </div>
          </EField>
        )}

        {isBusiness && form.isMultiPhase && (form.suitDays + form.dressShirtDays) > 0 && (
          <EField label="Bring extra dress shirt for Phase 2?">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => set('extraDressShirtPhase2', !form.extraDressShirtPhase2)}
                className={`w-12 h-6 rounded-full transition-colors relative ${form.extraDressShirtPhase2 ? 'bg-[#1B4332]' : 'bg-[#D1D5DB]'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.extraDressShirtPhase2 ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-[15px] text-[#2D2D2D]">{form.extraDressShirtPhase2 ? 'Yes' : 'No'}</span>
            </label>
          </EField>
        )}

        <EField label="Notes">
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            placeholder="Special notes, reminders, etc."
            className="input resize-none"
          />
        </EField>

        <div className="flex gap-3 pb-4">
          <button onClick={handleSave} className="flex-1 bg-[#1B4332] text-white font-bold py-4 rounded-xl text-[15px] active:bg-[#143528] transition-colors">
            Save Changes
          </button>
          <button onClick={onCancel} className="flex-1 bg-[#F3F4F6] text-[#6B7280] font-semibold py-4 rounded-xl text-[15px]">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function EField({ label, hint, children }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-[#6B7280] mb-1.5 uppercase tracking-[0.04em]">{label}</label>
      {hint && <p className="text-[13px] text-[#9CA3AF] mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}
