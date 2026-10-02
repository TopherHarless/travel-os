// Open-Meteo weather integration — no API key required

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const HISTORY_URL  = 'https://archive-api.open-meteo.com/v1/archive'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

export async function geocodeDestination(destination) {
  async function tryGeocode(name) {
    const res = await fetch(`${GEOCODE_URL}?name=${encodeURIComponent(name)}&count=1&language=en&format=json`)
    if (!res.ok) throw new Error('Geocoding failed')
    const data = await res.json()
    return data.results?.[0] ?? null
  }

  // Try the full string first; if no results, retry with just the city part before the first comma
  // e.g. "Palm Springs, CA" → try "Palm Springs, CA" → fall back to "Palm Springs"
  let result = await tryGeocode(destination)
  if (!result && destination.includes(',')) {
    result = await tryGeocode(destination.split(',')[0].trim())
  }
  if (!result) throw new Error(`Location not found: ${destination}`)
  return { lat: result.latitude, lon: result.longitude, name: result.name, country: result.country }
}

export async function fetchForecast(lat, lon, startDate, endDate) {
  const params = new URLSearchParams({
    latitude: lat, longitude: lon,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode',
    temperature_unit: 'fahrenheit',
    timezone: 'auto',
    start_date: startDate,
    end_date: endDate,
  })
  const res = await fetch(`${FORECAST_URL}?${params}`)
  if (!res.ok) throw new Error('Weather fetch failed')
  return res.json()
}

export async function fetchHistoricalClimate(lat, lon, departureDate) {
  const dep = new Date(departureDate + 'T12:00:00')
  const month = dep.getMonth() + 1 // 1-12
  const currentYear = dep.getFullYear()

  // Collect data from the last 5 complete calendar years for the same month
  const ranges = []
  for (let i = 5; i >= 1; i--) {
    const year = currentYear - i
    const mm = String(month).padStart(2, '0')
    const lastDay = new Date(year, month, 0).getDate()
    ranges.push({
      start: `${year}-${mm}-01`,
      end: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
    })
  }

  const allHighs = [], allLows = [], allPrecips = []
  await Promise.all(ranges.map(async ({ start, end }) => {
    const params = new URLSearchParams({
      latitude: lat, longitude: lon,
      start_date: start, end_date: end,
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
      temperature_unit: 'fahrenheit',
      timezone: 'auto',
    })
    const res = await fetch(`${HISTORY_URL}?${params}`)
    if (!res.ok) return
    const data = await res.json()
    if (!data.daily) return
    allHighs.push(...data.daily.temperature_2m_max.filter(v => v != null))
    allLows.push(...data.daily.temperature_2m_min.filter(v => v != null))
    allPrecips.push(...data.daily.precipitation_sum.filter(v => v != null))
  }))

  if (!allHighs.length) throw new Error('No historical data available')

  const avg = arr => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
  const avgHigh = avg(allHighs)
  const avgLow  = avg(allLows)
  // Days with > 1mm precipitation count as "rain days"
  const rainDays = allPrecips.filter(v => v > 1).length
  const avgPrecipPct = allPrecips.length ? Math.round((rainDays / allPrecips.length) * 100) : 0

  return { avgHigh, avgLow, avgPrecipPct, monthName: MONTH_NAMES[month - 1] }
}

// Open-Meteo weather codes → emoji + label
export function weatherCodeToIcon(code) {
  if (code === 0) return { icon: '☀️', label: 'Clear' }
  if (code <= 2)  return { icon: '⛅', label: 'Partly Cloudy' }
  if (code === 3) return { icon: '☁️', label: 'Overcast' }
  if (code <= 49) return { icon: '🌫️', label: 'Foggy' }
  if (code <= 59) return { icon: '🌦️', label: 'Drizzle' }
  if (code <= 69) return { icon: '🌧️', label: 'Rain' }
  if (code <= 79) return { icon: '❄️', label: 'Snow' }
  if (code <= 82) return { icon: '🌧️', label: 'Rain Showers' }
  if (code <= 86) return { icon: '🌨️', label: 'Snow Showers' }
  if (code <= 99) return { icon: '⛈️', label: 'Thunderstorm' }
  return { icon: '🌡️', label: 'Unknown' }
}

// Open-Meteo only forecasts ~16 days ahead
export function isWithinForecastRange(departureDateStr) {
  const dep = new Date(departureDateStr)
  const now = new Date()
  const diffDays = Math.floor((dep - now) / (1000 * 60 * 60 * 24))
  return diffDays <= 15
}

export async function getWeatherForTrip(destination, departureDate, returnDate) {
  const { lat, lon, name, country } = await geocodeDestination(destination)
  const location = `${name}, ${country}`
  const within = isWithinForecastRange(departureDate)

  if (!within) {
    const hist = await fetchHistoricalClimate(lat, lon, departureDate)
    const precipDesc = hist.avgPrecipPct > 60 ? 'frequent rain'
      : hist.avgPrecipPct > 40 ? 'rain likely'
      : hist.avgPrecipPct > 20 ? 'occasional showers'
      : 'mostly dry'
    return {
      type: 'historical',
      location,
      monthName: hist.monthName,
      avgHigh: hist.avgHigh,
      avgLow: hist.avgLow,
      avgPrecipPct: hist.avgPrecipPct,
      precipDesc,
      days: null,
    }
  }

  const data = await fetchForecast(lat, lon, departureDate, returnDate)
  const days = data.daily.time.map((date, i) => ({
    date,
    high: Math.round(data.daily.temperature_2m_max[i]),
    low:  Math.round(data.daily.temperature_2m_min[i]),
    precipPct: data.daily.precipitation_probability_max[i],
    ...weatherCodeToIcon(data.daily.weathercode[i]),
  }))

  return { type: 'forecast', location, days }
}

// Normalize weather result to packing-relevant stats (works for both types)
export function summarizeWeather(weather) {
  if (!weather) return null
  if (weather.type === 'historical') {
    return {
      avgHigh: weather.avgHigh,
      avgLow: weather.avgLow,
      avgPrecipPct: weather.avgPrecipPct,
      location: weather.location,
      period: weather.monthName,
    }
  }
  if (weather.type === 'forecast' && weather.days?.length) {
    const avg = arr => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
    return {
      avgHigh: avg(weather.days.map(d => d.high)),
      avgLow:  avg(weather.days.map(d => d.low)),
      avgPrecipPct: avg(weather.days.map(d => d.precipPct ?? 0)),
      location: weather.location,
      period: 'forecast',
    }
  }
  return null
}

// Convert summary stats to condition flags used by the packing modifier
export function computeWeatherConditions(summary) {
  if (!summary) return null
  return {
    isRainy: summary.avgPrecipPct > 40,
    isCold:  summary.avgHigh < 55,
    isMild:  summary.avgHigh >= 55 && summary.avgHigh <= 75,
    isHot:   summary.avgHigh > 85,
    avgHigh: summary.avgHigh,
    avgLow:  summary.avgLow,
    avgPrecipPct: summary.avgPrecipPct,
    location: summary.location,
    period: summary.period,
  }
}
