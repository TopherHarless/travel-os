export const DEFAULT_BAGS = [
  { id: 'TOPHER-LG',     label: '29" Large',  brand: 'Delsey Helium Aero', color: 'Grey',        emptyWeight: 12.5, dimensions: '29" × 19.5" × 12.5"', owner: 'topher', active: true  },
  { id: 'TOPHER-MD',     label: '25" Medium', brand: 'Delsey Helium Aero', color: 'Grey',        emptyWeight: 8.4,  dimensions: '25" × 17.5" × 11.5"', owner: 'topher', active: true  },
  { id: 'TOPHER-SM',     label: '19" Small',  brand: 'Delsey Helium Aero', color: 'Grey',        emptyWeight: 8.2,  dimensions: '19" × 13" × 9.5"',    owner: 'topher', active: true  },
  { id: 'LANITA-MD',     label: '25" Medium', brand: 'Delsey Helium Aero', color: 'Blue Cobalt', emptyWeight: 8.4,  dimensions: '25" × 17.5" × 11.5"', owner: 'lanita', active: true  },
  { id: 'LANITA-SM',     label: '19" Small',  brand: 'Delsey Helium Aero', color: 'Blue Cobalt', emptyWeight: 8.2,  dimensions: '19" × 13" × 9.5"',    owner: 'crosby', active: true  },
  { id: 'LANITA-SM-RED', label: '19" Small',  brand: 'Delsey Helium Aero', color: 'Red',         emptyWeight: 8.2,  dimensions: '19" × 13" × 9.5"',    owner: 'lanita', active: true  },
  { id: 'LANITA-LG',     label: '29" Large',  brand: 'Delsey Helium Aero', color: 'Blue Cobalt', emptyWeight: 12.5, dimensions: '29" × 19.5" × 12.5"', owner: 'lanita', active: false },
  { id: 'TOPHER-BP',     label: 'Backpack',   emptyWeight: null,  owner: 'topher', active: true  },
  { id: 'LANITA-BP',     label: 'Backpack',   emptyWeight: null,  owner: 'lanita', active: true  },
  { id: 'CROSBY-BP',     label: 'Backpack',   emptyWeight: null,  owner: 'crosby', active: true  },
  { id: 'PENN-BP',       label: 'Backpack',   emptyWeight: null,  owner: 'penn',   active: true  },
  { id: 'FAMILY-DIAPER', label: 'Diaper Bag', emptyWeight: null,  owner: 'penn',   active: true  },
]

// Bump this when DEFAULT_BAGS changes so getInitialState re-merges reference fields
export const BAGS_MIGRATION_VERSION = 2

export const AIRLINE_WEIGHT_LIMITS = {
  'delta':           50,
  'united':          50,
  'american':        50,
  'southwest':       50,
  'air france':      50,
  'lufthansa':       50,
  'british airways': 50,
  'ryanair':         44,
  'easyjet':         44,
  'default':         50,
}

export function getAirlineLimit(airlineName) {
  if (!airlineName) return 50
  const key = airlineName.toLowerCase().trim()
  for (const [airline, limit] of Object.entries(AIRLINE_WEIGHT_LIMITS)) {
    if (key.includes(airline)) return limit
  }
  return 50
}
