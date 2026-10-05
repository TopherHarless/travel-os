import { useState, useMemo, useRef, useEffect } from 'react'
import { ALL_ITEMS } from '../data/items.js'
import ConditionSelect from './ConditionSelect.jsx'

const CAT_OPTIONS = [
  { val: 'clothing',   label: 'Clothing' },
  { val: 'toiletries', label: 'Toiletries' },
  { val: 'technology', label: 'Technology' },
  { val: 'medical',    label: 'Medical / Supplements' },
  { val: 'comfort',    label: 'Travel Comfort' },
  { val: 'documents',  label: 'Documents' },
  { val: 'misc',       label: 'Misc' },
  { val: 'gear',       label: 'Gear & Equipment' },
]

const CAT_LABELS = Object.fromEntries(CAT_OPTIONS.map(c => [c.val, c.label]))

const TRAVELER_LABELS = { topher: 'Topher', lanita: 'La Nita', crosby: 'Crosby', penn: 'Penn', shared: 'Shared' }

// Build a flat search index of all items for a traveler
function buildIndex(travelerId, userInventory, itemOverrides = {}) {
  const items = []
  const travelerItems = ALL_ITEMS[travelerId] || {}
  for (const [cat, list] of Object.entries(travelerItems)) {
    for (const item of list) {
      const overridden = itemOverrides[item.id] ? { ...item, ...itemOverrides[item.id] } : item
      items.push({ ...overridden, category: cat, source: 'static' })
    }
  }
  const userItems = userInventory?.[travelerId] || {}
  for (const [cat, list] of Object.entries(userItems)) {
    for (const item of list) {
      items.push({ ...item, category: cat, source: 'user' })
    }
  }
  return items
}

const BLANK_FORM = {
  name: '', category: 'clothing', isHeavy: false, optional: false,
  qty: 1, note: '', conditions: ['always'],
}

