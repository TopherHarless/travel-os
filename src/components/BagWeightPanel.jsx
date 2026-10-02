import { getAirlineLimit } from '../data/bags.js'

const TRAVELER_LABEL = { topher: 'Topher', lanita: 'La Nita', penn: 'Penn', crosby: 'Crosby', family: 'Family', shared: 'Family' }

export default function BagWeightPanel({ bags, airline, selectedTravelers, selectedBagIds }) {
  const limit = getAirlineLimit(airline)
  const activeBags = selectedBagIds
    ? bags.filter(b => selectedBagIds.includes(b.id))
    : bags.filter(b => b.active && (b.owner === 'family' || selectedTravelers.includes(b.owner)))

  if (!activeBags.length) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-1">Bag Weight Calculator</h3>
      <p className="text-xs text-gray-500 mb-3">
        Airline limit: <strong>{limit} lbs</strong> ({airline || 'default'})
      </p>
      <p className="text-xs text-amber-600 font-medium mb-3">⚠️ Distribute heavy items first across bags</p>

      <div className="space-y-2">
        {activeBags.map(bag => {
          const headroom = bag.emptyWeight != null ? limit - bag.emptyWeight : null
          return (
            <div key={bag.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm text-gray-800">{bag.label}</p>
                <p className="text-xs text-gray-500">{TRAVELER_LABEL[bag.owner] || bag.owner}</p>
              </div>
              <div className="text-right">
                {bag.emptyWeight != null ? (
                  <>
                    <p className="text-sm font-medium text-gray-700">{bag.emptyWeight} lbs empty</p>
                    <p className={`text-xs font-semibold ${headroom < 10 ? 'text-red-500' : headroom < 20 ? 'text-amber-500' : 'text-green-600'}`}>
                      {headroom?.toFixed(1)} lbs available
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-gray-400">Weight unknown</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
