import { useState, useCallback } from 'react'
import { loadState, saveState } from '../utils/storage'
import { uid, getWeekKeys } from '../utils/weekUtils'
import { nextStatus } from '../utils/statusUtils'

function createDefaultState() {
  const wk = getWeekKeys(0)
  const tasks = {}
  tasks[`m1_${wk.current}_0`] = [
    { id: uid(), text: '주간 보고 마감', status: 'done', style: '', dividerBefore: false },
    { id: uid(), text: '기획안 Review', status: 'done', style: 'bold', dividerBefore: false },
  ]
  tasks[`m1_${wk.current}_carryover`] = [
    { id: uid(), text: '차주 이월 업무 정리', status: 'progress', style: 'blue-text', date: '' },
  ]
  return {
    baseWeekOffset: 0,
    members: [
      { id: 'm1', name: '홍길동', rank: '차장', emoji: '🚹' },
      { id: 'm2', name: '김철수', rank: '과장', emoji: '🚹' },
    ],
    tasks,
  }
}

export function useWOWState() {
  const [state, setStateRaw] = useState(() => loadState() || createDefaultState())

  const setState = useCallback((updater) => {
    setStateRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveState(next)
      return next
    })
  }, [])

  const shiftWeeks = useCallback((delta) => {
    setState(s => ({ ...s, baseWeekOffset: s.baseWeekOffset + delta }))
  }, [setState])

  const goToCurrentWeek = useCallback(() => {
    setState(s => ({ ...s, baseWeekOffset: 0 }))
  }, [setState])

  const addTask = useCallback((key, data) => {
    setState(s => ({
      ...s,
      tasks: { ...s.tasks, [key]: [...(s.tasks[key] || []), { id: uid(), ...data }] },
    }))
  }, [setState])

  const updateTask = useCallback((key, taskId, data) => {
    setState(s => ({
      ...s,
      tasks: {
        ...s.tasks,
        [key]: (s.tasks[key] || []).map(t => t.id === taskId ? { ...t, ...data } : t),
      },
    }))
  }, [setState])

  const deleteTask = useCallback((key, taskId) => {
    setState(s => ({
      ...s,
      tasks: {
        ...s.tasks,
        [key]: (s.tasks[key] || []).filter(t => t.id !== taskId),
      },
    }))
  }, [setState])

  const cycleStatus = useCallback((key, taskId) => {
    setState(s => ({
      ...s,
      tasks: {
        ...s.tasks,
        [key]: (s.tasks[key] || []).map(t =>
          t.id === taskId ? { ...t, status: nextStatus(t.status) } : t
        ),
      },
    }))
  }, [setState])

  const addMember = useCallback((data) => {
    setState(s => ({ ...s, members: [...s.members, { id: uid(), ...data }] }))
  }, [setState])

  const updateMember = useCallback((memberId, data) => {
    setState(s => ({
      ...s,
      members: s.members.map(m => m.id === memberId ? { ...m, ...data } : m),
    }))
  }, [setState])

  const updatePresence = useCallback((memberId, presence) => {
    setState(s => ({
      ...s,
      members: s.members.map(m => m.id === memberId ? { ...m, presence } : m),
    }))
  }, [setState])

  const deleteMember = useCallback((memberId) => {
    setState(s => {
      const tasks = { ...s.tasks }
      Object.keys(tasks).forEach(k => { if (k.startsWith(memberId + '_')) delete tasks[k] })
      return { ...s, members: s.members.filter(m => m.id !== memberId), tasks }
    })
  }, [setState])

  const moveTask = useCallback((fromKey, toKey, taskId, insertBeforeId = null) => {
    setState(s => {
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
  }, [setState])

  return { state, shiftWeeks, goToCurrentWeek, addTask, updateTask, deleteTask, cycleStatus, addMember, updateMember, deleteMember, moveTask, updatePresence }
}
