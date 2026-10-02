export default function WeatherCard({ weather, loading, error, label }) {
  if (loading) {
    return (
      <div className="bg-blue-50 rounded-xl p-4 animate-pulse">
        {label && <p className="text-xs font-semibold text-blue-700 mb-2">{label}</p>}
        <div className="h-4 bg-blue-200 rounded w-1/2 mb-2" />
        <div className="h-3 bg-blue-200 rounded w-1/3" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-orange-800">Weather unavailable</p>
        <p className="text-xs text-orange-600 mt-1">Check your connection or deploy to web — Open-Meteo requires no API key on a live site.</p>
        <p className="text-xs text-gray-400 mt-2 font-mono">{error}</p>
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-500">
        Weather unavailable — check connection or deploy to web.
      </div>
    )
  }

  if (weather.type === 'historical') {
    const { location, monthName, avgHigh, avgLow, avgPrecipPct, precipDesc } = weather
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        {label && <p className="text-xs font-bold text-amber-700 mb-2 uppercase tracking-wide">{label}</p>}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-amber-900">{location}</p>
            <p className="text-xs text-amber-700 mt-0.5">{monthName} — 5-year historical averages</p>
          </div>
          <span className="text-2xl">📅</span>
        </div>
        <div className="flex gap-4">
          <div className="bg-amber-100 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-amber-700 mb-0.5">Avg High</p>
            <p className="text-xl font-bold text-amber-900">{avgHigh}°F</p>
          </div>
          <div className="bg-amber-100 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-amber-700 mb-0.5">Avg Low</p>
            <p className="text-xl font-bold text-amber-900">{avgLow}°F</p>
          </div>
          <div className="bg-amber-100 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-amber-700 mb-0.5">Rain Days</p>
            <p className="text-xl font-bold text-amber-900">{avgPrecipPct}%</p>
          </div>
        </div>
        <p className="text-xs text-amber-700 mt-2 capitalize">{precipDesc}</p>
        <p className="text-xs text-amber-500 mt-1">Live forecast available ~2 weeks before departure</p>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 rounded-xl p-4">
      {label && <p className="text-xs font-bold text-blue-700 mb-1 uppercase tracking-wide">{label}</p>}
      <p className="text-sm font-semibold text-blue-900 mb-3">{weather.location}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {weather.days?.map(day => (
          <div key={day.date} className="flex-none text-center bg-white rounded-lg p-2 shadow-sm min-w-[60px]">
            <p className="text-xs text-gray-500">{new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            <p className="text-xl my-1">{day.icon}</p>
            <p className="text-xs font-semibold text-gray-800">{day.high}°</p>
            <p className="text-xs text-gray-500">{day.low}°</p>
            {day.precipPct > 20 && (
              <p className="text-xs text-blue-500">💧{day.precipPct}%</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
