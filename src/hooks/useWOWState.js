import { useState, useCallback, useEffect } from 'react'
import { subscribeState, saveState } from '../utils/storage'
import { uid, getWeekKeys } from '../utils/weekUtils'
import { nextStatus } from '../utils/statusUtils'

const DEFAULT_SHARED = { members: [], tasks: {} }

export function useWOWState() {
  // baseWeekOffset은 화면 탐색용 로컬 상태 (Firestore에 저장 안 함)
  const [baseWeekOffset, setBaseWeekOffset] = useState(0)
  const [shared, setSharedRaw] = useState(DEFAULT_SHARED)
  const [loading, setLoading] = useState(true)

  // Firestore 실시간 구독
  useEffect(() => {
    const unsub = subscribeState((data) => {
      if (data) {
        setSharedRaw({ members: data.members ?? [], tasks: data.tasks ?? {} })
      } else {
        // 최초 실행: 빈 상태로 Firestore 문서 생성
        saveState(DEFAULT_SHARED)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // 외부에서 사용하는 state (로컬 + Firestore 합산)
  const state = { baseWeekOffset, ...shared }

  // shared 상태 변경 + Firestore 저장
  const setShared = useCallback((updater) => {
    setSharedRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveState(next)
      return next
    })
  }, [])

  // ── 주간 탐색 (로컬) ──────────────────────────────────────────────
  const shiftWeeks = useCallback((delta) => {
    setBaseWeekOffset(o => o + delta)
  }, [])

  const goToCurrentWeek = useCallback(() => {
    setBaseWeekOffset(0)
  }, [])

  // ── Tasks ─────────────────────────────────────────────────────────
  const addTask = useCallback((key, data) => {
    setShared(s => ({
      ...s,
      tasks: { ...s.tasks, [key]: [...(s.tasks[key] || []), { id: uid(), ...data }] },
    }))
  }, [setShared])

  const updateTask = useCallback((key, taskId, data) => {
    setShared(s => ({
      ...s,
      tasks: {
        ...s.tasks,
        [key]: (s.tasks[key] || []).map(t => t.id === taskId ? { ...t, ...data } : t),
      },
    }))
  }, [setShared])

  const deleteTask = useCallback((key, taskId) => {
    setShared(s => ({
      ...s,
      tasks: {
        ...s.tasks,
        [key]: (s.tasks[key] || []).filter(t => t.id !== taskId),
      },
    }))
  }, [setShared])

  const cycleStatus = useCallback((key, taskId) => {
    setShared(s => ({
      ...s,
      tasks: {
        ...s.tasks,
        [key]: (s.tasks[key] || []).map(t =>
          t.id === taskId ? { ...t, status: nextStatus(t.status) } : t
        ),
      },
    }))
  }, [setShared])

  const moveTask = useCallback((fromKey, toKey, taskId, insertBeforeId = null) => {
    setShared(s => {
      const task = (s.tasks[fromKey] || []).find(t => t.id === taskId)
      if (!task) return s
      const fromList = (s.tasks[fromKey] || []).filter(t => t.id !== taskId)
      let toList = fromKey === toKey
        ? [...fromList]
        : (s.tasks[toKey] || []).filter(t => t.id !== taskId)
      if (insertBeforeId) {
        const idx = toList.findIndex(t => t.id === insertBeforeId)
        toList.splice(idx >= 0 ? idx : toList.length, 0, task)
      } else {
        toList.push(task)
      }
      return { ...s, tasks: { ...s.tasks, [fromKey]: fromList, [toKey]: toList } }
    })
  }, [setShared])

  // ── Members ───────────────────────────────────────────────────────
  const addMember = useCallback((data) => {
    setShared(s => ({ ...s, members: [...s.members, { id: uid(), ...data }] }))
  }, [setShared])

  const updateMember = useCallback((memberId, data) => {
    setShared(s => ({
      ...s,
      members: s.members.map(m => m.id === memberId ? { ...m, ...data } : m),
    }))
  }, [setShared])

  const updatePresence = useCallback((memberId, presence) => {
    setShared(s => ({
      ...s,
      members: s.members.map(m => m.id === memberId ? { ...m, presence } : m),
    }))
  }, [setShared])

  const deleteMember = useCallback((memberId) => {
    setShared(s => {
      const tasks = { ...s.tasks }
      Object.keys(tasks).forEach(k => { if (k.startsWith(memberId + '_')) delete tasks[k] })
      return { ...s, members: s.members.filter(m => m.id !== memberId), tasks }
    })
  }, [setShared])

  return {
    state,
    loading,
    shiftWeeks,
    goToCurrentWeek,
    addTask,
    updateTask,
    deleteTask,
    cycleStatus,
    addMember,
    updateMember,
    deleteMember,
    moveTask,
    updatePresence,
  }
}
