import { TRIP_TYPES } from '../data/tripTypes.js'

const OPTIONS = [
  { val: 'always', label: 'Always' },
  ...TRIP_TYPES.map(t => ({ val: t.id, label: t.label })),
]

// value: string[] — array of condition keys ('always' or trip type IDs)
// onChange: (string[]) => void
export default function ConditionSelect({ value, onChange }) {
  const isAlways = value.includes('always')

  function toggle(val) {
    if (val === 'always') {
      onChange(isAlways ? [] : ['always'])
      return
    }
    if (isAlways) return
    const next = value.includes(val) ? value.filter(v => v !== val) : [...value, val]
    if (next.length === 0) return
    onChange(next)
  }

  return (
    <div className="space-y-1">
      {OPTIONS.map(opt => {
        const checked = value.includes(opt.val)
        const disabled = opt.val !== 'always' && isAlways
        return (
          <label
            key={opt.val}
            onClick={() => !disabled && toggle(opt.val)}
            className={`flex items-center gap-2.5 py-1.5 cursor-pointer ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-none transition-colors ${
              checked ? 'bg-[#1B4332] border-[#1B4332]' : 'border-[#D1D5DB] bg-white'
            }`}>
              {checked && <span className="text-white text-xs font-bold leading-none">✓</span>}
            </div>
            <span className={`text-sm ${checked ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
              {opt.label}
            </span>
          </label>
        )
      })}
    </div>
  )
}
