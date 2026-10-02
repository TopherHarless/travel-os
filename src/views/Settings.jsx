import { useState } from 'react'
import Header from '../components/Header.jsx'

const TRAVELER_STYLES = {
  topher: 'bg-[#f0f7f3] border-[#dcefdf]',
  lanita: 'bg-[#fff0f5] border-[#fbcfe8]',
  crosby: 'bg-[#f0fdf4] border-[#bbf7d0]',
  penn:   'bg-[#fffbeb] border-[#fde68a]',
}

const ROLE_OPTIONS = [
  { val: 'adult',  label: 'Adult' },
  { val: 'child',  label: 'Child' },
  { val: 'infant', label: 'Infant / Toddler' },
]

function inferRole(role) {
  if (!role) return 'adult'
  if (role === 'adult' || role === 'child' || role === 'infant') return role
  const r = role.toLowerCase()
  if (r.includes('toddler') || r.includes('infant')) return 'infant'
  if (r.includes('child')) return 'child'
  return 'adult'
}

const OWNER_OPTIONS = [
  { id: 'topher', label: 'Topher' },
  { id: 'lanita', label: 'La Nita' },
  { id: 'crosby', label: 'Crosby' },
  { id: 'penn',   label: 'Penn' },
  { id: 'family', label: 'Family / Shared' },
]
const OWNER_LABELS = {
  topher: 'Topher', lanita: 'La Nita', penn: 'Penn', crosby: 'Crosby', family: 'Family / Shared',
}

const SIZE_PRESETS = [
  { val: '19"', label: '19" Small',  autoLabel: '19" Small',  autoDims: '19" × 13" × 9.5"'    },
  { val: '25"', label: '25" Medium', autoLabel: '25" Medium', autoDims: '25" × 17.5" × 11.5"'  },
  { val: '29"', label: '29" Large',  autoLabel: '29" Large',  autoDims: '29" × 19.5" × 12.5"'  },
]

const COLOR_CHOICES = ['Grey', 'Blue Cobalt', 'Red']

function initColorFields(color) {
  if (!color) return { colorPreset: '', colorCustom: '' }
  if (COLOR_CHOICES.includes(color)) return { colorPreset: color, colorCustom: '' }
  return { colorPreset: 'Other', colorCustom: color }
}

function resolveColor(colorPreset, colorCustom) {
  if (!colorPreset) return undefined
  if (colorPreset === 'Other') return colorCustom.trim() || undefined
  return colorPreset
}

export default function SettingsView({ state, addTraveler, updateTraveler, addBag, updateBag, updateSettings }) {
  const { travelers, bags, settings } = state
  const [addingBag, setAddingBag] = useState(false)
  const [addingTraveler, setAddingTraveler] = useState(false)

  return (
    <div className="flex flex-col min-h-screen pb-20 lg:pb-8">
      <Header title="Settings" />

      <div className="flex-1 px-4 lg:px-8 pt-5 space-y-6 max-w-[1100px] mx-auto w-full">

        {/* Travelers */}
        <section>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E7EB]">
            <h2 className="section-header">Household Travelers</h2>
            {!addingTraveler && addTraveler && (
              <button onClick={() => setAddingTraveler(true)} className="text-sm text-[#1B4332] font-semibold">
                + Add Person
              </button>
            )}
          </div>

          {addingTraveler && (
            <div className="mb-3">
              <AddTravelerForm
                onAdd={t => { addTraveler(t); setAddingTraveler(false) }}
                onCancel={() => setAddingTraveler(false)}
              />
            </div>
          )}

          <div className="space-y-3">
            {travelers.map(t => (
              <TravelerCard key={t.id} traveler={t} onUpdate={updates => updateTraveler(t.id, updates)} />
            ))}
          </div>
        </section>

        {/* Bags */}
        <section>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E7EB]">
            <h2 className="section-header">Bag Inventory</h2>
            {!addingBag && (
              <button onClick={() => setAddingBag(true)} className="text-sm text-[#1B4332] font-semibold">
                + Add Bag
              </button>
            )}
          </div>

          {addingBag && (
            <div className="mb-3">
              <AddBagForm
                onAdd={bag => { addBag(bag); setAddingBag(false) }}
                onCancel={() => setAddingBag(false)}
              />
            </div>
          )}

          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            {bags.map((bag, i) => (
              <BagRow
                key={bag.id}
                bag={bag}
                isLast={i === bags.length - 1}
                onUpdate={updates => updateBag(bag.id, updates)}
              />
            ))}
          </div>
        </section>

        {/* Default Settings */}
        <section>
          <h2 className="section-header mb-3 pb-2 border-b border-[#E5E7EB]">Default Settings</h2>
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 space-y-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div>
              <label className="block text-[13px] font-semibold text-[#6B7280] mb-1.5 uppercase tracking-[0.04em]">Default Airline Weight Limit (lbs)</label>
              <input
                type="number"
                value={settings.defaultAirlineWeightLimit}
                onChange={e => updateSettings({ defaultAirlineWeightLimit: Number(e.target.value) })}
                className="input w-32"
                min={0}
                max={100}
              />
            </div>
          </div>
        </section>

        <section className="pb-8">
          <h2 className="section-header mb-3 pb-2 border-b border-[#E5E7EB]">About</h2>
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 text-[15px] text-[#6B7280] space-y-1" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p className="font-medium text-[#2D2D2D]">Travel OS</p>
            <p className="text-[13px]">Topher Harless's Smart Packing System</p>
            <p className="text-[13px]">All data stored locally in your browser. No backend.</p>
          </div>
        </section>

      </div>
    </div>
  )
}

