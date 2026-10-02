import {
  differenceInDays,
  differenceInYears,
  differenceInMonths,
  parseISO,
  format,
  isValid,
} from 'date-fns'

export function parseDateSafe(dateStr) {
  if (!dateStr) return null
  const d = parseISO(dateStr)
  return isValid(d) ? d : null
}

export function tripDays(departureStr, returnStr) {
  const dep = parseDateSafe(departureStr)
  const ret = parseDateSafe(returnStr)
  if (!dep || !ret) return 0
  return Math.max(1, differenceInDays(ret, dep) + 1)
}

export function ageAtDate(dobStr, atDateStr) {
  const dob = parseDateSafe(dobStr)
  const at  = parseDateSafe(atDateStr)
  if (!dob || !at) return null
  return differenceInYears(at, dob)
}

export function ageInMonthsAtDate(dobStr, atDateStr) {
  const dob = parseDateSafe(dobStr)
  const at  = parseDateSafe(atDateStr)
  if (!dob || !at) return null
  return differenceInMonths(at, dob)
}

export function formatDate(dateStr) {
  const d = parseDateSafe(dateStr)
  if (!d) return ''
  return format(d, 'MMM d, yyyy')
}

export function formatDateShort(dateStr) {
  const d = parseDateSafe(dateStr)
  if (!d) return ''
  return format(d, 'M/d/yy')
}
