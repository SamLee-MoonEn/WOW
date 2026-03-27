import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const membersRef  = doc(db, 'wow', 'members')
const settingsRef = doc(db, 'wow', 'settings')
const taskRef = (memberId) => doc(db, 'wow', `tasks_${memberId}`)

export function subscribeMembers(callback, onError) {
  return onSnapshot(
    membersRef,
    (snap) => callback(snap.exists() ? snap.data().members ?? [] : null),
    (err) => {
      console.error('[Firestore] members 구독 실패:', err.code, err.message)
      if (onError) onError(err)
    }
  )
}

export function subscribeMemberTasks(memberId, callback) {
  return onSnapshot(
    taskRef(memberId),
    (snap) => callback(snap.exists() ? snap.data() : {}),
    (err) => console.error('[Firestore] tasks 구독 실패:', memberId, err.code)
  )
}

export function saveMembers(members) {
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
