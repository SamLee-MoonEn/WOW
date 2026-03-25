import { useState, useCallback, useEffect, useRef } from 'react'
import {
  subscribeMembers,
  subscribeMemberTasks,
  saveMembers,
  saveMemberTasks,
} from '../utils/storage'
import { uid } from '../utils/weekUtils'
import { nextStatus } from '../utils/statusUtils'

// 전체 tasks 맵에서 특정 멤버의 tasks를 short key(prefix 없음)로 추출
function extractMemberTasks(memberId, allTasks) {
  const prefix = memberId + '_'
  const result = {}
  for (const [key, val] of Object.entries(allTasks)) {
    if (key.startsWith(prefix)) result[key.slice(prefix.length)] = val
  }
  return result
}

// key의 첫 '_' 이전이 memberId
function memberIdFromKey(key) {
  return key.slice(0, key.indexOf('_'))
}

export function useWOWState() {
  const [baseWeekOffset, setBaseWeekOffset] = useState(0)
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState({})
  const [loading, setLoading] = useState(true)
  const [fsError, setFsError] = useState(null)

  // 멤버별 tasks 구독 해제 함수 보관
  const taskUnsubsRef = useRef({})

  // ── 멤버 구독 ──────────────────────────────────────────────────────
  useEffect(() => {
    return subscribeMembers(
      (data) => {
        if (data !== null) {
          setMembers(data)
        } else {
          // 최초 실행: 빈 멤버 문서 생성
          saveMembers([])
        }
        setLoading(false)
      },
      (err) => {
        setFsError(err.code || err.message)
        setLoading(false)
      }
    )
  }, [])

  // ── 멤버별 tasks 구독 (멤버 목록 변경 시 동기화) ───────────────────
  useEffect(() => {
    const currentIds = new Set(members.map((m) => m.id))

    // 제거된 멤버 구독 해제 + tasks 삭제
    for (const [id, unsub] of Object.entries(taskUnsubsRef.current)) {
      if (!currentIds.has(id)) {
        unsub()
        delete taskUnsubsRef.current[id]
        setTasks((prev) => {
          const next = { ...prev }
          for (const k of Object.keys(next)) {
            if (k.startsWith(id + '_')) delete next[k]
          }
          return next
        })
      }
    }

    // 새 멤버 구독 추가
    for (const member of members) {
      if (taskUnsubsRef.current[member.id]) continue
      taskUnsubsRef.current[member.id] = subscribeMemberTasks(
        member.id,
        (shortKeyTasks) => {
          setTasks((prev) => {
            const next = { ...prev }
            // 이 멤버의 기존 키 제거
            for (const k of Object.keys(next)) {
              if (k.startsWith(member.id + '_')) delete next[k]
            }
            // short key → full key로 복원
            for (const [k, v] of Object.entries(shortKeyTasks)) {
              next[`${member.id}_${k}`] = v
            }
            return next
          })
        }
      )
    }
  }, [members])

  // 언마운트 시 전체 구독 해제
  useEffect(() => {
    return () => Object.values(taskUnsubsRef.current).forEach((u) => u())
  }, [])

  // ── 외부에 노출하는 state ──────────────────────────────────────────
  const state = { baseWeekOffset, members, tasks }

  // 특정 멤버의 tasks를 Firestore에 저장
  const persistTasks = useCallback((memberId, newAllTasks) => {
    saveMemberTasks(memberId, extractMemberTasks(memberId, newAllTasks))
  }, [])

  // ── 주간 탐색 (로컬) ──────────────────────────────────────────────
  const shiftWeeks = useCallback((delta) => setBaseWeekOffset((o) => o + delta), [])
  const goToCurrentWeek = useCallback(() => setBaseWeekOffset(0), [])

  // ── Tasks ─────────────────────────────────────────────────────────
  const addTask = useCallback((key, data) => {
    const memberId = memberIdFromKey(key)
    setTasks((prev) => {
      const next = { ...prev, [key]: [...(prev[key] || []), { id: uid(), ...data }] }
      persistTasks(memberId, next)
      return next
    })
  }, [persistTasks])

  const updateTask = useCallback((key, taskId, data) => {
    const memberId = memberIdFromKey(key)
    setTasks((prev) => {
      const next = {
        ...prev,
        [key]: (prev[key] || []).map((t) => (t.id === taskId ? { ...t, ...data } : t)),
      }
      persistTasks(memberId, next)
      return next
    })
  }, [persistTasks])

  const deleteTask = useCallback((key, taskId) => {
    const memberId = memberIdFromKey(key)
    setTasks((prev) => {
      const next = { ...prev, [key]: (prev[key] || []).filter((t) => t.id !== taskId) }
      persistTasks(memberId, next)
      return next
    })
  }, [persistTasks])

  const cycleStatus = useCallback((key, taskId) => {
    const memberId = memberIdFromKey(key)
    setTasks((prev) => {
      const next = {
        ...prev,
        [key]: (prev[key] || []).map((t) =>
          t.id === taskId ? { ...t, status: nextStatus(t.status) } : t
        ),
      }
      persistTasks(memberId, next)
      return next
    })
  }, [persistTasks])

  const copyTask = useCallback((fromKey, toKey, taskId) => {
    const toMemberId = memberIdFromKey(toKey)
    setTasks((prev) => {
      const task = (prev[fromKey] || []).find(t => t.id === taskId)
      if (!task) return prev
      const newTask = { ...task, id: uid() }
      const toList = [...(prev[toKey] || []), newTask]
      const next = { ...prev, [toKey]: toList }
      persistTasks(toMemberId, next)
      return next
    })
  }, [persistTasks])

  const moveTask = useCallback((fromKey, toKey, taskId, insertBeforeId = null) => {
    const fromMemberId = memberIdFromKey(fromKey)
    const toMemberId = memberIdFromKey(toKey)
    setTasks((prev) => {
      const task = (prev[fromKey] || []).find((t) => t.id === taskId)
      if (!task) return prev
      const fromList = (prev[fromKey] || []).filter((t) => t.id !== taskId)
      let toList =
        fromKey === toKey ? [...fromList] : (prev[toKey] || []).filter((t) => t.id !== taskId)
      if (insertBeforeId) {
        const idx = toList.findIndex((t) => t.id === insertBeforeId)
        toList.splice(idx >= 0 ? idx : toList.length, 0, task)
      } else {
        toList.push(task)
      }
      const next = { ...prev, [fromKey]: fromList, [toKey]: toList }
      persistTasks(fromMemberId, next)
      if (fromMemberId !== toMemberId) persistTasks(toMemberId, next)
      return next
    })
  }, [persistTasks])

  // ── Members ───────────────────────────────────────────────────────
  const addMember = useCallback((data) => {
    setMembers((prev) => {
      const next = [...prev, { id: uid(), ...data }]
      saveMembers(next)
      return next
    })
  }, [])

  const updateMember = useCallback((memberId, data) => {
    setMembers((prev) => {
      const next = prev.map((m) => (m.id === memberId ? { ...m, ...data } : m))
      saveMembers(next)
      return next
    })
  }, [])

  const updatePresence = useCallback((memberId, presence, extra = {}) => {
    setMembers((prev) => {
      const base = presence === 'off' ? { offAt: Date.now() } : { offAt: null }
      if (presence !== 'vacation') base.vacationEnd = null
      const next = prev.map((m) => (m.id === memberId ? { ...m, presence, ...base, ...extra } : m))
      saveMembers(next)
      return next
    })
  }, [])

  const reorderMembers = useCallback((orderedIds) => {
    setMembers((prev) => {
      const idMap = new Map(prev.map(m => [m.id, m]))
      const inOrder = orderedIds.map(id => idMap.get(id)).filter(Boolean)
      const inOrderSet = new Set(orderedIds)
      const rest = prev.filter(m => !inOrderSet.has(m.id))
      const next = [...inOrder, ...rest]
      saveMembers(next)
      return next
    })
  }, [])

  const deleteMember = useCallback((memberId) => {
    setMembers((prev) => {
      const next = prev.filter((m) => m.id !== memberId)
      saveMembers(next)
      return next
    })
    setTasks((prev) => {
      const next = { ...prev }
      for (const k of Object.keys(next)) {
        if (k.startsWith(memberId + '_')) delete next[k]
      }
      return next
    })
  }, [])

  const updateWorkDesc = useCallback((memberId, desc) => {
    setMembers((prev) => {
      const next = prev.map((m) => (m.id === memberId ? { ...m, workDesc: desc } : m))
      saveMembers(next)
      return next
    })
  }, [])

  return {
    state,
    loading,
    fsError,
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
    copyTask,
    updatePresence,
    reorderMembers,
    updateWorkDesc,
  }
}
