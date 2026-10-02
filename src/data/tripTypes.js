// Trip type definitions. `config` flags drive the packing engine.
export const TRIP_TYPES = [
  {
    id: 'solo-intl-work',
    label: 'Solo International Work',
    icon: '💼',
    description: 'MIPCOM-style business travel abroad',
    defaultTravelers: ['topher'],
    config: {
      isFlying: true,
      isDriving: false,
      isInternational: true,
      isBusiness: true,
      isBeach: false,
      isCold: false,
      isWarm: false,
      isMIPCOM: false, // toggled by trip name or notes
    },
  },
  {
    id: 'family-beach',
    label: 'Family Beach Trip',
    icon: '🏖️',
    description: 'Beach vacation with the whole family',
    defaultTravelers: ['topher', 'lanita', 'crosby', 'penn'],
    config: {
      isFlying: true,
      isDriving: false,
      isInternational: false,
      isBusiness: false,
      isBeach: true,
      isCold: false,
      isWarm: true,
      isMIPCOM: false,
    },
  },
  {
    id: 'family-desert-drive',
    label: 'Family Desert / Short Drive',
    icon: '🌵',
    description: 'Road trip — no flights',
    defaultTravelers: ['topher', 'lanita', 'crosby', 'penn'],
    config: {
      isFlying: false,
      isDriving: true,
      isInternational: false,
      isBusiness: false,
      isBeach: false,
      isCold: false,
      isWarm: true,
      isMIPCOM: false,
    },
  },
  {
    id: 'weekend-domestic',
    label: 'Weekend Domestic',
    icon: '🏠',
    description: '— stub —',
    defaultTravelers: ['topher'],
    stub: true,
    config: { isFlying: true, isDriving: false, isInternational: false, isBusiness: false, isBeach: false, isCold: false, isWarm: false, isMIPCOM: false },
  },
  {
    id: 'theme-park',
    label: 'Theme Park',
    icon: '🎢',
    description: '— stub —',
    defaultTravelers: ['topher', 'lanita', 'crosby', 'penn'],
    stub: true,
    config: { isFlying: false, isDriving: true, isInternational: false, isBusiness: false, isBeach: false, isCold: false, isWarm: false, isMIPCOM: false },
  },
  {
    id: 'solo-writing-retreat',
    label: 'Solo Writing Retreat',
    icon: '✍️',
    description: '— stub —',
    defaultTravelers: ['topher'],
    stub: true,
    config: { isFlying: true, isDriving: false, isInternational: false, isBusiness: false, isBeach: false, isCold: false, isWarm: false, isMIPCOM: false },
  },
  {
    id: 'vegas',
    label: 'Vegas',
    icon: '🎰',
    description: '— stub —',
    defaultTravelers: ['topher'],
    stub: true,
    config: { isFlying: true, isDriving: false, isInternational: false, isBusiness: false, isBeach: false, isCold: false, isWarm: true, isMIPCOM: false },
  },
]

export function getTripType(id) {
  return TRIP_TYPES.find(t => t.id === id) || TRIP_TYPES[0]
}

export function getEffectiveTripTypes(customTripTypes = [], deletedTripTypeIds = []) {
  const deletedSet = new Set(deletedTripTypeIds)
  return [
    ...TRIP_TYPES.filter(t => !deletedSet.has(t.id)),
    ...(customTripTypes || []),
  ]
}

export function getEffectiveTripType(id, customTripTypes = [], deletedTripTypeIds = []) {
  return getEffectiveTripTypes(customTripTypes, deletedTripTypeIds).find(t => t.id === id)
    || TRIP_TYPES.find(t => t.id === id)
    || TRIP_TYPES[0]
}
