# Claude Code Prompt — Suit Fixes + MIPCOM Germany Update

Paste everything below the line into Claude Code:

---

4 changes to the Travel OS app:

## 1. ADD BROWN SUIT TO ITEMS

In `src/data/items.js`, add a Brown Suit entry in TOPHER_CLOTHING right after `t-olive-suit`:

```js
{ id: 't-brown-suit', name: 'Brown Suit (jacket + pants)', isHeavy: true, conditions: ['isBusiness'], qty: 1 },
```

## 2. SUIT SELECTOR — MANUAL CHECKLIST (no auto-selection)

Currently suits are auto-added when `suitDays > 0`. Replace this with a manual suit checklist.

### In `src/data/items.js`:
Remove the auto-conditions from all suit items. Change all 4 suits so they have `conditions: ['isBusiness', 'suitSelected']` instead of `['isBusiness']` or `['isBusiness', 'isWarm']`. This means suits will NOT appear in the packing list unless explicitly selected:
- `t-navy-suit`: conditions: `['isBusiness', 'suitSelected']`
- `t-olive-suit`: conditions: `['isBusiness', 'suitSelected']`
- `t-brown-suit`: conditions: `['isBusiness', 'suitSelected']`
- `t-linen-suit`: conditions: `['isBusiness', 'suitSelected']` (remove `isWarm` requirement — let the user decide)

### In `src/utils/packingEngine.js` — `buildTripConfig`:
Do NOT add `suitSelected: true` globally. We need per-suit flags. Add this logic:

```js
// Per-suit selection flags — set from trip.selectedSuits array
const selectedSuits = new Set(trip.selectedSuits || [])
const suitSelected_navy   = selectedSuits.has('t-navy-suit')
const suitSelected_olive  = selectedSuits.has('t-olive-suit')
const suitSelected_brown  = selectedSuits.has('t-brown-suit')
const suitSelected_linen  = selectedSuits.has('t-linen-suit')
```

Then change the conditions approach: Instead of per-suit flags in config, keep it simple. Add `suitSelected: selectedSuits.size > 0` to the config AND change the items to use individual per-suit condition keys. OR — simpler approach: keep `conditions: ['isBusiness']` on suits, but filter in the packing engine to only include suits whose id is in `trip.selectedSuits`.

**Use this simpler approach:**
- Keep suits with `conditions: ['isBusiness']` in items.js (revert the condition change above)
- In `getPackingListForTraveler` in packingEngine.js, after the `.filter(item => itemIsActive(item, cfg))` line, add a second filter: if the item.id starts with a suit ID (`t-navy-suit`, `t-olive-suit`, `t-brown-suit`, `t-linen-suit`) and `cfg.selectedSuits` is a Set, only include it if `cfg.selectedSuits.has(item.id)`.
- In `buildTripConfig`, add: `selectedSuits: new Set(trip.selectedSuits || [])` to the returned config object.

### In `src/views/NewTrip.jsx`:
Add `selectedSuits: []` to the form initial state.

When `isBusiness` is true AND `form.suitDays > 0`, show a suit checklist BELOW the Suit Days stepper. The checklist shows all 4 suits:
- [ ] Navy Suit
- [ ] Dark Olive Green Suit
- [ ] Brown Suit  
- [ ] Tan Linen Suit

Each is a checkbox. Selecting one adds its ID to `form.selectedSuits`. Show a warning if `selectedSuits.length > suitDays` saying "You've selected more suits than suit days."

Pass `selectedSuits` through to the trip data on submit (include it in `tripData`).

### In `src/store/index.js`:
Make sure `selectedSuits` is saved with the trip (it should flow through addTrip automatically if it's in tripData).

### In `src/views/TripDetail.jsx`:
In the trip editing section, also show the suit checklist when suitDays > 0 on a business trip. Let the user check/uncheck suits. Save changes back to the trip via `updateTrip`.

## 3. SUITS AND FORMAL ITEMS DEFAULT TO PHASE 1 IN MULTI-PHASE TRIPS

In `src/views/TripDetail.jsx`, where phase tags (🟦🟩🟧) are assigned to packing items:

For multi-phase trips where phase 1 is a business trip type, the following item IDs should **default** to 🟦 (Phase 1 only) instead of 🟩 (All phases) when first generated:
- `t-navy-suit`, `t-olive-suit`, `t-brown-suit`, `t-linen-suit`
- `t-black-dress-shoes`, `t-brown-dress-shoes`
- `t-ties`, `t-collar-stays`
- `t-dress-socks`
- `t-black-belt`, `t-brown-belt`
- `t-dress-shirts`
- `t-white-undershirts`

Implement this by checking: if `trip.isMultiPhase` and the first phase has a business trip type, and an item has no existing phase tag saved yet, default these item IDs to phase index 0 (🟦) instead of 'all'.

## 4. DRESS SHIRT DAYS (NO SUIT) INPUT

### In `src/views/NewTrip.jsx`:
Add a new stepper field called **"Dress Shirt Days (no suit)"** immediately after the Suit Days stepper. Only show it when `isBusiness` is true. Label: "Dress Shirt Days (no suit)". Initial value: 0.

Add `dressShirtDays: 0` to form initial state.

Also add a toggle: **"Bring extra dress shirt for Phase 2?"** — only show when `isMultiPhase` is true AND `dressShirtDays + suitDays > 0`. Default: false. Add `extraDressShirtPhase2: false` to form state.

### In `src/utils/packingEngine.js`:
Add to `buildTripConfig`:
```js
const dressShirtDays = trip.dressShirtDays ?? 0
const suitDays = trip.suitDays ?? 0
```

Add new qty resolvers in `resolveQty`:
```js
case 'dressShirts':  return cfg.suitDays + cfg.dressShirtDays + 1  // +1 buffer
case 'tiesTotal':    return cfg.suitDays + cfg.dressShirtDays
```

Add to the returned config object:
```js
dressShirtDays,
hasDressShirtDays: dressShirtDays > 0,
hasFormalDays: suitDays > 0 || dressShirtDays > 0,
```

### In `src/data/items.js`:
Update `t-dress-shirts` qty from `6` (hardcoded) to `'dressShirts'` and change its conditions from `['suitEvent5Day']` to `['hasFormalDays']`.

Update `t-ties` qty from `'3-4'` to `'tiesTotal'` and change its conditions from `['isMIPCOM']` to `['hasFormalDays']`.

Update `t-white-undershirts` qty from `'suitDaysPlusOne'` to `'suitDaysPlusOne'` (keep) but change conditions from `['isBusiness']` to `['hasFormalDays']`.

### In `src/views/TripDetail.jsx`:
In the trip editing panel, also show the "Dress Shirt Days" stepper and the "Extra dress shirt for Phase 2?" toggle when relevant.

Pass `dressShirtDays` and `extraDressShirtPhase2` through to trip data on submit.

---

After all changes, run `npm run build` to confirm clean build, then `vercel --prod` to deploy.
