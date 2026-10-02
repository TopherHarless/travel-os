import { useState } from 'react'
import { TRIP_TYPES } from '../data/tripTypes.js'
import ConditionSelect from './ConditionSelect.jsx'

const VALID_CONDITIONS = new Set(['always', ...TRIP_TYPES.map(t => t.id)])

function normalizeConditions(conds) {
  if (!conds?.length) return ['always']
  const filtered = conds.filter(c => VALID_CONDITIONS.has(c))
  return filtered.length ? filtered : ['always']
}

const CAT_OPTIONS = [
  { val: 'clothing',   label: 'Clothing' },
  { val: 'toiletries', label: 'Toiletries' },
  { val: 'technology', label: 'Technology' },
  { val: 'medical',    label: 'Medical / Supplements' },
  { val: 'comfort',    label: 'Travel Comfort' },
  { val: 'documents',  label: 'Documents' },
  { val: 'misc',       label: 'Misc' },
  { val: 'gear',       label: 'Gear & Equipment' },
  { val: 'hydration',  label: 'Hydration' },
  { val: 'power',      label: 'Power' },
]

const WEATHER_TRIGGER_OPTIONS = [
  { val: 'rain', label: 'Rain / Wet weather' },
  { val: 'cold', label: 'Cold weather' },
  { val: 'mild', label: 'Mild / Cool weather' },
  { val: 'hot',  label: 'Hot / Warm weather' },
]

// item: object|null (null = adding new)
// defaultCategory: category pre-selected when adding
// onClose, onSave(category, itemData), onDelete (optional, edit mode only)
export default function InventoryItemDrawer({ item, defaultCategory = 'clothing', onClose, onSave, onDelete }) {
  const isEditing = !!item
  const [form, setForm] = useState(() => item ? {
    name:           item.name,
    category:       item.category || defaultCategory,
    conditions:     normalizeConditions(item.conditions),
    qty:            item.qty ?? 1,
    note:           item.note || '',
    isHeavy:        item.isHeavy || false,
    optional:       item.optional || false,
    weatherTrigger: item.weatherTrigger || null,
  } : {
    name: '', category: defaultCategory, conditions: ['always'],
    qty: 1, note: '', isHeavy: false, optional: false, weatherTrigger: null,
  })

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function handleSave() {
    if (!form.name.trim()) return
    onSave(form.category, {
      name:           form.name.trim(),
      conditions:     form.conditions.length ? form.conditions : ['always'],
      qty:            isNaN(Number(form.qty)) ? String(form.qty) : Number(form.qty),
      note:           form.note.trim() || undefined,
      isHeavy:        form.isHeavy,
      optional:       form.optional,
      weatherTrigger: form.weatherTrigger || undefined,
    })
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white rounded-t-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: '88vh' }}
      >
        {/* Handle + header */}
        <div className="flex-none px-4 pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">
              {isEditing ? `Edit — ${item.name}` : 'Add to Inventory'}
            </p>
            <button onClick={onClose} className="text-gray-400 text-lg leading-none p-1">✕</button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-4 pt-1 pb-6 space-y-4">

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Item Name *</label>
            <input
              autoFocus
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              placeholder="e.g. Resistance Bands"
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Category</label>
              <select value={form.category} onChange={e => setField('category', e.target.value)} className="input">
                {CAT_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Quantity</label>
              <input
                value={form.qty}
                onChange={e => setField('qty', e.target.value)}
                placeholder="1"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Show on trips</label>
            <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] px-3 py-2">
              <ConditionSelect value={form.conditions} onChange={v => setField('conditions', v)} />
            </div>
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

          {/* Weather trigger */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Weather trigger</label>
            <div className="flex items-center gap-3 mb-2">
              <div
                onClick={() => setField('weatherTrigger', form.weatherTrigger ? null : 'rain')}
                className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${form.weatherTrigger ? 'bg-[#3B82F6]' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.weatherTrigger ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-gray-600">
                {form.weatherTrigger ? 'Flagged 🌤 when weather matches' : 'No trigger'}
              </span>
            </div>
            {form.weatherTrigger && (
              <select
                value={form.weatherTrigger}
                onChange={e => setField('weatherTrigger', e.target.value)}
                className="input"
              >
                {WEATHER_TRIGGER_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
              </select>
            )}
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setField('isHeavy', !form.isHeavy)}
                className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${form.isHeavy ? 'bg-red-400' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isHeavy ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-gray-700">Heavy ⚠️</span>
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
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="w-full bg-[#1B4332] text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-40 mt-2"
          >
            {isEditing ? 'Save Changes' : 'Add to Inventory'}
          </button>

          {isEditing && onDelete && (
            <button
              onClick={onDelete}
              className="w-full bg-gray-50 text-red-500 text-sm font-medium py-2.5 rounded-xl border border-red-100"
            >
              Delete from Inventory
            </button>
          )}
        </div>
      </div>
    </>
  )
}
