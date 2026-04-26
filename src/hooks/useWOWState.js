import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import {
  subscribeMembers,
  subscribeMemberTasks,
  saveMembers,
  saveMembersWithTransaction,
  saveMemberTasks,
  subscribeSettings,
  saveSettings,
  autoBackupToLocal,
} from '../utils/storage'
import { uid } from '../utils/weekUtils'
import { isWorkday } from '../utils/holidays'
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

// task 배열의 내용 비교 (Firestore 에코 감지용)
function taskArraysEqual(a, b) {
  if (a === b) return true
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const ta = a[i], tb = b[i]
    if (ta.id !== tb.id) return false
    // 모든 직렬화된 필드를 비교 (id가 같으면 대부분 같지만 status/text 등이 변경 가능)
    const ka = Object.keys(ta), kb = Object.keys(tb)
    if (ka.length !== kb.length) return false
    for (const k of ka) {
      if (ta[k] !== tb[k]) return false
    }
  }
  return true
}

export function useWOWState() {
  const [baseWeekOffset, setBaseWeekOffset] = useState(0)
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState({})
  const [settings, setSettings] = useState({})
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
        }
        // data가 null이면 문서 미존재 → 첫 멤버 추가 시 자동 생성됨
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
          if (!shortKeyTasks) return
          setTasks((prev) => {
            const prefix = member.id + '_'
            const newEntries = {}
            for (const [k, v] of Object.entries(shortKeyTasks)) {
              newEntries[`${prefix}${k}`] = v
            }
            // deep compare: Firestore 에코(방금 쓴 데이터가 돌아옴)를 감지하여 skip
            const prevKeys = Object.keys(prev).filter(k => k.startsWith(prefix))
            const newKeys = Object.keys(newEntries)
            if (prevKeys.length === newKeys.length) {
              let same = true
              for (const k of prevKeys) {
                if (!newEntries[k] || !taskArraysEqual(prev[k], newEntries[k])) {
                  same = false
                  break
                }
              }
              if (same) return prev
            }
            const next = {}
            for (const [k, v] of Object.entries(prev)) {
              if (!k.startsWith(prefix)) next[k] = v
            }
            for (const [k, v] of Object.entries(newEntries)) {
              next[k] = v
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

  // ── 설정 구독 ──────────────────────────────────────────────────────
  useEffect(() => {
    return subscribeSettings((data) => setSettings(data))
  }, [])

  // ── 앱 로드 시 LocalStorage 자동 백업 ─────────────────────────────
  const autoBackupDoneRef = useRef(false)
  useEffect(() => {
    if (loading || members.length === 0 || autoBackupDoneRef.current) return
    autoBackupDoneRef.current = true
    // tasks를 멤버별로 분리하여 백업
    const tasksByMember = {}
    for (const m of members) {
      const prefix = m.id + '_'
      const memberTasks = {}
      for (const [k, v] of Object.entries(tasks)) {
        if (k.startsWith(prefix)) memberTasks[k.slice(prefix.length)] = v
      }
      if (Object.keys(memberTasks).length > 0) tasksByMember[m.id] = memberTasks
    }
    autoBackupToLocal(members, tasksByMember, settings)
  }, [loading, members, tasks, settings])

  // ── 매일 오전 9시 자동 상태 리셋 ───────────────────────────────────
  const dailyResetDoneRef = useRef(null)

  useEffect(() => {
    if (members.length === 0) return

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    if (dailyResetDoneRef.current === today) return
    if (now.getHours() < 9) return // 9시 이전에는 리셋하지 않음
    const resetMapper = (m) => {
      const p = m.presence || 'working'
      if (!isWorkday(now)) {
        // 주말/공휴일: 휴가 종료일 체크만
        if (p === 'vacation' && m.vacationEnd && m.vacationEnd < today) {
          return { ...m, presence: 'working', vacationEnd: null }
        }
        return m
      }
      if (p === 'off') return { ...m, presence: 'working', offAt: null }
      if (p === 'vacation' && m.vacationEnd && m.vacationEnd < today) {
        return { ...m, presence: 'working', vacationEnd: null }
      }
      return m
    }

    // 로컬 상태로 변경 필요 여부 먼저 확인
    const localNext = members.map(resetMapper)
    const changed = localNext.some((m, i) => m !== members[i])

    dailyResetDoneRef.current = today
    if (changed) {
      setMembers(localNext)
      // 트랜잭션으로 Firestore 최신 데이터 기반 업데이트
      saveMembersWithTransaction((current) => current.map(resetMapper))
    }
  }, [members])

  // 9시 이전 진입 시 9시에 리셋 실행하도록 타이머 설정
  useEffect(() => {
    const now = new Date()
    if (now.getHours() >= 9) return

    const nineAm = new Date(now)
    nineAm.setHours(9, 0, 0, 0)
    const delay = nineAm.getTime() - now.getTime()

    const timer = setTimeout(() => {
      dailyResetDoneRef.current = null
      setMembers(prev => [...prev])
    }, delay)

    return () => clearTimeout(timer)
  }, [])

  // ── 외부에 노출하는 state ──────────────────────────────────────────
  const state = useMemo(() => ({ baseWeekOffset, members, tasks, settings }), [baseWeekOffset, members, tasks, settings])

  // 특정 멤버의 tasks를 Firestore에 저장 (비동기, 항상 최신 state 기반)
  const deferPersist = useCallback((memberId, nextState) => {
    setTimeout(() => saveMemberTasks(memberId, extractMemberTasks(memberId, nextState)), 0)
  }, [])

  // ── 주간 탐색 (로컬) ──────────────────────────────────────────────
  const shiftWeeks = useCallback((delta) => setBaseWeekOffset((o) => o + delta), [])
  const goToCurrentWeek = useCallback(() => setBaseWeekOffset(0), [])

  // ── Tasks ─────────────────────────────────────────────────────────
  const addTask = useCallback((key, data) => {
    const memberId = memberIdFromKey(key)
    setTasks((prev) => {
      const next = { ...prev, [key]: [...(prev[key] || []), { id: uid(), ...data }] }
      deferPersist(memberId, next)
      return next
    })
  }, [deferPersist])

  const updateTask = useCallback((key, taskId, data) => {
    const memberId = memberIdFromKey(key)
    setTasks((prev) => {
      const next = {
        ...prev,
        [key]: (prev[key] || []).map((t) => (t.id === taskId ? { ...t, ...data } : t)),
      }
      deferPersist(memberId, next)
      return next
    })
  }, [deferPersist])

  const deleteTask = useCallback((key, taskId) => {
    const memberId = memberIdFromKey(key)
    setTasks((prev) => {
      const next = { ...prev, [key]: (prev[key] || []).filter((t) => t.id !== taskId) }
      deferPersist(memberId, next)
      return next
    })
  }, [deferPersist])

  const clearDay = useCallback((key) => {
    const memberId = memberIdFromKey(key)
    setTasks((prev) => {
      const next = { ...prev, [key]: [] }
      deferPersist(memberId, next)
      return next
    })
  }, [deferPersist])

  const cycleStatus = useCallback((key, taskId) => {
    const memberId = memberIdFromKey(key)
    setTasks((prev) => {
      const next = {
        ...prev,
        [key]: (prev[key] || []).map((t) =>
          t.id === taskId ? { ...t, status: nextStatus(t.status) } : t
        ),
      }
      deferPersist(memberId, next)
      return next
    })
  }, [deferPersist])

  const copyTask = useCallback((fromKey, toKey, taskId) => {
    const toMemberId = memberIdFromKey(toKey)
    setTasks((prev) => {
      const task = (prev[fromKey] || []).find(t => t.id === taskId)
      if (!task) return prev
      const newTask = { ...task, id: uid() }
      const toList = [...(prev[toKey] || []), newTask]
      const next = { ...prev, [toKey]: toList }
      deferPersist(toMemberId, next)
      return next
    })
  }, [deferPersist])

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
      deferPersist(fromMemberId, next)
      if (fromMemberId !== toMemberId) deferPersist(toMemberId, next)
      return next
    })
  }, [deferPersist])

  // ── Members (트랜잭션 기반 — Firestore 최신 데이터에서 수정) ─────
  const addMember = useCallback((data) => {
    const newMember = { id: uid(), ...data }
    setMembers((prev) => [...prev, newMember])
    saveMembersWithTransaction((current) => [...current, newMember])
  }, [])

  const updateMember = useCallback((memberId, data) => {
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, ...data } : m)))
    saveMembersWithTransaction((current) =>
      current.map((m) => (m.id === memberId ? { ...m, ...data } : m))
    )
  }, [])

  const updatePresence = useCallback((memberId, presence, extra = {}) => {
    const base = presence === 'off' ? { offAt: Date.now() } : { offAt: null }
    if (presence !== 'vacation') base.vacationEnd = null
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, presence, ...base, ...extra } : m)))
    saveMembersWithTransaction((current) =>
      current.map((m) => (m.id === memberId ? { ...m, presence, ...base, ...extra } : m))
    )
  }, [])

  const reorderMembers = useCallback((orderedIds) => {
    const reorder = (list) => {
      const idMap = new Map(list.map(m => [m.id, m]))
      const inOrder = orderedIds.map(id => idMap.get(id)).filter(Boolean)
      const inOrderSet = new Set(orderedIds)
      const rest = list.filter(m => !inOrderSet.has(m.id))
      return [...inOrder, ...rest]
    }
    setMembers((prev) => reorder(prev))
    saveMembersWithTransaction((current) => reorder(current))
  }, [])

  const deleteMember = useCallback((memberId) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
    saveMembersWithTransaction((current) => current.filter((m) => m.id !== memberId))
    setTasks((prev) => {
      const next = { ...prev }
      for (const k of Object.keys(next)) {
        if (k.startsWith(memberId + '_')) delete next[k]
      }
      return next
    })
  }, [])

  const updateMemberTags = useCallback((memberId, tags) => {
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, tags } : m)))
    saveMembersWithTransaction((current) =>
      current.map((m) => (m.id === memberId ? { ...m, tags } : m))
    )
  }, [])

  const updateWorkDesc = useCallback((memberId, desc) => {
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, workDesc: desc } : m)))
    saveMembersWithTransaction((current) =>
      current.map((m) => (m.id === memberId ? { ...m, workDesc: desc } : m))
    )
  }, [])

  const updateSettings = useCallback((data) => {
    setSettings(data)
    saveSettings(data)
  }, [])

  return {
    state,
    loading,
    fsError,
    updateSettings,
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
    clearDay,
    updatePresence,
    reorderMembers,
    updateWorkDesc,
    updateMemberTags,
  }
}
