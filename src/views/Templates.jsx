import { useState, useMemo } from 'react'
import { TRIP_TYPES, getEffectiveTripTypes } from '../data/tripTypes.js'
import { ALL_ITEMS } from '../data/items.js'
import { getPackingListForTraveler } from '../utils/packingEngine.js'
import Header from '../components/Header.jsx'
import ConditionSelect from '../components/ConditionSelect.jsx'

const CAT_LABELS = {
  clothing: 'Clothing', toiletries: 'Toiletries', medical: 'Medical & Supplements',
  hydration: 'Hydration', yogurt: 'Yogurt / Food', technology: 'Technology', power: 'Power',
  comfort: 'Travel Comfort', documents: 'Documents', misc: 'Misc',
  infant: 'Infant Items', toddler: 'Toddler Items', child: 'Child Items',
  gear: 'Gear & Equipment', essentials: 'Shared Essentials',
}

const TRAVELER_LABELS = { topher: 'Topher', lanita: 'La Nita', crosby: 'Crosby', penn: 'Penn', shared: 'Shared' }
const TRAVELER_ORDER = ['topher', 'lanita', 'crosby', 'penn']

const WEATHER_TRIGGER_OPTIONS = [
  { val: 'rain', label: 'Rain / Wet weather' },
  { val: 'cold', label: 'Cold weather' },
  { val: 'mild', label: 'Mild / Cool' },
  { val: 'hot',  label: 'Hot / Warm weather' },
]

const BLANK_ITEM_FORM = { name: '', category: 'clothing', qty: 1, note: '', isHeavy: false, optional: false, conditions: ['always'], weatherTrigger: null }

const BLANK_CREATE_FORM = {
  label: '', icon: '', description: '',
  transport: 'flying',
  defaultTravelers: ['topher'],
  isInternational: false,
}

const BUILTIN_IDS = new Set(TRIP_TYPES.map(t => t.id))

function buildTemplateConfig(typeData) {
  const base = typeData?.config ?? {}
  return {
    ...base,
    isMIPCOM: false,
    suitEvent5Day: true,
    days: 7,
    suitDays: 5,
    travelDays: 2,
    isFlying: base.isFlying ?? false,
    washingMachine: false,
    isOutdoor: base.isBeach || false,
    isOutdoorWater: base.isBeach || false,
    isBeachOrDriving: base.isBeach || base.isDriving || false,
    weatherDependent: false,
    pennAgeMonths: 18,
    pennAge: 1.5,
    pennInfant: true,
    pennToddler: false,
    pennChild: false,
    pennInfantToddler: true,
  }
}