// ── Traveler card ─────────────────────────────────────────────────────────────

function TravelerCard({ traveler, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(traveler.name)
  const [dob, setDob] = useState(traveler.dob || '')
  const [role, setRole] = useState(inferRole(traveler.role))

  function save() {
    onUpdate({ name, dob, role })
    setEditing(false)
  }

  const colorCls = TRAVELER_STYLES[traveler.id] || 'bg-[#F9FAFB] border-[#E5E7EB]'
  const roleLabel = ROLE_OPTIONS.find(r => r.val === inferRole(traveler.role))?.label || traveler.role

  if (!editing) {
    return (
      <div className={`rounded-xl border p-4 ${colorCls}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-semibold text-[#2D2D2D]">{traveler.name}</p>
            <p className="text-[13px] text-[#6B7280] mt-0.5">DOB: {traveler.dob || '—'}</p>
            <p className="text-[13px] text-[#6B7280]">{roleLabel}</p>
          </div>
          <button onClick={() => setEditing(true)} className="text-sm text-[#1B4332] font-semibold">Edit</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border p-4 ${colorCls} space-y-3`}>
      <div>
        <label className="text-[13px] font-semibold text-[#6B7280] mb-1.5 block uppercase tracking-[0.04em]">Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[13px] font-semibold text-[#6B7280] mb-1.5 block uppercase tracking-[0.04em]">Date of Birth</label>
          <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="input" />
        </div>
        <div>
          <label className="text-[13px] font-semibold text-[#6B7280] mb-1.5 block uppercase tracking-[0.04em]">Role</label>
          <select value={role} onChange={e => setRole(e.target.value)} className="input">
            {ROLE_OPTIONS.map(r => <option key={r.val} value={r.val}>{r.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={save} className="flex-1 bg-[#1B4332] text-white text-sm font-semibold py-2.5 rounded-lg">Save</button>
        <button
          onClick={() => { setName(traveler.name); setDob(traveler.dob || ''); setRole(inferRole(traveler.role)); setEditing(false) }}
          className="flex-1 bg-[#F3F4F6] text-[#6B7280] text-sm font-medium py-2.5 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Add Traveler form ─────────────────────────────────────────────────────────

function AddTravelerForm({ onAdd, onCancel }) {
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [role, setRole] = useState('adult')

  function save() {
    if (!name.trim()) return
    onAdd({ name: name.trim(), dob, role })
  }

  return (
    <div className="bg-white rounded-xl border border-[#dcefdf] p-4 space-y-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <p className="text-[15px] font-semibold text-[#2D2D2D]">New Traveler</p>
      <div>
        <label className="text-[13px] font-semibold text-[#6B7280] mb-1.5 block uppercase tracking-[0.04em]">Name *</label>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alex" className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[13px] font-semibold text-[#6B7280] mb-1.5 block uppercase tracking-[0.04em]">Date of Birth</label>
          <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="input" />
        </div>
        <div>
          <label className="text-[13px] font-semibold text-[#6B7280] mb-1.5 block uppercase tracking-[0.04em]">Role</label>
          <select value={role} onChange={e => setRole(e.target.value)} className="input">
            {ROLE_OPTIONS.map(r => <option key={r.val} value={r.val}>{r.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={!name.trim()} className="flex-1 bg-[#1B4332] text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-40">
          Add Person
        </button>
        <button onClick={onCancel} className="flex-1 bg-[#F3F4F6] text-[#6B7280] text-sm font-medium py-2.5 rounded-lg">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Shared bag form fields ────────────────────────────────────────────────────

function BagFormFields({ fields, setField }) {
  const { label, brand, owner, colorPreset, colorCustom, emptyWeight, dimensions, active, notes } = fields

  function handleSizeSelect(val) {
    setField('sizePreset', val)
    const preset = SIZE_PRESETS.find(s => s.val === val)
    if (preset) {
      setField('label', preset.autoLabel)
      setField('dimensions', preset.autoDims)
    }
  }

  function handleColorPreset(val) {
    setField('colorPreset', val)
    if (val !== 'Other') setField('colorCustom', '')
  }

  return (
    <>
      <div>
        <label className="text-[13px] font-semibold text-[#6B7280] mb-1.5 block uppercase tracking-[0.04em]">Bag Size (Suitcase)</label>
        <select value={fields.sizePreset || ''} onChange={e => handleSizeSelect(e.target.value)} className="input">
          <option value="">— select size to auto-fill —</option>
          {SIZE_PRESETS.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[13px] font-semibold text-[#6B7280] mb-1.5 block uppercase tracking-[0.04em]">Name / Label *</label>
        <input value={label} onChange={e => setField('label', e.target.value)} placeholder='e.g. 19" Small' className="input" />
      </div>
      <div>
        <label className="text-[13px] font-semibold text-[#6B7280] mb-1.5 block uppercase tracking-[0.04em]">Brand</label>
        <input value={brand} onChange={e => setField('brand', e.target.value)} placeholder="e.g. Delsey Helium Aero" className="input" />
      </div>
      <div>
        <label className="text-[13px] font-semibold text-[#6B7280] mb-1.5 block uppercase tracking-[0.04em]">Owner</label>
        <select value={owner} onChange={e => setField('owner', e.target.value)} className="input">
          {OWNER_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[13px] font-semibold text-[#6B7280] mb-1.5 block uppercase tracking-[0.04em]">Color</label>
          <select value={colorPreset} onChange={e => handleColorPreset(e.target.value)} className="input">
            <option value="">— select —</option>
            {COLOR_CHOICES.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="Other">Other</option>
          </select>
          {colorPreset === 'Other' && (
            <input value={colorCustom} onChange={e => setField('colorCustom', e.target.value)} placeholder="Type color…" className="input mt-1.5" />
          )}
        </div>
        <div>
          <label className="text-[13px] font-semibold text-[#6B7280] mb-1.5 block uppercase tracking-[0.04em]">Empty Weight (lbs)</label>
          <input type="number" step="0.1" value={emptyWeight} onChange={e => setField('emptyWeight', e.target.value)} placeholder="e.g. 8.2" className="input" />
        </div>
      </div>
      <div>
        <label className="text-[13px] font-semibold text-[#6B7280] mb-1.5 block uppercase tracking-[0.04em]">Dimensions</label>
        <input value={dimensions} onChange={e => setField('dimensions', e.target.value)} placeholder='e.g. 19" × 13" × 9.5"' className="input" />
      </div>
      <div>
        <label className="text-[13px] font-semibold text-[#6B7280] mb-1.5 block uppercase tracking-[0.04em]">Notes <span className="normal-case font-normal">(optional)</span></label>
        <input value={notes} onChange={e => setField('notes', e.target.value)} placeholder="e.g. Usually carries La Nita + Penn items" className="input" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-[0.04em]">Status</span>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[#6B7280]">{active ? 'Active' : 'Retired'}</span>
          <div
            onClick={() => setField('active', !active)}
            className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${active ? 'bg-[#1B4332]' : 'bg-[#D1D5DB]'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </div>
      </div>
    </>
  )
}

// ── Add Bag form ──────────────────────────────────────────────────────────────

function AddBagForm({ onAdd, onCancel }) {
  const [fields, setFields] = useState({
    label: '', brand: 'Delsey Helium Aero', owner: 'topher',
    colorPreset: 'Grey', colorCustom: '',
    sizePreset: '',
    emptyWeight: '', dimensions: '', active: true, notes: '',
  })

  function setField(key, val) { setFields(f => ({ ...f, [key]: val })) }

  function save() {
    if (!fields.label.trim()) return
    onAdd({
      label:       fields.label.trim(),
      brand:       fields.brand.trim() || undefined,
      owner:       fields.owner,
      color:       resolveColor(fields.colorPreset, fields.colorCustom),
      emptyWeight: fields.emptyWeight !== '' ? Number(fields.emptyWeight) : null,
      dimensions:  fields.dimensions.trim() || undefined,
      active:      fields.active,
      notes:       fields.notes.trim() || undefined,
    })
  }

  return (
    <div className="bg-white rounded-xl border border-[#dcefdf] p-4 space-y-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <p className="text-[15px] font-semibold text-[#2D2D2D]">New Bag</p>
      <BagFormFields fields={fields} setField={setField} />
      <div className="flex gap-2">
        <button onClick={save} disabled={!fields.label.trim()} className="flex-1 bg-[#1B4332] text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-40">
          Add Bag
        </button>
        <button onClick={onCancel} className="flex-1 bg-[#F3F4F6] text-[#6B7280] text-sm font-medium py-2.5 rounded-lg">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Bag row (list + inline edit) ──────────────────────────────────────────────

function BagRow({ bag, isLast, onUpdate }) {
  const [editing, setEditing] = useState(false)

  function getInitFields() {
    const { colorPreset, colorCustom } = initColorFields(bag.color)
    return {
      label:       bag.label,
      brand:       bag.brand ?? 'Delsey Helium Aero',
      owner:       bag.owner ?? 'topher',
      colorPreset, colorCustom,
      sizePreset:  '',
      emptyWeight: bag.emptyWeight ?? '',
      dimensions:  bag.dimensions ?? '',
      active:      bag.active ?? true,
      notes:       bag.notes ?? '',
    }
  }

  const [fields, setFields] = useState(getInitFields)

  function setField(key, val) { setFields(f => ({ ...f, [key]: val })) }

  function save() {
    onUpdate({
      label:       fields.label,
      brand:       fields.brand.trim() || undefined,
      owner:       fields.owner,
      color:       resolveColor(fields.colorPreset, fields.colorCustom),
      emptyWeight: fields.emptyWeight !== '' ? Number(fields.emptyWeight) : null,
      dimensions:  fields.dimensions.trim() || undefined,
      active:      fields.active,
      notes:       fields.notes.trim() || undefined,
    })
    setEditing(false)
  }

  function cancel() {
    setFields(getInitFields())
    setEditing(false)
  }

  if (editing) {
    return (
      <div className={`px-4 py-3 space-y-3 ${!isLast ? 'border-b border-[#E5E7EB]' : ''}`}>
        <p className="text-xs text-[#9CA3AF]">{bag.id}</p>
        <BagFormFields fields={fields} setField={setField} />
        <div className="flex gap-2">
          <button onClick={save} className="flex-1 bg-[#1B4332] text-white text-sm font-semibold py-2.5 rounded-lg">Save</button>
          <button onClick={cancel} className="flex-1 bg-[#F3F4F6] text-[#6B7280] text-sm font-medium py-2.5 rounded-lg">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-[#E5E7EB]' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-[#2D2D2D]">
          {bag.brand ? `${bag.brand} ` : ''}{bag.label}
          {!bag.active && <span className="ml-1.5 text-[13px] text-[#9CA3AF] font-normal">(Retired)</span>}
        </p>
        <p className="text-[13px] text-[#6B7280]">{OWNER_LABELS[bag.owner] || bag.owner}</p>
        {bag.color && <p className="text-[13px] text-[#9CA3AF]">{bag.color}</p>}
        {bag.emptyWeight != null && (
          <p className="text-[13px] text-[#9CA3AF]">{bag.emptyWeight} lbs empty{bag.dimensions ? ` · ${bag.dimensions}` : ''}</p>
        )}
        {bag.notes && <p className="text-[13px] text-[#9CA3AF] italic mt-0.5">{bag.notes}</p>}
      </div>
      <div className="flex items-center gap-3 flex-none">
        <button onClick={() => setEditing(true)} className="text-sm text-[#1B4332] font-semibold">Edit</button>
        <div
          onClick={() => onUpdate({ active: !bag.active })}
          className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${bag.active ? 'bg-[#1B4332]' : 'bg-[#D1D5DB]'}`}
        >
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${bag.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
      </div>
    </div>
  )
}
