import { useState } from 'react'

const CAT_LABELS = {
  clothing: 'Clothing', toiletries: 'Toiletries', medical: 'Medical & Supplements',
  hydration: 'Hydration', yogurt: 'Yogurt / Food', technology: 'Technology', power: 'Power',
  comfort: 'Travel Comfort', documents: 'Documents', misc: 'Misc',
  infant: 'Infant Items', toddler: 'Toddler Items', child: 'Child Items', gear: 'Gear & Equipment',
  essentials: 'Shared Essentials',
}

const TRAVELER_STYLES = {
  topher: { bg: '#f0f7f3', text: '#1B4332', border: '#dcefdf' },
  lanita: { bg: '#fff0f5', text: '#9D174D', border: '#fbcfe8' },
  crosby: { bg: '#f0fdf4', text: '#065F46', border: '#bbf7d0' },
  penn:   { bg: '#fffbeb', text: '#92400E', border: '#fde68a' },
  shared: { bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB' },
}

const TRAVELER_LABELS = {
  topher: 'Topher', lanita: 'La Nita', crosby: 'Crosby', penn: 'Penn', shared: 'Shared'
}

export default function PackingSection({ travelerId, categories, checkedItems, onToggle, isMultiPhase, itemPhases, onSetPhase, onRemoveItem, onAddItem, qtyOverrides, onSetQtyOverride }) {
  const allItems = Object.values(categories).flat()
  const heavyItems = allItems.filter(i => i.isHeavy)
  const checkedCount = allItems.filter(i => checkedItems[i.id]).length

  const style = TRAVELER_STYLES[travelerId] || TRAVELER_STYLES.shared

  return (
    <div className="mb-4">
      {/* Traveler header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 rounded-xl border mb-2"
        style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}
      >
        <span className="font-semibold text-[15px]">{TRAVELER_LABELS[travelerId] || travelerId}</span>
        <span className="text-[13px] opacity-80">{checkedCount}/{allItems.length} packed</span>
      </div>

      {/* Heavy items banner */}
      {heavyItems.length > 0 && (
        <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-lg px-3 py-2 mb-2">
          <p className="text-xs font-semibold text-[#92400E] mb-1">⚠️ Heavy Items — load these first</p>
          <div className="flex flex-wrap gap-1">
            {heavyItems.map(item => (
              <span key={item.id} className="text-xs bg-[#FDE68A] text-[#92400E] rounded px-1.5 py-0.5">{item.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {Object.entries(categories).map(([cat, items]) => (
        <CategorySection
          key={cat}
          category={cat}
          items={items}
          checkedItems={checkedItems}
          onToggle={onToggle}
          isMultiPhase={isMultiPhase}
          itemPhases={itemPhases}
          onSetPhase={onSetPhase}
          onRemoveItem={onRemoveItem}
          qtyOverrides={qtyOverrides}
          onSetQtyOverride={onSetQtyOverride}
        />
      ))}

      {/* Add Item button */}
      {onAddItem && (
        <button
          onClick={() => onAddItem(travelerId)}
          className="w-full mt-1 py-2.5 rounded-xl border border-dashed border-[#95C4A1] text-[13px] text-[#1B4332] font-medium flex items-center justify-center gap-1.5 bg-white active:bg-[#f0f7f3]"
        >
          <span className="text-base leading-none">+</span> Add Item
        </button>
      )}
    </div>
  )
}

function CategorySection({ category, items, checkedItems, onToggle, isMultiPhase, itemPhases, onSetPhase, onRemoveItem, qtyOverrides, onSetQtyOverride }) {
  if (!items?.length) return null

  return (
    <div className="mb-3">
      <h4 className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-[0.08em] px-1 mb-1.5">
        {CAT_LABELS[category] || category}
      </h4>
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {items.map((item, i) => (
          <PackingItem
            key={item.id}
            item={item}
            checked={!!checkedItems[item.id]}
            onToggle={() => onToggle(item.id)}
            onRemove={onRemoveItem ? () => onRemoveItem(item.id) : null}
            isLast={i === items.length - 1}
            isMultiPhase={isMultiPhase}
            phase={itemPhases?.[item.id] || 'both'}
            onSetPhase={phase => onSetPhase?.(item.id, phase)}
            qtyOverride={qtyOverrides?.[item.id]}
            onSetQtyOverride={onSetQtyOverride}
          />
        ))}
      </div>
    </div>
  )
}

function PackingItem({ item, checked, onToggle, onRemove, isLast, isMultiPhase, phase, onSetPhase, qtyOverride, onSetQtyOverride }) {
  const [confirming, setConfirming] = useState(false)
  const [editingQty, setEditingQty] = useState(false)

  const resolvedQty = item.resolvedQty
  const effectiveQty = qtyOverride !== undefined ? qtyOverride : (resolvedQty ?? 1)
  const isOverridden = qtyOverride !== undefined

  if (confirming) {
    return (
      <div className={`flex items-center gap-2 px-4 py-3 bg-[#FEF2F2] ${!isLast ? 'border-b border-[#E5E7EB]' : ''}`}>
        <p className="flex-1 text-xs text-[#EF4444] font-medium">Remove "{item.name}"?</p>
        <button
          onClick={() => { setConfirming(false); onRemove() }}
          className="text-xs bg-[#EF4444] text-white px-3 py-1.5 rounded-lg font-semibold"
        >
          Remove
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-[#6B7280] px-2 py-1.5">Cancel</button>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 min-h-[48px] ${!isLast ? 'border-b border-[#E5E7EB]' : ''}`}
      style={{ backgroundColor: checked ? '#F8F6F1' : '#ffffff' }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-5 h-5 flex-none rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
          checked ? 'bg-[#1B4332] border-[#1B4332]' : 'border-[#D1D5DB]'
        }`}
      >
        {checked && <span className="text-white font-bold" style={{ fontSize: '9px', lineHeight: 1 }}>✓</span>}
      </button>

      {/* Item name + note */}
      <div className="flex-1 min-w-0 py-3">
        <p className={`text-[15px] font-medium leading-snug ${checked ? 'line-through text-[#9CA3AF]' : 'text-[#2D2D2D]'}`}>
          {item.name}
        </p>
        {item.note && <p className="text-[13px] text-[#6B7280] mt-0.5">{item.note}</p>}
      </div>

      {/* Small badges (heavy, optional, weather) */}
      <div className="flex items-center gap-1 flex-none">
        {item.isHeavy && (
          <span className="text-[11px] bg-[#FEF3C7] text-[#D97706] rounded px-1.5 py-0.5 font-medium">⚠️</span>
        )}
        {item.optional && (
          <span className="text-[11px] text-[#9CA3AF]">(opt)</span>
        )}
        {item.weatherFlag && (
          <span
            className="text-[11px] bg-[#EFF6FF] text-[#1D4ED8] rounded px-1.5 py-0.5"
            title={item.weatherSource ? `Weather: ${item.weatherSource}` : 'Flagged by weather'}
          >
            🌤{item.weatherSource ? ` ${item.weatherSource}` : ''}
          </span>
        )}
      </div>

      {/* QTY column — always visible, dedicated space */}
      {onSetQtyOverride ? (
        editingQty ? (
          <div className="flex items-center gap-0.5 flex-none">
            <button
              onClick={() => {
                const v = Math.max(1, effectiveQty - 1)
                onSetQtyOverride(item.id, v)
              }}
              className="w-6 h-6 rounded bg-[#F3F4F6] text-[#2D2D2D] font-bold text-sm flex items-center justify-center"
            >−</button>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={effectiveQty}
              onChange={e => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v) && v >= 1) onSetQtyOverride(item.id, v)
              }}
              onFocus={e => e.target.select()}
              className="w-9 text-center text-[13px] border border-[#95C4A1] rounded py-0.5 font-semibold text-[#1B4332]"
              style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
              autoFocus
            />
            <button
              onClick={() => onSetQtyOverride(item.id, effectiveQty + 1)}
              className="w-6 h-6 rounded bg-[#F3F4F6] text-[#2D2D2D] font-bold text-sm flex items-center justify-center"
            >+</button>
            <button
              onClick={() => setEditingQty(false)}
              className="w-6 h-6 rounded bg-[#1B4332] text-white text-xs font-bold flex items-center justify-center ml-0.5"
            >✓</button>
            {isOverridden && (
              <button
                onClick={() => { onSetQtyOverride(item.id, null); setEditingQty(false) }}
                title="Reset to calculated"
                className="text-[12px] text-[#9CA3AF] hover:text-[#6B7280] ml-0.5"
              >↩</button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setEditingQty(true)}
            title="Tap to edit quantity"
            className={`flex-none w-10 h-8 rounded-lg flex items-center justify-center font-semibold text-[14px] transition-colors ${
              isOverridden
                ? 'bg-[#dcefdf] text-[#1B4332] border border-[#95C4A1]'
                : effectiveQty > 1
                  ? 'bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB] hover:bg-[#E5E7EB]'
                  : 'bg-transparent text-[#D1D5DB] border border-dashed border-[#E5E7EB] hover:border-[#95C4A1] hover:text-[#6B7280]'
            }`}
          >
            {effectiveQty}
          </button>
        )
      ) : (
        /* Read-only qty display */
        effectiveQty > 1 ? (
          <span className="flex-none w-10 h-8 rounded-lg flex items-center justify-center font-semibold text-[14px] bg-[#F3F4F6] text-[#374151]">
            {effectiveQty}
          </span>
        ) : (
          <span className="flex-none w-10" />
        )
      )}

      {/* Phase selector — shown when multi-phase, styled as a clear segmented control */}
      {isMultiPhase && (
        <PhaseSelector phase={phase} onSet={onSetPhase} />
      )}

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={() => setConfirming(true)}
          className="flex-none text-[#D1D5DB] hover:text-[#EF4444] transition-colors text-lg leading-none p-1"
          title="Remove item"
        >
          ×
        </button>
      )}
    </div>
  )
}

function PhaseSelector({ phase, onSet }) {
  const phases = [
    { val: '1',    emoji: '🟦', label: '1', title: 'Phase 1 only' },
    { val: 'both', emoji: '🟩', label: '·', title: 'Both phases' },
    { val: '2',    emoji: '🟧', label: '2', title: 'Phase 2 only' },
  ]

  const activePhase = phases.find(p => p.val === phase)

  return (
    <div className="flex-none flex items-center gap-0.5 bg-[#F3F4F6] rounded-lg p-0.5" title="Tap to change trip phase">
      {phases.map(p => (
        <button
          key={p.val}
          title={p.title}
          onClick={() => onSet(p.val)}
          className={`w-7 h-6 rounded flex items-center justify-center text-[13px] transition-all ${
            phase === p.val
              ? 'bg-white shadow-sm'
              : 'opacity-30 hover:opacity-60'
          }`}
        >
          {p.emoji}
        </button>
      ))}
    </div>
  )
}
