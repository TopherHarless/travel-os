import { formatDate } from './dates.js'
import { TRIP_TYPES } from '../data/tripTypes.js'

const TRAVELER_LABELS = { topher: 'Topher', lanita: 'La Nita', crosby: 'Crosby', penn: 'Penn', shared: 'Shared' }
const CAT_LABELS = {
  clothing: 'Clothing', toiletries: 'Toiletries', medical: 'Medical / Supplements',
  hydration: 'Hydration', yogurt: 'Yogurt', technology: 'Technology', power: 'Power',
  comfort: 'Travel Comfort', documents: 'Documents', misc: 'Misc',
  infant: 'Infant Items', toddler: 'Toddler Items', child: 'Child Items', gear: 'Gear',
  essentials: 'Shared Essentials',
}

export function exportTripMarkdown(trip, packingList, preTripTasks, day1Tasks) {
  const tripType = TRIP_TYPES.find(t => t.id === trip.type)
  const lines = []

  lines.push(`# ✈️ ${trip.name || 'Trip'}`)
  lines.push('')
  lines.push(`**Type:** ${tripType?.label || trip.type}`)
  lines.push(`**Destination:** ${trip.destination || '—'}`)
  lines.push(`**Dates:** ${formatDate(trip.departureDate)} → ${formatDate(trip.returnDate)}`)
  lines.push(`**Airline:** ${trip.airline || 'TBD'}`)
  lines.push(`**Travelers:** ${trip.selectedTravelers?.map(id => TRAVELER_LABELS[id]).join(', ') || '—'}`)
  if (trip.notes) lines.push(`**Notes:** ${trip.notes}`)
  lines.push('')

  if (preTripTasks?.length) {
    lines.push('## Pre-Trip Tasks')
    lines.push('')
    preTripTasks.forEach(t => lines.push(`- [ ] ${t.text}`))
    lines.push('')
  }

  if (day1Tasks?.length) {
    lines.push('## Day 1 Tasks')
    lines.push('')
    day1Tasks.forEach(t => lines.push(`- [ ] ${t.text}`))
    lines.push('')
  }

  lines.push('## Packing List')
  lines.push('')

  for (const [travelerId, categories] of Object.entries(packingList)) {
    if (!categories || Object.keys(categories).length === 0) continue
    lines.push(`### ${TRAVELER_LABELS[travelerId] || travelerId}`)
    lines.push('')

    for (const [cat, items] of Object.entries(categories)) {
      if (!items?.length) continue
      lines.push(`#### ${CAT_LABELS[cat] || cat}`)
      items.forEach(item => {
        const qty = item.resolvedQty !== undefined && item.resolvedQty !== 1
          ? ` (×${item.resolvedQty})`
          : ''
        const heavy = item.isHeavy ? ' ⚠️ HEAVY' : ''
        lines.push(`- [ ] ${item.name}${qty}${heavy}`)
      })
      lines.push('')
    }
  }

  return lines.join('\n')
}

export function downloadMarkdown(content, filename) {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
