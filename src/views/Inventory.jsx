import { useState, useMemo } from 'react'
import { ALL_ITEMS } from '../data/items.js'
import { TRIP_TYPES } from '../data/tripTypes.js'
import Header from '../components/Header.jsx'
import InventoryItemDrawer from '../components/InventoryItemDrawer.jsx'

const TRAVELER_CONFIG = [
  { id: 'topher', label: 'Topher' },
  { id: 'lanita', label: 'La Nita' },
  { id: 'crosby', label: 'Crosby' },
  { id: 'penn',   label: 'Penn' },
  { id: 'shared', label: 'Shared' },
]

const CAT_LABELS = {
  clothing: 'Clothing', toiletries: 'Toiletries', medical: 'Medical & Supplements',
  hydration: 'Hydration', yogurt: 'Yogurt / Food', technology: 'Technology', power: 'Power',
  comfort: 'Travel Comfort', documents: 'Documents', misc: 'Misc',
  infant: '👶 Infant Items', toddler: '🧒 Toddler Items', child: '👦 Child Items',
  gear: 'Gear & Equipment', essentials: 'Shared Essentials',
}

export default function InventoryView({ state, addUserItem, updateUserItem, deleteUserItem }) {
  const [activeTraveler, setActiveTraveler] = useState('topher')
  const [drawer, setDrawer] = useState(null)

  const staticCategories = ALL_ITEMS[activeTraveler] || {}
  const userCategories   = state?.userInventory?.[activeTraveler] || {}

  const mergedCategories = useMemo(() => {
    const all = {}
    for (const [cat, items] of Object.entries(staticCategories)) {
      if (!all[cat]) all[cat] = { static: [], user: [] }
      all[cat].static = items
    }
    for (const [cat, items] of Object.entries(userCategories)) {
      if (items?.length) {
        if (!all[cat]) all[cat] = { static: [], user: [] }
        all[cat].user = items
      }
    }
    return all
  }, [staticCategories, userCategories])

  const allItems  = [...Object.values(staticCategories).flat(), ...Object.values(userCategories).flat()]
  const heavyCount = allItems.filter(i => i.isHeavy).length
  const userCount  = Object.values(userCategories).flat().length

  function openAddDrawer(category) { setDrawer({ item: null, category }) }
  function openEditDrawer(item, category) { setDrawer({ item: { ...item, category }, category, itemCategory: category }) }

  function handleDrawerSave(newCategory, itemData) {
    if (drawer.item) {
      const oldCat = drawer.itemCategory
      if (newCategory !== oldCat) {
        deleteUserItem?.(activeTraveler, oldCat, drawer.item.id)
        addUserItem?.(activeTraveler, newCategory, itemData)
      } else {
        updateUserItem?.(activeTraveler, oldCat, drawer.item.id, itemData)
      }
    } else {
      addUserItem?.(activeTraveler, newCategory, itemData)
    }
    setDrawer(null)
  }

  function handleDrawerDelete() {
    if (!drawer?.item) return
    deleteUserItem?.(activeTraveler, drawer.itemCategory, drawer.item.id)
    setDrawer(null)
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 lg:pb-8">
      <Header title="Master Inventory" />

      {/* Traveler selector */}
      <div className="flex gap-2 px-4 lg:px-8 py-3 overflow-x-auto border-b border-[#E5E7EB] bg-white">
        {TRAVELER_CONFIG.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTraveler(t.id)}
            className={`flex-none px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              activeTraveler === t.id
                ? 'bg-[#1B4332] text-white'
                : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary chips */}
      <div className="px-4 lg:px-8 py-2.5 flex gap-2 border-b border-[#E5E7EB] bg-white">
        <span className="text-[13px] bg-[#F3F4F6] text-[#6B7280] rounded-full px-3 py-1">{allItems.length} items</span>
        {heavyCount > 0 && (
          <span className="text-[13px] bg-[#FEF3C7] text-[#92400E] rounded-full px-3 py-1">⚠️ {heavyCount} heavy</span>
        )}
        {userCount > 0 && (
          <span className="text-[13px] bg-[#f0f7f3] text-[#1B4332] rounded-full px-3 py-1">★ {userCount} custom</span>
        )}
      </div>

      <div className="flex-1 px-4 lg:px-8 pt-5 space-y-4 max-w-[1100px] mx-auto w-full">
        {Object.entries(mergedCategories).map(([cat, { static: staticItems, user: userItems }]) => (
          <CategorySection
            key={cat}
            cat={cat}
            staticItems={staticItems || []}
            userItems={userItems || []}
            onAdd={() => openAddDrawer(cat)}
            onEdit={(item) => openEditDrawer(item, cat)}
            onDelete={(item) => { deleteUserItem?.(activeTraveler, cat, item.id) }}
          />
        ))}
      </div>

      {drawer && (
        <InventoryItemDrawer
          item={drawer.item}
          defaultCategory={drawer.category}
          onClose={() => setDrawer(null)}
          onSave={handleDrawerSave}
          onDelete={drawer.item ? handleDrawerDelete : null}
        />
      )}
    </div>
  )
}

function CategorySection({ cat, staticItems, userItems, onAdd, onEdit, onDelete }) {
  const allCount = staticItems.length + userItems.length
  if (allCount === 0) return null

  return (
    <div>
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-2 pb-1.5 border-b border-[#E5E7EB]">
        {CAT_LABELS[cat] || cat}
      </h3>
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {staticItems.map((item, i) => (
          <div
            key={item.id}
            className={`flex items-start gap-3 px-4 py-3 ${
              i < staticItems.length - 1 || userItems.length > 0 ? 'border-b border-[#E5E7EB]' : ''
            }`}
          >
            <div className="flex-1">
              <p className="text-[15px] font-medium text-[#2D2D2D]">
                {item.name}
                {item.isHeavy && <span className="ml-1.5 text-[11px] text-[#D97706] font-semibold">⚠️</span>}
                {item.optional && <span className="ml-1 text-[13px] text-[#9CA3AF]">(optional)</span>}
              </p>
              {item.qty && item.qty !== 1 && <p className="text-[13px] text-[#6B7280] mt-0.5">Qty: {item.qty}</p>}
              {item.note && <p className="text-[13px] text-[#6B7280] mt-0.5">{item.note}</p>}
            </div>
            <div className="flex-none flex flex-col gap-0.5 items-end">
              {(item.conditions || []).map(c => (
                <span key={c} className="text-[11px] bg-[#F3F4F6] text-[#9CA3AF] rounded px-1.5 py-0.5">{c}</span>
              ))}
            </div>
          </div>
        ))}

        {userItems.map((item, i) => {
          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 px-4 py-3 ${i < userItems.length - 1 ? 'border-b border-[#E5E7EB]' : ''}`}
            >
              <div className="flex-1">
                <p className="text-[15px] font-medium text-[#2D2D2D]">
                  <span className="text-[#95C4A1] mr-1">★</span>
                  {item.name}
                  {item.isHeavy && <span className="ml-1 text-[11px] text-[#D97706]">⚠️</span>}
                  {item.optional && <span className="ml-1 text-[13px] text-[#9CA3AF]">(optional)</span>}
                  {item.weatherTrigger && <span className="ml-1 text-[11px] text-[#3B82F6]">🌤</span>}
                </p>
                {item.qty && item.qty !== 1 && <p className="text-[13px] text-[#6B7280] mt-0.5">Qty: {item.qty}</p>}
                {item.note && <p className="text-[13px] text-[#6B7280] mt-0.5">{item.note}</p>}
                <div className="flex flex-wrap gap-1 mt-1">
                  {(item.conditions || []).map(c => {
                    const tt = TRIP_TYPES.find(t => t.id === c)
                    return (
                      <span key={c} className="text-[11px] bg-[#f0f7f3] text-[#1B4332] rounded px-1.5 py-0.5">
                        {tt ? tt.label : c}
                      </span>
                    )
                  })}
                </div>
              </div>
              <button
                onClick={() => onEdit(item)}
                className="flex-none text-[13px] text-[#1B4332] font-semibold px-2 py-1 bg-[#f0f7f3] rounded-lg"
              >
                ✏️ Edit
              </button>
            </div>
          )
        })}
      </div>

      {onAdd && (
        <button
          onClick={onAdd}
          className="w-full mt-2 py-2.5 rounded-xl border border-dashed border-[#95C4A1] text-[13px] text-[#1B4332] font-medium flex items-center justify-center gap-1.5 bg-white active:bg-[#f0f7f3]"
        >
          <span className="text-base leading-none">+</span> Add to {CAT_LABELS[cat] || cat}
        </button>
      )}
    </div>
  )
}
