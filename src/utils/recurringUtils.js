import { getMondayOfWeek } from './weekUtils'

// key 예: "abc_2026_W23_2" → { memberId: "abc", year: 2026, week: 23, dayIndex: 2 }
// carryover/잘못된 형식이면 null
export function parseDayKey(key) {
  if (!key) return null
  const m = key.match(/^([^_]+)_(\d{4})_W(\d{2})_(\d)$/)
  if (!m) return null
  return {
    memberId: m[1],
    year: parseInt(m[2], 10),
    week: parseInt(m[3], 10),
    dayIndex: parseInt(m[4], 10),
  }
}

// key → 해당 날짜 (월=0 … 일=6)
export function keyToDate(key) {
  const p = parseDayKey(key)
  if (!p) return null
  const monday = getMondayOfWeek(p.week, p.year)
  const d = new Date(monday)
  d.setDate(monday.getDate() + p.dayIndex)
  d.setHours(0, 0, 0, 0)
  return d
}

// 반복 그룹 후보로 인정 가능한 task인지 (carryover/divider 제외)
function isGroupCandidate(task, key) {
  if (!task) return false
  if (task.type === 'divider') return false
  if (!parseDayKey(key)) return false
  return true
}

// 같은 그룹의 task들을 찾는다.
// - recurringId가 있으면 그것으로 정확 매칭
// - 없으면 같은 멤버 + text + style + memo 모두 일치하는 task들로 fallback 매칭
//   (단, 한쪽이라도 recurringId를 가지면 다른 그룹으로 간주)
// 반환: { matches: [{ key, taskId, date }], isFallback: boolean, anchor: task }
export function findRecurringGroup(allTasks, key, taskId) {
  const anchor = (allTasks[key] || []).find((t) => t.id === taskId)
  if (!anchor || !isGroupCandidate(anchor, key)) {
    return { matches: [], isFallback: false, anchor: null }
  }
  const anchorParsed = parseDayKey(key)
  const memberPrefix = anchorParsed.memberId + '_'

  const matches = []
  const useRid = !!anchor.recurringId

  for (const [k, list] of Object.entries(allTasks)) {
    if (!k.startsWith(memberPrefix)) continue
    if (!parseDayKey(k)) continue
    for (const t of list || []) {
      if (!isGroupCandidate(t, k)) continue
      if (useRid) {
        if (t.recurringId !== anchor.recurringId) continue
      } else {
        if (t.recurringId) continue
        if ((t.text || '') !== (anchor.text || '')) continue
        if ((t.style || '') !== (anchor.style || '')) continue
        if ((t.memo || '') !== (anchor.memo || '')) continue
      }
      matches.push({ key: k, taskId: t.id, date: keyToDate(k) })
    }
  }

  matches.sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))
  return { matches, isFallback: !useRid, anchor }
}

// 오늘(자정 기준) 이상인 항목과 미만(과거)인 항목으로 분할
export function splitByToday(matches, today = new Date()) {
  const t = new Date(today)
  t.setHours(0, 0, 0, 0)
  const past = []
  const fromToday = []
  for (const m of matches) {
    if (!m.date) { past.push(m); continue }
    if (m.date.getTime() >= t.getTime()) fromToday.push(m)
    else past.push(m)
  }
  return { past, fromToday }
}
