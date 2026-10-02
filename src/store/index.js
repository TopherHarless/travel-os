import { useState, useCallback } from 'react'
import { DEFAULT_TRAVELERS } from '../data/travelers.js'
import { DEFAULT_BAGS, BAGS_MIGRATION_VERSION } from '../data/bags.js'

const STORAGE_KEY = 'travel-os-v1'

// MIPCOM 2026 preloaded trip
const PRELOADED_TRIPS = [
  {
    id: 'mipcom-2026',
    name: 'MIPCOM 2026',
    type: 'solo-intl-work',
    destination: 'Cannes, France',
    departureDate: '2026-10-08',
    returnDate: '2026-10-17',
    airline: 'TBD',
    selectedTravelers: ['topher'],
    washingMachineAvailable: true,
    suitDays: 5,
    travelDays: 2,
    isMultiPhase: false,
    notes: 'Collar stays required. EU adapters required. Work iPhone active. Laptop active. Portable Rain Machine active.',
    checkedItems: {},
    checkedTasks: {},
    isArchived: false,
    createdAt: '2026-01-01',
  },
]

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

function getInitialState() {
  const saved = loadState()
  if (!saved) return {
    travelers: DEFAULT_TRAVELERS,
    bags: DEFAULT_BAGS,
    trips: PRELOADED_TRIPS,
    settings: { defaultAirlineWeightLimit: 50 },
    userInventory: {},
    templateOverrides: {},
    customTripTypes: [],
    deletedTripTypeIds: [],
    bagsMigrationVersion: BAGS_MIGRATION_VERSION,
  }

  const savedVersion = saved.bagsMigrationVersion ?? 1
  const needsMigration = savedVersion < BAGS_MIGRATION_VERSION

  // Re-merge reference fields (brand, color, dimensions, owner, label) from DEFAULT_BAGS
  // when the migration version advances. User-toggleable `active` and freeform `notes` are preserved.
  let bags = saved.bags
  if (needsMigration) {
    bags = bags.map(savedBag => {
      const ref = DEFAULT_BAGS.find(b => b.id === savedBag.id)
      if (!ref) return savedBag
      return { ...ref, active: savedBag.active, notes: savedBag.notes }
    })
  }

  // Inject any default bags whose IDs are not yet in saved state
  const savedIds = new Set(bags.map(b => b.id))
  const missingBags = DEFAULT_BAGS.filter(b => !savedIds.has(b.id))

  // Always spread defaults for new fields so they exist even in old saved state
  return {
    customTripTypes: [],
    deletedTripTypeIds: [],
    ...saved,
    bags: [...bags, ...missingBags],
    bagsMigrationVersion: BAGS_MIGRATION_VERSION,
  }
}

