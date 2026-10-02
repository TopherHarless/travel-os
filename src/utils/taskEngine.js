// Generates pre-trip and day-1 tasks from trip config

export function generateTasks(trip, cfg, travelers) {
  const preTripTasks = []
  const day1Tasks    = []

  const days = cfg.days
  const airline = trip.airline || '[airline]'
  const destination = trip.destination || '[destination]'

  // Always
  preTripTasks.push({ id: 'pt-airline-weight', text: `Confirm airline weight limits for ${airline}` })
  preTripTasks.push({ id: 'pt-washer',         text: `Check washing machine availability at ${destination}` })

  // If flying
  if (cfg.isFlying) {
    const supQty = days + 2
    preTripTasks.push({ id: 'pt-psyllium', text: `Portion Psyllium Husk into ${supQty} individual Ziploc bags` })
    preTripTasks.push({ id: 'pt-potato',   text: `Portion Potato Starch into ${supQty} individual Ziploc bags` })
    preTripTasks.push({ id: 'pt-creatine', text: `Portion Creatine into ${supQty} individual Ziploc bags` })
  }

  // Yogurt
  if (cfg.isFlying && !cfg.isInternational) {
    day1Tasks.push({ id: 'd1-yogurt-domestic', text: 'Buy Chobani 20g protein Greek yogurt drink at grocery store near destination' })
  }
  if (cfg.isFlying && cfg.isInternational) {
    day1Tasks.push({ id: 'd1-yogurt-intl', text: 'Buy local high-protein Greek yogurt equivalent near destination' })
  }

  // Penn
  const pennSelected = trip.selectedTravelers?.includes('penn')
  if (pennSelected && cfg.pennInfant) {
    preTripTasks.push({ id: 'pt-packnplay', text: "Confirm Pack 'n Play / travel crib at destination (or add to packing list)" })
  }

  // Driving
  if (cfg.isDriving) {
    preTripTasks.push({ id: 'pt-yogurt-drive', text: 'Pack Chobani yogurt drinks in cooler over ice' })
    preTripTasks.push({ id: 'pt-cooler',       text: 'Confirm cooler + ice packs on packing list' })
  }

  // Multi-phase repack checklist
  const repackTasks = []
  if (trip.isMultiPhase && trip.phases?.length > 1) {
    const p1 = trip.phases[0]
    const p2 = trip.phases[1]
    const p1Label = p1.name || 'Phase 1'
    const p2Label = p2.name || 'Phase 2'
    const transition = `${p1Label} → ${p2Label}`
    repackTasks.push({ id: 'rp-laundry',    text: `Night before transition (${transition}): Do laundry — underwear, socks, undershirts, jeans` })
    repackTasks.push({ id: 'rp-sort-p1',    text: `Morning of transition: Sort 🟦 items into shipment box (${p1Label} only)` })
    repackTasks.push({ id: 'rp-move-both',  text: `Morning of transition: Move 🟩 items to ${p2Label} bag` })
    repackTasks.push({ id: 'rp-confirm-p2', text: `Morning of transition: Confirm 🟧 items are ready for ${p2Label}` })
    repackTasks.push({ id: 'rp-verify-box', text: `Day of ${p1Label} departure: Verify ship-home box is complete` })
    repackTasks.push({ id: 'rp-chargers',   text: `Day of transition: Confirm all chargers moved to ${p2Label} bag` })
  }

  return { preTripTasks, day1Tasks, repackTasks }
}
