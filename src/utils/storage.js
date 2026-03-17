import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const STATE_REF = doc(db, 'wow', 'state')

/**
 * Firestore 실시간 구독. 변경 시 callback(data) 호출.
 * data가 null이면 문서가 없는 상태 (최초 실행).
 * 반환값은 unsubscribe 함수.
 */
export function subscribeState(callback) {
  return onSnapshot(STATE_REF, (snap) => {
    callback(snap.exists() ? snap.data() : null)
  })
}

/**
 * Firestore에 상태 저장 (members, tasks만 — baseWeekOffset은 제외)
 */
export function saveState({ members, tasks }) {
  setDoc(STATE_REF, { members, tasks })
}