// Custom hook — returns [state, actions]
export function useTravelStore() {
  const [state, setStateRaw] = useState(getInitialState)

  const setState = useCallback((updater) => {
    setStateRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveState(next)
      return next
    })
  }, [])

  // ── Trips ──────────────────────────────────────────────────────────────────

  const addTrip = useCallback((trip) => {
    const newTrip = {
      id: `trip-${Date.now()}`,
      checkedItems: {},
      checkedTasks: {},
      isArchived: false,
      createdAt: new Date().toISOString().split('T')[0],
      ...trip,
    }
    setState(s => ({ ...s, trips: [newTrip, ...s.trips] }))
    return newTrip.id
  }, [setState])

  const updateTrip = useCallback((id, updates) => {
    setState(s => ({
      ...s,
      trips: s.trips.map(t => t.id === id ? { ...t, ...updates } : t),
    }))
  }, [setState])

  const deleteTrip = useCallback((id) => {
    setState(s => ({ ...s, trips: s.trips.filter(t => t.id !== id) }))
  }, [setState])

  const archiveTrip = useCallback((id) => {
    setState(s => ({
      ...s,
      trips: s.trips.map(t => t.id === id ? { ...t, isArchived: true } : t),
    }))
  }, [setState])

  const toggleItem = useCallback((tripId, itemId) => {
    setState(s => ({
      ...s,
      trips: s.trips.map(t => {
        if (t.id !== tripId) return t
        const checked = { ...t.checkedItems, [itemId]: !t.checkedItems[itemId] }
        return { ...t, checkedItems: checked }
      }),
    }))
  }, [setState])

  const toggleTask = useCallback((tripId, taskId) => {
    setState(s => ({
      ...s,
      trips: s.trips.map(t => {
        if (t.id !== tripId) return t
        const checked = { ...t.checkedTasks, [taskId]: !t.checkedTasks[taskId] }
        return { ...t, checkedTasks: checked }
      }),
    }))
  }, [setState])

  const setItemPhase = useCallback((tripId, itemId, phase) => {
    setState(s => ({
      ...s,
      trips: s.trips.map(t => {
        if (t.id !== tripId) return t
        const phases = { ...t.itemPhases, [itemId]: phase }
        return { ...t, itemPhases: phases }
      }),
    }))
  }, [setState])

  // ── Travelers ──────────────────────────────────────────────────────────────

  const addTraveler = useCallback((traveler) => {
    const id = `t-${Date.now()}`
    setState(s => ({ ...s, travelers: [...s.travelers, { id, ...traveler }] }))
  }, [setState])

  const updateTraveler = useCallback((id, updates) => {
    setState(s => ({
      ...s,
      travelers: s.travelers.map(t => t.id === id ? { ...t, ...updates } : t),
    }))
  }, [setState])

  // ── User Inventory ────────────────────────────────────────────────────────

  const addUserItem = useCallback((traveler, category, item) => {
    const fullItem = { id: `ui-${Date.now()}`, ...item }
    setState(s => ({
      ...s,
      userInventory: {
        ...s.userInventory,
        [traveler]: {
          ...(s.userInventory?.[traveler] || {}),
          [category]: [...(s.userInventory?.[traveler]?.[category] || []), fullItem],
        },
      },
    }))
    return fullItem.id
  }, [setState])

  const updateUserItem = useCallback((traveler, category, itemId, updates) => {
    setState(s => ({
      ...s,
      userInventory: {
        ...s.userInventory,
        [traveler]: {
          ...(s.userInventory?.[traveler] || {}),
          [category]: (s.userInventory?.[traveler]?.[category] || []).map(
            item => item.id === itemId ? { ...item, ...updates } : item
          ),
        },
      },
    }))
  }, [setState])

  const deleteUserItem = useCallback((traveler, category, itemId) => {
    setState(s => ({
      ...s,
      userInventory: {
        ...s.userInventory,
        [traveler]: {
          ...(s.userInventory?.[traveler] || {}),
          [category]: (s.userInventory?.[traveler]?.[category] || []).filter(i => i.id !== itemId),
        },
      },
    }))
  }, [setState])

  const addTripItem = useCallback((tripId, traveler, category, item) => {
    const fullItem = { id: `ti-${Date.now()}`, ...item }
    setState(s => ({
      ...s,
      trips: s.trips.map(t => {
        if (t.id !== tripId) return t
        const existing = t.customItems || {}
        return {
          ...t,
          customItems: {
            ...existing,
            [traveler]: {
              ...(existing[traveler] || {}),
              [category]: [...(existing[traveler]?.[category] || []), fullItem],
            },
          },
        }
      }),
    }))
  }, [setState])

  const removeTripItem = useCallback((tripId, itemId) => {
    setState(s => ({
      ...s,
      trips: s.trips.map(t =>
        t.id !== tripId ? t : { ...t, removedItemIds: [...(t.removedItemIds || []), itemId] }
      ),
    }))
  }, [setState])

  const restoreTripItem = useCallback((tripId, itemId) => {
    setState(s => ({
      ...s,
      trips: s.trips.map(t =>
        t.id !== tripId ? t : { ...t, removedItemIds: (t.removedItemIds || []).filter(id => id !== itemId) }
      ),
    }))
  }, [setState])

  // ── Template Overrides ────────────────────────────────────────────────────

  const addTemplateItem = useCallback((tripTypeId, item) => {
    setState(s => {
      const existing = s.templateOverrides?.[tripTypeId] || {}
      return {
        ...s,
        templateOverrides: {
          ...(s.templateOverrides || {}),
          [tripTypeId]: { ...existing, additions: [...(existing.additions || []), item] },
        },
      }
    })
  }, [setState])

  const removeTemplateItem = useCallback((tripTypeId, itemId) => {
    setState(s => {
      const existing = s.templateOverrides?.[tripTypeId] || {}
      if ((existing.removals || []).includes(itemId)) return s
      return {
        ...s,
        templateOverrides: {
          ...(s.templateOverrides || {}),
          [tripTypeId]: { ...existing, removals: [...(existing.removals || []), itemId] },
        },
      }
    })
  }, [setState])

  const restoreTemplateItem = useCallback((tripTypeId, itemId) => {
    setState(s => {
      const existing = s.templateOverrides?.[tripTypeId] || {}
      return {
        ...s,
        templateOverrides: {
          ...(s.templateOverrides || {}),
          [tripTypeId]: { ...existing, removals: (existing.removals || []).filter(id => id !== itemId) },
        },
      }
    })
  }, [setState])

  const deleteTemplateItem = useCallback((tripTypeId, itemId) => {
    setState(s => {
      const existing = s.templateOverrides?.[tripTypeId] || {}
      return {
        ...s,
        templateOverrides: {
          ...(s.templateOverrides || {}),
          [tripTypeId]: { ...existing, additions: (existing.additions || []).filter(i => i.id !== itemId) },
        },
      }
    })
  }, [setState])

  const updateTemplateItem = useCallback((tripTypeId, itemId, updates) => {
    setState(s => {
      const existing = s.templateOverrides?.[tripTypeId] || {}
      return {
        ...s,
        templateOverrides: {
          ...(s.templateOverrides || {}),
          [tripTypeId]: {
            ...existing,
            additions: (existing.additions || []).map(i => i.id === itemId ? { ...i, ...updates } : i),
          },
        },
      }
    })
  }, [setState])

  // ── Custom Trip Types ─────────────────────────────────────────────────────

  const addCustomTripType = useCallback((tripType) => {
    const newType = { id: `custom-${Date.now()}`, isCustom: true, ...tripType }
    setState(s => ({ ...s, customTripTypes: [...(s.customTripTypes || []), newType] }))
    return newType.id
  }, [setState])

  const deleteCustomTripType = useCallback((id) => {
    setState(s => ({ ...s, customTripTypes: (s.customTripTypes || []).filter(t => t.id !== id) }))
  }, [setState])

  const softDeleteBuiltinTripType = useCallback((id) => {
    setState(s => {
      const existing = new Set(s.deletedTripTypeIds || [])
      existing.add(id)
      return { ...s, deletedTripTypeIds: [...existing] }
    })
  }, [setState])

  // ── Bags ──────────────────────────────────────────────────────────────────

  const addBag = useCallback((bag) => {
    const newBag = { id: `BAG-${Date.now()}`, active: true, ...bag }
    setState(s => ({ ...s, bags: [...s.bags, newBag] }))
  }, [setState])

  const updateBag = useCallback((id, updates) => {
    setState(s => ({
      ...s,
      bags: s.bags.map(b => b.id === id ? { ...b, ...updates } : b),
    }))
  }, [setState])

  // ── Settings ──────────────────────────────────────────────────────────────

  const updateSettings = useCallback((updates) => {
    setState(s => ({ ...s, settings: { ...s.settings, ...updates } }))
  }, [setState])

  return {
    state,
    addTrip,
    updateTrip,
    deleteTrip,
    archiveTrip,
    toggleItem,
    toggleTask,
    setItemPhase,
    updateTraveler,
    addBag,
    updateBag,
    updateSettings,
    addTraveler,
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
  }
}
