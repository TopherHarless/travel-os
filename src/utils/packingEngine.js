import { tripDays as calcTripDays, ageAtDate, ageInMonthsAtDate } from './dates.js'
import { ALL_ITEMS } from '../data/items.js'
import { getTripType } from '../data/tripTypes.js'

// Build the resolved config object for a given trip + travelers
export function buildTripConfig(trip, travelers) {
  const typeData = getTripType(trip.type)
  const base = typeData?.config ?? {}

  const pennTraveler = travelers.find(t => t.id === 'penn')
  const pennAgeMonths = pennTraveler ? ageInMonthsAtDate(pennTraveler.dob, trip.departureDate) : null
  const pennAge       = pennTraveler ? ageAtDate(pennTraveler.dob, trip.departureDate) : null

  const isMIPCOM = base.isMIPCOM ||
    (trip.notes || '').toLowerCase().includes('mipcom') ||
    (trip.name  || '').toLowerCase().includes('mipcom')

  const suitDays = trip.suitDays ?? 0
  const dressShirtDays = trip.dressShirtDays ?? 0

  // Multi-phase: sum days and travel days across all phases
  let days, travelDays, hasFlights
  if (trip.isMultiPhase && trip.phases?.length > 0) {
    const phaseDays = trip.phases.reduce((sum, ph) => {
      const d = calcTripDays(ph.departureDate, ph.returnDate)
      return sum + (d > 0 ? d : 0)
    }, 0)
    days = phaseDays || calcTripDays(trip.departureDate, trip.returnDate)
    travelDays = trip.phases.reduce((sum, ph) => sum + (ph.hasFlights ? Math.max(2, ph.travelDays ?? 2) : 0), 0)
    hasFlights = trip.phases.some(ph => ph.hasFlights)
  } else {
    const _hasFlights = trip.hasFlights !== undefined ? trip.hasFlights : (base.isFlying ?? false)
    days = calcTripDays(trip.departureDate, trip.returnDate)
    travelDays = _hasFlights ? Math.max(2, trip.travelDays ?? 2) : 0
    hasFlights = _hasFlights
  }

  return {
    ...base,
    // Trip type ID as a truthy flag so user items can target specific trip types via conditions
    [trip.type]: true,
    isMIPCOM,
    suitEvent5Day: suitDays >= 5,
    days,
    travelerCount: trip.selectedTravelers?.length ?? 1,
    suitDays,
    dressShirtDays,
    hasFormalDays: suitDays > 0 || dressShirtDays > 0,
    selectedSuits: new Set(trip.selectedSuits || []),
    travelDays,
    isFlying: hasFlights,
    washingMachine: trip.washingMachineAvailable ?? false,
    isOutdoor: base.isBeach || base.isAdventure || false,
    isOutdoorWater: base.isBeach || base.isAdventure || false,
    isBeachOrDriving: base.isBeach || base.isDriving || false,
    weatherDependent: true,
    pennAgeMonths,
    pennAge,
    pennInfant:         pennAgeMonths !== null && pennAgeMonths < 24,
    pennToddler:        pennAge !== null && pennAge >= 2 && pennAge < 3,
    pennChild:          pennAge !== null && pennAge >= 3,
    pennInfantToddler:  pennAge !== null && pennAge < 3,
  }
}

// Resolve a quantity key to a human-readable string or number
export function resolveQty(key, cfg) {
  // Rule-object qty: { rule: 'per_day', value: null } or { rule: 'fixed', value: 3 }
  if (key && typeof key === 'object' && key.rule) {
    switch (key.rule) {
      case 'fixed':            return key.value ?? 1
      case 'per_day':          return cfg.days ?? 1
      case 'per_day_plus_one': return (cfg.days ?? 1) + 1
      case 'per_week':         return Math.ceil((cfg.days ?? 1) / 7)
      case 'per_traveler':     return cfg.travelerCount ?? 1
      case 'per_suit_day':     return cfg.suitDays ?? 0
      case 'custom':           return resolveQty(key.value, cfg)
      default:                 return key.value ?? 1
    }
  }
  if (typeof key === 'number') return key
  switch (key) {
    case 'compressionSocks':   return cfg.travelDays
    case 'toperUnderwear':     return cfg.washingMachine ? cfg.days + 2 : cfg.days * 2
    case 'lanitaUnderwear':    return cfg.days + 2
    case 'crosbyUnderwear':    return cfg.days + 2
    case 'supplementZiplocs':  return cfg.days + 2
    case 'chiaShotPackets':    return cfg.days + 3
    case 'casualTshirts':      return Math.max(1, cfg.days - cfg.suitDays)
    case 'lanitaTshirts':      return Math.max(1, cfg.days - 1)
    case 'crosbyTshirts':      return Math.max(1, cfg.days - 1)
    case 'dressShirts':        return cfg.suitDays + cfg.dressShirtDays + 1
    case 'tiesTotal':          return cfg.suitDays + cfg.dressShirtDays
    case 'suitDaysPlusOne':    return cfg.suitDays + 1
    case 'formalDaysPlusOne':  return cfg.suitDays + cfg.dressShirtDays + 1
    case 'tripDays':           return cfg.days
    case 'pennOnesies':        return cfg.days + 2
    case 'pennPajamas':        return cfg.days + 1
    case 'pennSocks':          return cfg.days + 2
    case 'pennBibs':           return cfg.days + 2
    case 'pennDiapers':        return cfg.days * 8
    case 'pennUnderwear':      return cfg.days + 2
    default: return key
  }
}

