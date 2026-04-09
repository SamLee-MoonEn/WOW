import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const membersRef  = doc(db, 'wow', 'members')
const settingsRef = doc(db, 'wow', 'settings')
const taskRef = (memberId) => doc(db, 'wow', `tasks_${memberId}`)

export function subscribeMembers(callback, onError) {
  return onSnapshot(
    membersRef,
    (snap) => {
      const members = snap.exists() ? snap.data().members ?? [] : null
      if (members && members.length > 0) _lastKnownMemberCount = members.length
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

let _lastKnownMemberCount = 0

export function saveMembers(members) {
  // 기존에 멤버가 있었는데 빈 배열로 덮어쓰기 방지
  if (members.length === 0 && _lastKnownMemberCount > 0) {
    console.warn('[Firestore] 멤버 데이터 전체 삭제 시도 차단 (기존 멤버 수:', _lastKnownMemberCount, ')')
    return
  }
  _lastKnownMemberCount = Math.max(_lastKnownMemberCount, members.length)
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

  // 멤버 복원
  _lastKnownMemberCount = data.members.length
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
