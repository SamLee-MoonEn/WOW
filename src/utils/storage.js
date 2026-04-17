import { doc, getDoc, onSnapshot, setDoc, runTransaction } from 'firebase/firestore'
import { db } from '../lib/firebase'

const membersRef  = doc(db, 'wow', 'members')
const settingsRef = doc(db, 'wow', 'settings')
const taskRef = (memberId) => doc(db, 'wow', `tasks_${memberId}`)

export function subscribeMembers(callback, onError) {
  return onSnapshot(
    membersRef,
    (snap) => {
      const members = snap.exists() ? snap.data().members ?? [] : null
      if (members && members.length > 0) {
        setKnownMemberCount(Math.max(getKnownMemberCount(), members.length))
      }
      return callback(members)
    },
    (err) => {
      console.error('[Firestore] members 구독 실패:', err.code, err.message)
      if (onError) onError(err)
    }
  )
}

export function subscribeMemberTasks(memberId, callback) {
  return onSnapshot(
    taskRef(memberId),
    (snap) => callback(snap.exists() ? (snap.data() || {}) : {}),
    (err) => console.error('[Firestore] tasks 구독 실패:', memberId, err.code)
  )
}

const LS_MEMBER_COUNT_KEY = 'wow_known_member_count'

function getKnownMemberCount() {
  try { return parseInt(localStorage.getItem(LS_MEMBER_COUNT_KEY)) || 0 } catch { return 0 }
}
function setKnownMemberCount(n) {
  try { localStorage.setItem(LS_MEMBER_COUNT_KEY, String(n)) } catch {}
}

/**
 * 멤버 데이터를 안전하게 저장 (Firestore 트랜잭션 사용)
 * @param {Function} updater - (currentMembers) => newMembers 형태의 변환 함수
 * @param {object} opts - { force: boolean }
 * @returns {Promise<Array>} 저장된 최종 멤버 배열
 */
export async function saveMembersWithTransaction(updater, { force = false } = {}) {
  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(membersRef)
    const current = snap.exists() ? snap.data().members ?? [] : []
    const next = updater(current)

    const known = getKnownMemberCount()
    if (!force && known >= 2 && next.length < known * 0.5) {
      throw new Error(`[Firestore] 멤버 데이터 대량 삭제 시도 차단 (기존: ${known} → 시도: ${next.length})`)
    }
    if (next.length > 0) setKnownMemberCount(Math.max(known, next.length))

    transaction.set(membersRef, { members: next })
    return next
  })
}

/** 하위호환용 — 단순 덮어쓰기 (백업 복원 등 force 용도) */
export function saveMembers(members, { force = false } = {}) {
  const known = getKnownMemberCount()
  if (!force && known >= 2 && members.length < known * 0.5) {
    console.warn('[Firestore] 멤버 데이터 대량 삭제 시도 차단 (기존:', known, '→ 시도:', members.length, ')')
    return
  }
  if (members.length > 0) setKnownMemberCount(Math.max(known, members.length))
  setDoc(membersRef, { members })
}

export function subscribeSettings(callback) {
  return onSnapshot(
    settingsRef,
    (snap) => callback(snap.exists() ? snap.data() : {}),
    (err) => console.error('[Firestore] settings 구독 실패:', err.code)
  )
}

export function saveSettings(settings) {
  return setDoc(settingsRef, settings)
}

// shortKeyTasks: memberId prefix 없는 키 맵
// e.g. { "2026_W11_0": [...], "2026_W11_carryover": [...] }
export function saveMemberTasks(memberId, shortKeyTasks) {
  setDoc(taskRef(memberId), shortKeyTasks)
}

// ── LocalStorage 자동 백업 ────────────────────────────────────────────

const LS_BACKUP_KEY = 'wow_auto_backup'
const LS_BACKUP_PREV_KEY = 'wow_auto_backup_prev'

export function autoBackupToLocal(members, tasks, settings) {
  if (!members || members.length === 0) return
  try {
    // 기존 백업을 이전 백업으로 이동 (2세대 보관)
    const existing = localStorage.getItem(LS_BACKUP_KEY)
    if (existing) localStorage.setItem(LS_BACKUP_PREV_KEY, existing)

    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      members,
      settings,
      tasks,
    }
    localStorage.setItem(LS_BACKUP_KEY, JSON.stringify(data))
  } catch { /* localStorage 용량 초과 등 무시 */ }
}

export function getLocalBackup() {
  try {
    const raw = localStorage.getItem(LS_BACKUP_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function getPrevLocalBackup() {
  try {
    const raw = localStorage.getItem(LS_BACKUP_PREV_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

// ── 백업/복원 ────────────────────────────────────────────────────────

export async function exportBackup() {
  const membersSnap = await getDoc(membersRef)
  const settingsSnap = await getDoc(settingsRef)

  const members = membersSnap.exists() ? membersSnap.data().members ?? [] : []
  const settings = settingsSnap.exists() ? settingsSnap.data() : {}

  const tasks = {}
  for (const m of members) {
    const snap = await getDoc(taskRef(m.id))
    if (snap.exists()) tasks[m.id] = snap.data()
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    members,
    settings,
    tasks,
  }
}

export async function importBackup(data) {
  if (!data?.members || !Array.isArray(data.members)) {
    throw new Error('유효하지 않은 백업 파일입니다.')
  }

  // 멤버 복원 (가드 우회)
  setKnownMemberCount(data.members.length)
  await setDoc(membersRef, { members: data.members })

  // 설정 복원
  if (data.settings && Object.keys(data.settings).length > 0) {
    await setDoc(settingsRef, data.settings)
  }

  // 태스크 복원
  if (data.tasks) {
    for (const [memberId, taskData] of Object.entries(data.tasks)) {
      await setDoc(taskRef(memberId), taskData)
    }
  }
}
