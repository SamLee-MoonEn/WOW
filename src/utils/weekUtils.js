export const DAYS = ['월', '화', '수', '목', '금']

export function getISOWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

export function getWeekYear(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  return d.getFullYear()
}

export function getMondayOfWeek(isoWeek, year) {
  const jan4 = new Date(year, 0, 4)
  const dow = jan4.getDay() || 7
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - (dow - 1) + (isoWeek - 1) * 7)
  return monday
}

export function getWeekDates(mondayDate) {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(mondayDate)
    d.setDate(mondayDate.getDate() + i)
    return d
  })
}

export function formatDate(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export function formatDateFull(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function getWeekKeys(offset) {
  const today = new Date()
  const curDate = new Date(today)
  curDate.setDate(today.getDate() + offset * 7)
  const curWk = getISOWeek(curDate)
  const curYr = getWeekYear(curDate)

  const prevDate = new Date(curDate)
  prevDate.setDate(curDate.getDate() - 7)
  const prevWk = getISOWeek(prevDate)
  const prevYr = getWeekYear(prevDate)

  return {
    current: `${curYr}_W${String(curWk).padStart(2, '0')}`,
    prev: `${prevYr}_W${String(prevWk).padStart(2, '0')}`,
    currentWk: curWk,
    prevWk: prevWk,
    currentYear: curYr,
    prevYear: prevYr,
    currentMonday: getMondayOfWeek(curWk, curYr),
    prevMonday: getMondayOfWeek(prevWk, prevYr),
  }
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}