export default function AddItemDrawer({
  travelerId, trip, userInventory, itemOverrides = {},
  onClose, onAddToTrip, onSaveToInventory,
}) {
  const [tab, setTab] = useState('search')
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(BLANK_FORM)
  const [confirmSave, setConfirmSave] = useState(false) // show save-to-inventory prompt
  const [pendingItem, setPendingItem] = useState(null)
  const searchRef = useRef(null)

  useEffect(() => { searchRef.current?.focus() }, [])

  const searchIndex = useMemo(
    () => buildIndex(travelerId, userInventory, itemOverrides),
    [travelerId, userInventory, itemOverrides]
  )

  // IDs currently visible in the trip list (custom-added items for this traveler)
  const activeIds = useMemo(() => {
    const ids = new Set()
    const tripItems = trip.customItems?.[travelerId] || {}
    for (const list of Object.values(tripItems)) list.forEach(i => ids.add(i.id))
    return ids
  }, [trip, travelerId])

  const removedIds = useMemo(() => new Set(trip.removedItemIds || []), [trip])

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return searchIndex.filter(item => item.name.toLowerCase().includes(q)).slice(0, 20)
  }, [searchIndex, query])

  function handleAddExisting(item) {
    if (removedIds.has(item.id)) {
      // Restore a previously removed item
      onAddToTrip(travelerId, item.category, { ...item, _restore: true })
    } else {
      onAddToTrip(travelerId, item.category, item)
    }
    onClose()
  }

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function handleCreateSubmit() {
    if (!form.name.trim()) return
    const item = {
      name:      form.name.trim(),
      isHeavy:   form.isHeavy,
      optional:  form.optional,
      qty:       isNaN(Number(form.qty)) ? String(form.qty) : Number(form.qty),
      note:      form.note.trim() || undefined,
      conditions: form.conditions.length ? form.conditions : ['always'],
    }
    setPendingItem(item)
    setConfirmSave(true)
  }

  function handleConfirmSave(saveToInventory) {
    if (!pendingItem) return
    if (saveToInventory) {
      // Save to inventory — this will auto-appear in future trips based on conditions.
      // Also add to THIS trip immediately so it shows up now.
      onSaveToInventory(travelerId, form.category, pendingItem)
      onAddToTrip(travelerId, form.category, { ...pendingItem, conditions: ['always'] })
    } else {
      onAddToTrip(travelerId, form.category, { ...pendingItem, conditions: ['always'] })
    }
    onClose()
  }

  const travelerLabel = TRAVELER_LABELS[travelerId] || travelerId

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white rounded-t-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}>

        {/* Handle + header */}
        <div className="flex-none px-4 pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">
              Add Item — {travelerLabel}
            </p>
            <button onClick={onClose} className="text-gray-400 text-lg leading-none p-1">✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-none flex border-b border-[#E5E7EB] mx-4">
          {['search', 'create'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setConfirmSave(false) }}
              className={`flex-1 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-[#1B4332] text-[#1B4332]' : 'border-transparent text-[#6B7280]'
              }`}
            >
              {t === 'search' ? 'Search Items' : 'Create New'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── SEARCH TAB ── */}
          {tab === 'search' && (
            <div className="px-4 pt-3 pb-4">
              <input
                ref={searchRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search items…"
                className="input mb-3"
              />

              {query.trim() === '' && (
                <p className="text-xs text-gray-400 text-center py-6">
                  Type to search {searchIndex.length} items in master inventory
                </p>
              )}

              {query.trim() !== '' && results.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 mb-3">No items found for "{query}"</p>
                  <button
                    onClick={() => { setTab('create'); setField('name', query.trim()) }}
                    className="text-sm text-[#1B4332] font-medium"
                  >
                    → Create "{query.trim()}"
                  </button>
                </div>
              )}

              {results.map(item => {
                const alreadyInList = activeIds.has(item.id)
                const wasRemoved = removedIds.has(item.id)
                return (
                  <div key={`${item.id}-${item.source}`} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">
                        {item.name}
                        {item.isHeavy && <span className="ml-1 text-xs text-red-500">⚠️</span>}
                        {item.source === 'user' && <span className="ml-1 text-xs text-[#95C4A1]">★</span>}
                      </p>
                      <p className="text-xs text-gray-400">
                        {CAT_LABELS[item.category] || item.category}
                        {' · '}
                        {item.conditions?.join(', ')}
                      </p>
                    </div>
                    {alreadyInList ? (
                      <span className="text-xs text-green-600 font-medium flex-none">In list</span>
                    ) : wasRemoved ? (
                      <button
                        onClick={() => handleAddExisting(item)}
                        className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-1 rounded-lg flex-none"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddExisting(item)}
                        className="text-xs bg-[#f0f7f3] text-[#1B4332] font-medium px-2 py-1 rounded-lg flex-none"
                      >
                        Add
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── CREATE TAB ── */}
          {tab === 'create' && !confirmSave && (
            <div className="px-4 pt-3 pb-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Item Name *</label>
                <input
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  placeholder="e.g. Resistance Bands"
                  className="input"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Category</label>
                <select value={form.category} onChange={e => setField('category', e.target.value)} className="input">
                  {CAT_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Show on trips</label>
                <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] px-3 py-2">
                  <ConditionSelect value={form.conditions} onChange={v => setField('conditions', v)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Quantity</label>
                  <input
                    value={form.qty}
                    onChange={e => setField('qty', e.target.value)}
                    placeholder="1"
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Note (optional)</label>
                  <input
                    value={form.note}
                    onChange={e => setField('note', e.target.value)}
                    placeholder="optional note"
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setField('isHeavy', !form.isHeavy)}
                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${form.isHeavy ? 'bg-red-400' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isHeavy ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-xs text-gray-700">Heavy item ⚠️</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setField('optional', !form.optional)}
                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${form.optional ? 'bg-[#1B4332]' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.optional ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-xs text-gray-700">Optional</span>
                </label>
              </div>

              <button
                onClick={handleCreateSubmit}
                disabled={!form.name.trim()}
                className="w-full bg-[#1B4332] text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── SAVE CONFIRMATION ── */}
          {tab === 'create' && confirmSave && pendingItem && (
            <div className="px-4 pt-6 pb-4 text-center space-y-4">
              <p className="text-base font-semibold text-gray-800">"{pendingItem.name}"</p>
              <p className="text-sm text-gray-500">Save to master inventory so it appears on future trips too?</p>
              <div className="space-y-2">
                <button
                  onClick={() => handleConfirmSave(true)}
                  className="w-full bg-[#1B4332] text-white text-sm font-semibold py-3 rounded-xl"
                >
                  Yes — Save to Master Inventory
                </button>
                <button
                  onClick={() => handleConfirmSave(false)}
                  className="w-full bg-gray-100 text-gray-700 text-sm font-medium py-3 rounded-xl"
                >
                  This trip only
                </button>
                <button
                  onClick={() => { setConfirmSave(false); setPendingItem(null) }}
                  className="w-full text-sm text-gray-400 py-2"
                >
                  ← Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