// Check if a single item is active given the trip config
export function itemIsActive(item, cfg) {
  const conds = item.conditions
  if (!conds || conds.length === 0) return false
  if (conds.includes('always')) return true
  return conds.every(c => !!cfg[c])
}

// Return all active items for a traveler as { category: [ {item, resolvedQty} ] }
// Accepts optional userItems: { [category]: [item, ...] } to merge in
export function getPackingListForTraveler(travelerId, cfg, userItems = {}) {
  const travelerItems = ALL_ITEMS[travelerId]
  if (!travelerItems) return {}

  const result = {}

  const SUIT_IDS = new Set(['t-navy-suit', 't-olive-suit', 't-brown-suit', 't-linen-suit'])

  // Static items from items.js
  for (const [category, items] of Object.entries(travelerItems)) {
    const active = items
      .filter(item => itemIsActive(item, cfg))
      .filter(item => {
        if (!SUIT_IDS.has(item.id)) return true
        const sel = cfg.selectedSuits instanceof Set ? cfg.selectedSuits : new Set(cfg.selectedSuits || [])
        if (sel.size === 0) return false
        return sel.has(item.id)
      })
      .map(item => ({ ...item, resolvedQty: resolveQty(item.qty, cfg) }))
    if (active.length > 0) result[category] = active
  }

  // User-created inventory items (same conditions logic)
  for (const [category, items] of Object.entries(userItems)) {
    const active = items
      .filter(item => itemIsActive(item, cfg))
      .map(item => ({ ...item, resolvedQty: resolveQty(item.qty ?? 1, cfg), isUserItem: true }))
    if (active.length > 0) {
      result[category] = [...(result[category] || []), ...active]
    }
  }

  return result
}

// Return shared items (only when multiple travelers)
export function getSharedPackingList(selectedTravelerIds, cfg) {
  if (selectedTravelerIds.length < 2) return {}
  const result = {}
  for (const [category, items] of Object.entries(ALL_ITEMS.shared)) {
    const active = items
      .filter(item => itemIsActive(item, cfg))
      .map(item => ({ ...item, resolvedQty: resolveQty(item.qty, cfg) }))
    if (active.length > 0) result[category] = active
  }
  return result
}

// Full packing list for all selected travelers.
// userInventory: { [travelerId]: { [category]: [item] } }  — merged in alongside static items
// templateOverrides: { [tripTypeId]: { removals: [id], additions: [item] } }
// itemOverrides: { [itemId]: item }  — name/qty/note edits to static items made via Inventory view
// Applies trip.removedItemIds, templateOverrides, itemOverrides, and trip.customItems after the base list.
export function generatePackingList(trip, travelers, userInventory = {}, templateOverrides = {}, itemOverrides = {}) {
  const cfg = buildTripConfig(trip, travelers)
  const removedIds = new Set(trip.removedItemIds || [])

  const tmpl = templateOverrides[trip.type] || {}
  const templateRemovedIds = new Set(tmpl.removals || [])
  const allRemovedIds = new Set([...removedIds, ...templateRemovedIds])

  const result = {}

  for (const tid of trip.selectedTravelers) {
    const userItems = userInventory[tid] || {}
    const baseList  = getPackingListForTraveler(tid, cfg, userItems)

    // Apply item overrides (name/qty/note edits made in Inventory view to static items)
    const overriddenList = {}
    for (const [cat, items] of Object.entries(baseList)) {
      overriddenList[cat] = items.map(item =>
        itemOverrides[item.id] ? { ...item, ...itemOverrides[item.id] } : item
      )
    }

    // Apply removals (trip-level + template-level)
    const finalList = {}
    for (const [cat, items] of Object.entries(overriddenList)) {
      const filtered = items.filter(item => !allRemovedIds.has(item.id))
      if (filtered.length) finalList[cat] = filtered
    }

    // Template additions — appear for every trip of this type
    for (const item of (tmpl.additions || []).filter(a => a.traveler === tid)) {
      if (removedIds.has(item.id)) continue
      const cat = item.category || 'misc'
      const existingIds = new Set(Object.values(finalList).flat().map(i => i.id))
      if (!existingIds.has(item.id)) {
        const resolved = { ...item, resolvedQty: typeof item.qty === 'number' ? item.qty : 1, isTemplateAddition: true }
        finalList[cat] = [...(finalList[cat] || []), resolved]
      }
    }

    // Trip-custom items always appear regardless of conditions
    const tripCustom = trip.customItems?.[tid] || {}
    for (const [cat, items] of Object.entries(tripCustom)) {
      const existing = new Set(Object.values(finalList).flat().map(i => i.id))
      const toAdd = items
        .filter(item => !existing.has(item.id) && !allRemovedIds.has(item.id))
        .map(item => ({
          ...item,
          resolvedQty: typeof item.qty === 'number' ? item.qty : 1,
          isTripCustom: true,
        }))
      if (toAdd.length) finalList[cat] = [...(finalList[cat] || []), ...toAdd]
    }

    result[tid] = finalList
  }

  if (trip.selectedTravelers.length > 1) {
    const sharedBase = getSharedPackingList(trip.selectedTravelers, cfg)
    const sharedFinal = {}
    for (const [cat, items] of Object.entries(sharedBase)) {
      const filtered = items.filter(item => !allRemovedIds.has(item.id))
      if (filtered.length) sharedFinal[cat] = filtered
    }
    result.shared = sharedFinal
  }

  return { cfg, list: result }
}