function buildSearchIndex(travelerId, userInventory) {
  const items = []
  for (const [cat, list] of Object.entries(ALL_ITEMS[travelerId] || {})) {
    for (const item of list) items.push({ ...item, category: cat, source: 'static' })
  }
  for (const [cat, list] of Object.entries(userInventory?.[travelerId] || {})) {
    for (const item of list) items.push({ ...item, category: cat, source: 'user' })
  }
  return items
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteConfirmModal({ target, onConfirm, onCancel }) {
  const isBuiltin = BUILTIN_IDS.has(target.id) && !target.isCustom
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        {isBuiltin ? (
          <>
            <h3 className="text-[17px] font-bold text-[#2D2D2D] mb-2">Delete built-in template?</h3>
            <p className="text-[15px] text-[#6B7280] mb-5">
              <strong className="text-[#2D2D2D]">{target.icon} {target.label}</strong> is a built-in template.
              Deleting it will remove it from your trip type options. Trips already created from this template will not be affected.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-[17px] font-bold text-[#2D2D2D] mb-2">Delete {target.icon} {target.label}?</h3>
            <p className="text-[15px] text-[#6B7280] mb-5">
              This cannot be undone. Trips already created from this template will not be affected. Items in your master inventory are kept.
            </p>
          </>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-[15px] font-semibold text-[#6B7280]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-[#EF4444] text-white text-[15px] font-bold"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Create Template Form ─────────────────────────────────────────────────────

function CreateTemplateForm({ onSave, onCancel }) {
  const [form, setForm] = useState(BLANK_CREATE_FORM)

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function toggleTraveler(id) {
    setField('defaultTravelers',
      form.defaultTravelers.includes(id)
        ? form.defaultTravelers.filter(t => t !== id)
        : [...form.defaultTravelers, id]
    )
  }

  function handleSave() {
    if (!form.label.trim()) return
    onSave({
      label:            form.label.trim(),
      icon:             form.icon.trim() || '📋',
      description:      form.description.trim(),
      defaultTravelers: form.defaultTravelers.length ? form.defaultTravelers : ['topher'],
      config: {
        isFlying:       form.transport === 'flying' || form.transport === 'either',
        isDriving:      form.transport === 'driving' || form.transport === 'either',
        isInternational: form.isInternational,
        isBusiness: false,
        isBeach: false,
        isCold: false,
        isWarm: false,
        isMIPCOM: false,
      },
    })
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 mb-4 space-y-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-bold text-[#2D2D2D]">New Template</p>
        <button onClick={onCancel} className="text-[#9CA3AF] text-lg w-7 h-7 flex items-center justify-center hover:text-[#6B7280]">✕</button>
      </div>

      <div className="grid grid-cols-[1fr_80px] gap-3">
        <div>
          <label className="text-[13px] font-semibold text-[#6B7280] mb-1 block uppercase tracking-[0.04em]">Template Name *</label>
          <input
            autoFocus
            value={form.label}
            onChange={e => setField('label', e.target.value)}
            placeholder="e.g. Vegas Weekend"
            className="input"
          />
        </div>
        <div>
          <label className="text-[13px] font-semibold text-[#6B7280] mb-1 block uppercase tracking-[0.04em]">Icon</label>
          <input
            value={form.icon}
            onChange={e => {
              const chars = [...e.target.value]
              setField('icon', chars.slice(-1).join(''))
            }}
            placeholder="🗺️"
            className="input text-center text-xl"
          />
        </div>
      </div>

      <div>
        <label className="text-[13px] font-semibold text-[#6B7280] mb-1 block uppercase tracking-[0.04em]">Description (optional)</label>
        <input
          value={form.description}
          onChange={e => setField('description', e.target.value)}
          placeholder="e.g. Weekend getaway, driving only"
          className="input"
        />
      </div>

      <div>
        <label className="text-[13px] font-semibold text-[#6B7280] mb-2 block uppercase tracking-[0.04em]">Transport Type</label>
        <div className="flex gap-2">
          {[
            { val: 'flying',  label: '✈️ Flying' },
            { val: 'driving', label: '🚗 Driving' },
            { val: 'either',  label: '🗺️ Either' },
          ].map(opt => (
            <button
              key={opt.val}
              type="button"
              onClick={() => setField('transport', opt.val)}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border transition-colors ${
                form.transport === opt.val
                  ? 'bg-[#1B4332] text-white border-[#1B4332]'
                  : 'bg-white text-[#6B7280] border-[#E5E7EB]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[13px] font-semibold text-[#6B7280] mb-2 block uppercase tracking-[0.04em]">Default Travelers</label>
        <div className="grid grid-cols-2 gap-2">
          {TRAVELER_ORDER.map(id => (
            <label
              key={id}
              onClick={() => toggleTraveler(id)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${form.defaultTravelers.includes(id) ? 'border-[#1B4332] bg-[#f0f7f3]' : 'border-[#E5E7EB] bg-white'}`}
            >
              <span className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-none ${form.defaultTravelers.includes(id) ? 'bg-[#1B4332] border-[#1B4332]' : 'border-[#D1D5DB]'}`}>
                {form.defaultTravelers.includes(id) && <span className="text-white font-bold" style={{ fontSize: '9px' }}>✓</span>}
              </span>
              <span className="text-[15px] font-medium text-[#2D2D2D]">{TRAVELER_LABELS[id]}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => setField('isInternational', !form.isInternational)}
          className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${form.isInternational ? 'bg-[#1B4332]' : 'bg-[#D1D5DB]'}`}
        >
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isInternational ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
        <span className="text-[15px] text-[#2D2D2D]">International trip (passport, adapters, etc.)</span>
      </label>

      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-[15px] font-semibold text-[#6B7280]">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!form.label.trim() || form.defaultTravelers.length === 0}
          className="flex-1 py-3 rounded-xl bg-[#1B4332] text-white text-[15px] font-bold disabled:opacity-40"
        >
          Create Template →
        </button>
      </div>
    </div>
  )
}

// ─── Main Templates View ──────────────────────────────────────────────────────

export default function TemplatesView({
  state,
  addUserItem,
  addTemplateItem, removeTemplateItem, restoreTemplateItem, deleteTemplateItem, updateTemplateItem,
  addCustomTripType, deleteCustomTripType, softDeleteBuiltinTripType,
}) {
  const [selectedTypeId, setSelectedTypeId] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const effectiveTripTypes = getEffectiveTripTypes(state.customTripTypes, state.deletedTripTypeIds)
  const selectedTypeData = selectedTypeId ? effectiveTripTypes.find(t => t.id === selectedTypeId) : null

  function handleCreateSave(typeData) {
    const id = addCustomTripType(typeData)
    setShowCreateForm(false)
    setSelectedTypeId(id)
  }

  function handleDeleteRequest(tripType) {
    setDeleteConfirm({ id: tripType.id, label: tripType.label, icon: tripType.icon || '', isCustom: !!tripType.isCustom })
  }

  function handleDeleteConfirmed() {
    if (!deleteConfirm) return
    if (deleteConfirm.isCustom) {
      deleteCustomTripType(deleteConfirm.id)
    } else {
      softDeleteBuiltinTripType(deleteConfirm.id)
    }
    if (selectedTypeId === deleteConfirm.id) setSelectedTypeId(null)
    setDeleteConfirm(null)
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 lg:pb-8">
      {selectedTypeData ? (
        <TemplateEditor
          typeData={selectedTypeData}
          onBack={() => setSelectedTypeId(null)}
          onDeleteRequest={() => handleDeleteRequest(selectedTypeData)}
          state={state}
          addUserItem={addUserItem}
          addTemplateItem={addTemplateItem}
          removeTemplateItem={removeTemplateItem}
          restoreTemplateItem={restoreTemplateItem}
          deleteTemplateItem={deleteTemplateItem}
          updateTemplateItem={updateTemplateItem}
        />
      ) : (
        <>
          <Header
            title="Templates"
            action={
              <button
                onClick={() => setShowCreateForm(true)}
                className="text-[13px] font-semibold text-white bg-[#1B4332] px-3.5 py-1.5 rounded-lg flex items-center gap-1"
              >
                <span className="text-base leading-none">+</span> New Template
              </button>
            }
          />
          <div className="px-4 lg:px-8 pt-5 max-w-[1100px] mx-auto w-full">
            {showCreateForm && (
              <CreateTemplateForm
                onSave={handleCreateSave}
                onCancel={() => setShowCreateForm(false)}
              />
            )}

            {!showCreateForm && (
              <p className="text-[13px] text-[#6B7280] mb-4">
                Customize what appears on each trip type. Changes apply to all future trips of that type.
              </p>
            )}

            <div className="space-y-2">
              {effectiveTripTypes.map(type => {
                const tmpl = state.templateOverrides?.[type.id] || {}
                const removalsCount  = (tmpl.removals  || []).length
                const additionsCount = (tmpl.additions || []).length
                return (
                  <div key={type.id} className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTypeId(type.id)}
                      className="flex-1 flex items-center gap-3 p-4 bg-white rounded-xl border border-[#E5E7EB] text-left active:bg-[#F8F6F1] transition-colors"
                      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                    >
                      <span className="text-2xl leading-none flex-none">{type.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-[#2D2D2D]">
                          {type.label}
                          {type.isCustom && <span className="ml-1.5 text-[11px] font-normal text-[#95C4A1]">custom</span>}
                        </p>
                        <div className="flex gap-2 mt-0.5">
                          {removalsCount > 0 && <span className="text-[13px] text-[#EF4444]">{removalsCount} removed</span>}
                          {additionsCount > 0 && <span className="text-[13px] text-[#1B4332]">+{additionsCount} added</span>}
                          {removalsCount === 0 && additionsCount === 0 && (
                            <span className="text-[13px] text-[#9CA3AF]">
                              {type.description && type.description !== '— stub —' ? type.description : 'Default template'}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[#D1D5DB] text-lg leading-none flex-none">›</span>
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(type)}
                      className="flex-none p-2.5 text-[#D1D5DB] hover:text-[#EF4444] transition-colors rounded-lg hover:bg-[#FEF2F2]"
                      title="Delete template"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 4h12M5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4M6 7v5M10 7v5M3 4l1 9.5a.5.5 0 00.5.5h7a.5.5 0 00.5-.5L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>

            {effectiveTripTypes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[15px] text-[#9CA3AF]">No templates yet.</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-3 text-[15px] text-[#1B4332] font-semibold"
                >
                  + Create your first template
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          target={deleteConfirm}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}

// ─── Template Editor ──────────────────────────────────────────────────────────

function TemplateEditor({
  typeData, onBack, onDeleteRequest,
  state, addUserItem, addTemplateItem, removeTemplateItem,
  restoreTemplateItem, deleteTemplateItem, updateTemplateItem,
}) {
  const travelers = typeData.defaultTravelers || ['topher']
  const [activeTraveler, setActiveTraveler] = useState(travelers[0] || 'topher')
  const [panel, setPanel] = useState(null)
  const [query, setQuery] = useState('')
  const [createForm, setCreateForm] = useState(BLANK_ITEM_FORM)
  const [editingAddition, setEditingAddition] = useState(null)
  const [showRemovedSection, setShowRemovedSection] = useState(false)

  const cfg = useMemo(() => buildTemplateConfig(typeData), [typeData])
  const tmpl = state.templateOverrides?.[typeData.id] || {}
  const removals  = useMemo(() => new Set(tmpl.removals  || []), [tmpl.removals])
  const additions = tmpl.additions || []

  const userItems   = state.userInventory?.[activeTraveler] || {}
  const baseItems   = useMemo(
    () => getPackingListForTraveler(activeTraveler, cfg, userItems),
    [activeTraveler, cfg, userItems]
  )

  const searchIndex = useMemo(
    () => buildSearchIndex(activeTraveler, state.userInventory),
    [activeTraveler, state.userInventory]
  )

  const travelerAdditionIds = useMemo(
    () => new Set(additions.filter(a => a.traveler === activeTraveler).map(a => a.id)),
    [additions, activeTraveler]
  )
  const baseItemIds = useMemo(() => new Set(Object.values(baseItems).flat().map(i => i.id)), [baseItems])

  const searchResults = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return searchIndex.filter(i => i.name.toLowerCase().includes(q)).slice(0, 20)
  }, [searchIndex, query])

  const activeItemsByCat = {}
  const removedItemsByCat = {}
  for (const [cat, items] of Object.entries(baseItems)) {
    for (const item of items) {
      if (removals.has(item.id)) {
        if (!removedItemsByCat[cat]) removedItemsByCat[cat] = []
        removedItemsByCat[cat].push(item)
      } else {
        if (!activeItemsByCat[cat]) activeItemsByCat[cat] = []
        activeItemsByCat[cat].push(item)
      }
    }
  }
  for (const item of additions.filter(a => a.traveler === activeTraveler)) {
    const cat = item.category || 'misc'
    if (!activeItemsByCat[cat]) activeItemsByCat[cat] = []
    activeItemsByCat[cat].push({ ...item, isTemplateAddition: true })
  }

  const removedCount = Object.values(removedItemsByCat).flat().length

  function handleAddFromSearch(item) {
    if (travelerAdditionIds.has(item.id) || (baseItemIds.has(item.id) && !removals.has(item.id))) return
    if (removals.has(item.id)) {
      restoreTemplateItem(typeData.id, item.id)
    } else {
      addTemplateItem(typeData.id, { ...item, traveler: activeTraveler })
    }
    closePanel()
  }

  function handleCreateSubmit() {
    if (!createForm.name.trim()) return
    const itemData = {
      name: createForm.name.trim(),
      isHeavy: createForm.isHeavy,
      optional: createForm.optional,
      qty: isNaN(Number(createForm.qty)) ? String(createForm.qty) : Number(createForm.qty),
      note: createForm.note.trim() || undefined,
      conditions: createForm.conditions.length ? createForm.conditions : ['always'],
      weatherTrigger: createForm.weatherTrigger || undefined,
    }
    const id = addUserItem(activeTraveler, createForm.category, itemData)
    addTemplateItem(typeData.id, { ...itemData, id, category: createForm.category, traveler: activeTraveler })
    closePanel()
  }

  function closePanel() {
    setPanel(null)
    setQuery('')
    setCreateForm(BLANK_ITEM_FORM)
  }

  function openPanel(mode, category) {
    setPanel({ mode, category })
    setCreateForm({ ...BLANK_ITEM_FORM, category })
    setQuery('')
    setEditingAddition(null)
  }

  function startEditAddition(item) {
    setEditingAddition({
      itemId: item.id,
      form: {
        qty:            item.qty ?? 1,
        note:           item.note || '',
        isHeavy:        item.isHeavy || false,
        weatherTrigger: item.weatherTrigger || null,
      },
    })
    closePanel()
  }

  function saveEditAddition() {
    if (!editingAddition) return
    const { qty, note, isHeavy, weatherTrigger } = editingAddition.form
    updateTemplateItem(typeData.id, editingAddition.itemId, {
      qty: isNaN(Number(qty)) ? String(qty) : Number(qty),
      note: note.trim() || undefined,
      isHeavy,
      weatherTrigger: weatherTrigger || undefined,
    })
    setEditingAddition(null)
  }

  function setCreateField(k, v) { setCreateForm(f => ({ ...f, [k]: v })) }
  function setEditField(k, v)   { setEditingAddition(e => ({ ...e, form: { ...e.form, [k]: v } })) }

  return (
    <div className="flex flex-col min-h-screen pb-20 lg:pb-8">
      <Header
        title={`${typeData.icon || ''} ${typeData.label}`}
        onBack={onBack}
        action={
          <button
            onClick={onDeleteRequest}
            className="text-[13px] font-semibold text-[#EF4444] px-3 py-1.5 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2]"
          >
            Delete
          </button>
        }
      />

      {travelers.length > 1 && (
        <div className="flex gap-2 px-4 lg:px-8 py-2.5 overflow-x-auto border-b border-[#E5E7EB] bg-white">
          {travelers.map(tid => (
            <button
              key={tid}
              onClick={() => { setActiveTraveler(tid); closePanel(); setEditingAddition(null) }}
              className={`flex-none px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                activeTraveler === tid ? 'bg-[#1B4332] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'
              }`}
            >
              {TRAVELER_LABELS[tid] || tid}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 px-4 lg:px-8 pt-5 pb-4 space-y-4 max-w-[1100px] mx-auto w-full">
        {Object.keys(activeItemsByCat).length === 0 && removedCount === 0 && (
          <p className="text-[15px] text-[#9CA3AF] text-center py-4">
            {typeData.isCustom
              ? 'No items yet — use the buttons below to build this template.'
              : 'No items for this traveler in this template.'}
          </p>
        )}

        {Object.entries(activeItemsByCat).map(([cat, items]) => (
          <div key={cat}>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-2 pb-1.5 border-b border-[#E5E7EB]">
              {CAT_LABELS[cat] || cat}
            </h3>
            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {items.map((item, i) => (
                <div key={item.id}>
                  <TemplateItemRow
                    item={item}
                    isLast={i === items.length - 1 && editingAddition?.itemId !== item.id}
                    onRemove={item.isTemplateAddition ? null : () => removeTemplateItem(typeData.id, item.id)}
                    onDelete={item.isTemplateAddition ? () => deleteTemplateItem(typeData.id, item.id) : null}
                    onEdit={item.isTemplateAddition ? () => startEditAddition(item) : null}
                    isEditing={editingAddition?.itemId === item.id}
                  />
                  {editingAddition?.itemId === item.id && (
                    <div className="bg-[#f0f7f3] border-t border-[#dcefdf] px-4 py-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[13px] font-semibold text-[#6B7280] mb-1 block uppercase tracking-[0.04em]">Quantity</label>
                          <input value={editingAddition.form.qty} onChange={e => setEditField('qty', e.target.value)} className="input" placeholder="1" />
                        </div>
                        <div>
                          <label className="text-[13px] font-semibold text-[#6B7280] mb-1 block uppercase tracking-[0.04em]">Note</label>
                          <input value={editingAddition.form.note} onChange={e => setEditField('note', e.target.value)} className="input" placeholder="optional note" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[13px] font-semibold text-[#6B7280] mb-2 block uppercase tracking-[0.04em]">Weather trigger</label>
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            onClick={() => setEditField('weatherTrigger', editingAddition.form.weatherTrigger ? null : 'rain')}
                            className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${editingAddition.form.weatherTrigger ? 'bg-[#3B82F6]' : 'bg-[#D1D5DB]'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editingAddition.form.weatherTrigger ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </div>
                          <span className="text-[13px] text-[#6B7280]">
                            {editingAddition.form.weatherTrigger ? '🌤 Flagged when weather matches' : 'No trigger'}
                          </span>
                        </div>
                        {editingAddition.form.weatherTrigger && (
                          <select value={editingAddition.form.weatherTrigger} onChange={e => setEditField('weatherTrigger', e.target.value)} className="input">
                            {WEATHER_TRIGGER_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                          </select>
                        )}
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div
                          onClick={() => setEditField('isHeavy', !editingAddition.form.isHeavy)}
                          className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${editingAddition.form.isHeavy ? 'bg-[#EF4444]' : 'bg-[#D1D5DB]'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editingAddition.form.isHeavy ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                        <span className="text-[13px] text-[#2D2D2D]">Heavy ⚠️</span>
                      </label>
                      <div className="flex gap-2">
                        <button onClick={saveEditAddition} className="flex-1 bg-[#1B4332] text-white text-xs font-bold py-2 rounded-lg">Save</button>
                        <button onClick={() => setEditingAddition(null)} className="flex-1 bg-[#F3F4F6] text-[#6B7280] text-xs font-medium py-2 rounded-lg">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {panel?.category !== cat && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => openPanel('search', cat)}
                  className="flex-1 py-2.5 rounded-xl border border-dashed border-[#95C4A1] text-[13px] text-[#1B4332] font-medium flex items-center justify-center gap-1 bg-white"
                >
                  <span className="text-sm leading-none">+</span> Add Item
                </button>
                <button
                  onClick={() => openPanel('create', cat)}
                  className="flex-1 py-2.5 rounded-xl border border-dashed border-[#95C4A1] text-[13px] text-[#1B4332] font-medium flex items-center justify-center gap-1 bg-white"
                >
                  <span className="text-sm leading-none">+</span> Add New
                </button>
              </div>
            )}

            {panel?.category === cat && (
              <AddPanel
                panel={panel}
                query={query}
                setQuery={setQuery}
                searchResults={searchResults}
                baseItemIds={baseItemIds}
                removals={removals}
                travelerAdditionIds={travelerAdditionIds}
                createForm={createForm}
                setCreateField={setCreateField}
                onAddFromSearch={handleAddFromSearch}
                onCreateSubmit={handleCreateSubmit}
                onClose={closePanel}
                catLabels={CAT_LABELS}
              />
            )}
          </div>
        ))}

        {Object.keys(activeItemsByCat).length === 0 && !panel && (
          <div className="flex gap-2">
            <button onClick={() => openPanel('search', 'misc')} className="flex-1 py-3 rounded-xl border border-dashed border-[#95C4A1] text-[15px] text-[#1B4332] font-medium flex items-center justify-center gap-1.5 bg-white">
              <span className="text-base leading-none">+</span> Add Item
            </button>
            <button onClick={() => openPanel('create', 'misc')} className="flex-1 py-3 rounded-xl border border-dashed border-[#95C4A1] text-[15px] text-[#1B4332] font-medium flex items-center justify-center gap-1.5 bg-white">
              <span className="text-base leading-none">+</span> Add New Item
            </button>
          </div>
        )}

        {panel && !panel.category && (
          <AddPanel
            panel={panel}
            query={query}
            setQuery={setQuery}
            searchResults={searchResults}
            baseItemIds={baseItemIds}
            removals={removals}
            travelerAdditionIds={travelerAdditionIds}
            createForm={createForm}
            setCreateField={setCreateField}
            onAddFromSearch={handleAddFromSearch}
            onCreateSubmit={handleCreateSubmit}
            onClose={closePanel}
            catLabels={CAT_LABELS}
          />
        )}

        {removedCount > 0 && (
          <div>
            <button
              onClick={() => setShowRemovedSection(s => !s)}
              className="w-full flex items-center justify-between text-[13px] font-semibold uppercase tracking-[0.08em] text-[#EF4444] mb-2 py-1"
            >
              <span>Removed from template ({removedCount})</span>
              <span className="text-base">{showRemovedSection ? '▲' : '▼'}</span>
            </button>
            {showRemovedSection && (
              <div className="bg-[#FEF2F2] rounded-xl border border-[#FEE2E2] overflow-hidden">
                {Object.values(removedItemsByCat).flat().map((item, i, arr) => (
                  <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[#FEE2E2]' : ''}`}>
                    <p className="flex-1 text-[15px] text-[#EF4444] line-through opacity-60">{item.name}</p>
                    <button
                      onClick={() => restoreTemplateItem(typeData.id, item.id)}
                      className="text-[13px] text-[#1B4332] font-semibold bg-[#f0f7f3] px-3 py-1.5 rounded-lg flex-none"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Add Panel (search or create) ─────────────────────────────────────────────

function AddPanel({ panel, query, setQuery, searchResults, baseItemIds, removals, travelerAdditionIds, createForm, setCreateField, onAddFromSearch, onCreateSubmit, onClose, catLabels }) {
  return (
    <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-4 space-y-3 mt-2">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-semibold text-[#2D2D2D]">
          {panel.mode === 'search' ? 'Add from Inventory' : 'Add New Item'}
        </p>
        <button onClick={onClose} className="text-[#9CA3AF] text-lg leading-none w-7 h-7 flex items-center justify-center hover:text-[#6B7280]">✕</button>
      </div>

      {panel.mode === 'search' && (
        <>
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search items…" className="input" />
          {query.trim() === '' && <p className="text-[13px] text-[#9CA3AF] text-center py-2">Type to search all items</p>}
          {searchResults.map(item => {
            const alreadyActive = (baseItemIds.has(item.id) && !removals.has(item.id)) || travelerAdditionIds.has(item.id)
            const wasRemoved = removals.has(item.id)
            return (
              <div key={`${item.id}-${item.source}`} className="flex items-center gap-3 py-2 border-b border-[#E5E7EB] last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] text-[#2D2D2D]">{item.name}{item.source === 'user' && <span className="ml-1 text-[13px] text-[#95C4A1]">★</span>}</p>
                  <p className="text-[13px] text-[#9CA3AF]">{catLabels[item.category] || item.category}</p>
                </div>
                {alreadyActive ? (
                  <span className="text-[13px] text-[#1B4332] font-medium flex-none">In template</span>
                ) : wasRemoved ? (
                  <button onClick={() => onAddFromSearch(item)} className="text-[13px] bg-[#FEF3C7] text-[#92400E] font-semibold px-2.5 py-1 rounded-lg flex-none">Restore</button>
                ) : (
                  <button onClick={() => onAddFromSearch(item)} className="text-[13px] bg-[#f0f7f3] text-[#1B4332] font-semibold px-2.5 py-1 rounded-lg flex-none">Add</button>
                )}
              </div>
            )
          })}
        </>
      )}

      {panel.mode === 'create' && (
        <>
          <p className="text-[13px] text-[#6B7280]">Creates in master inventory and adds to this template.</p>
          <div>
            <label className="text-[13px] font-semibold text-[#6B7280] mb-1 block uppercase tracking-[0.04em]">Item Name *</label>
            <input autoFocus value={createForm.name} onChange={e => setCreateField('name', e.target.value)} placeholder="e.g. Resistance Bands" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-semibold text-[#6B7280] mb-1 block uppercase tracking-[0.04em]">Category</label>
              <select value={createForm.category} onChange={e => setCreateField('category', e.target.value)} className="input">
                {[
                  { val: 'clothing', label: 'Clothing' }, { val: 'toiletries', label: 'Toiletries' },
                  { val: 'technology', label: 'Technology' }, { val: 'medical', label: 'Medical / Supplements' },
                  { val: 'comfort', label: 'Travel Comfort' }, { val: 'documents', label: 'Documents' },
                  { val: 'misc', label: 'Misc' }, { val: 'gear', label: 'Gear & Equipment' },
                ].map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#6B7280] mb-1 block uppercase tracking-[0.04em]">Quantity</label>
              <input value={createForm.qty} onChange={e => setCreateField('qty', e.target.value)} placeholder="1" className="input" />
            </div>
          </div>
          <div>
            <label className="text-[13px] font-semibold text-[#6B7280] mb-2 block uppercase tracking-[0.04em]">Show on trips</label>
            <div className="bg-white rounded-xl border border-[#E5E7EB] px-3 py-2">
              <ConditionSelect value={createForm.conditions} onChange={v => setCreateField('conditions', v)} />
            </div>
          </div>
          <div>
            <label className="text-[13px] font-semibold text-[#6B7280] mb-1 block uppercase tracking-[0.04em]">Note (optional)</label>
            <input value={createForm.note} onChange={e => setCreateField('note', e.target.value)} placeholder="optional note" className="input" />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setCreateField('isHeavy', !createForm.isHeavy)} className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${createForm.isHeavy ? 'bg-[#EF4444]' : 'bg-[#D1D5DB]'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${createForm.isHeavy ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-[13px] text-[#2D2D2D]">Heavy ⚠️</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setCreateField('optional', !createForm.optional)} className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${createForm.optional ? 'bg-[#1B4332]' : 'bg-[#D1D5DB]'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${createForm.optional ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-[13px] text-[#2D2D2D]">Optional</span>
            </label>
          </div>
          <button
            onClick={onCreateSubmit}
            disabled={!createForm.name.trim()}
            className="w-full bg-[#1B4332] text-white text-[15px] font-bold py-3 rounded-xl disabled:opacity-40"
          >
            Create + Add to Template
          </button>
        </>
      )}
    </div>
  )
}

// ─── Template Item Row ────────────────────────────────────────────────────────

function TemplateItemRow({ item, isLast, onRemove, onDelete, onEdit, isEditing }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-[#E5E7EB]' : ''} ${isEditing ? 'bg-[#f0f7f3]' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-[#2D2D2D]">
          {item.name}
          {item.isHeavy && <span className="ml-1 text-[11px] text-[#D97706]">⚠️</span>}
          {item.optional && <span className="ml-1 text-[13px] text-[#9CA3AF]">(optional)</span>}
          {item.isTemplateAddition && <span className="ml-1 text-[13px] text-[#95C4A1]">★ added</span>}
          {item.weatherTrigger && <span className="ml-1 text-[11px] text-[#3B82F6]">🌤 {item.weatherTrigger}</span>}
        </p>
        {(item.resolvedQty > 1 || (typeof item.qty === 'number' && item.qty > 1)) && (
          <p className="text-[13px] text-[#9CA3AF] mt-0.5">×{item.resolvedQty ?? item.qty}</p>
        )}
      </div>
      {onEdit && (
        <button onClick={onEdit} className="text-[13px] text-[#1B4332] font-semibold px-2 py-1 bg-[#f0f7f3] rounded-lg flex-none" title="Edit">
          ✏️
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="text-[13px] text-[#EF4444] font-semibold bg-[#FEF2F2] px-2.5 py-1 rounded-lg flex-none">Remove</button>
      )}
      {onRemove && (
        <button onClick={onRemove} className="text-[#D1D5DB] hover:text-[#EF4444] transition-colors text-xl leading-none p-0.5 flex-none" title="Hide from template">×</button>
      )}
    </div>
  )
}
