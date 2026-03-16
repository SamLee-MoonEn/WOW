import { useState, useCallback } from 'react'
import { loadState, saveState } from '../utils/storage'
import { uid } from '../utils/weekUtils'

const EMPTY_WEEK = () => ({
  tasks: {},
  dayOrder: { '0': [], '1': [], '2': [], '3': [], '4': [] },
})

const initialState = () => loadState() || { weeks: {} }

export function useWeekData() {
  const [state, setState] = useState(initialState)

  const persist = useCallback((newState) => {
    setState(newState)
    saveState(newState)
  }, [])

  const getWeekData = useCallback((weekKey) => {
    return state.weeks[weekKey] || EMPTY_WEEK()
  }, [state])

  const ensureWeek = (s, weekKey) => {
    if (s.weeks[weekKey]) return s
    return { ...s, weeks: { ...s.weeks, [weekKey]: EMPTY_WEEK() } }
  }

  const addTask = useCallback((weekKey, day, title) => {
    const s = ensureWeek(state, weekKey)
    const id = uid()
    const week = s.weeks[weekKey]
    const task = { id, day, title, status: 'none', priority: 'medium', memo: '', createdAt: Date.now() }
    const dayKey = String(day)
    persist({
      ...s,
      weeks: {
        ...s.weeks,
        [weekKey]: {
          tasks: { ...week.tasks, [id]: task },
          dayOrder: { ...week.dayOrder, [dayKey]: [...(week.dayOrder[dayKey] || []), id] },
        },
      },
    })
  }, [state, persist])

  const updateTask = useCallback((weekKey, id, patch) => {
    const week = state.weeks[weekKey]
    if (!week?.tasks[id]) return
    persist({
      ...state,
      weeks: {
        ...state.weeks,
        [weekKey]: { ...week, tasks: { ...week.tasks, [id]: { ...week.tasks[id], ...patch } } },
      },
    })
  }, [state, persist])

  const deleteTask = useCallback((weekKey, id) => {
    const week = state.weeks[weekKey]
    if (!week?.tasks[id]) return
    const dayKey = String(week.tasks[id].day)
    const newTasks = { ...week.tasks }
    delete newTasks[id]
    persist({
      ...state,
      weeks: {
        ...state.weeks,
        [weekKey]: {
          tasks: newTasks,
          dayOrder: { ...week.dayOrder, [dayKey]: (week.dayOrder[dayKey] || []).filter(t => t !== id) },
        },
      },
    })
  }, [state, persist])

  const moveTask = useCallback((weekKey, taskId, fromDay, toDay, insertBeforeId = null) => {
    const week = state.weeks[weekKey]
    if (!week) return
    const fromKey = String(fromDay)
    const toKey = String(toDay)
    const fromOrder = (week.dayOrder[fromKey] || []).filter(id => id !== taskId)
    let toOrder = (week.dayOrder[toKey] || []).filter(id => id !== taskId)
    if (insertBeforeId) {
      const idx = toOrder.indexOf(insertBeforeId)
      toOrder.splice(idx >= 0 ? idx : toOrder.length, 0, taskId)
    } else {
      toOrder.push(taskId)
    }
    persist({
      ...state,
      weeks: {
        ...state.weeks,
        [weekKey]: {
          tasks: { ...week.tasks, [taskId]: { ...week.tasks[taskId], day: toDay } },
          dayOrder: { ...week.dayOrder, [fromKey]: fromOrder, [toKey]: toOrder },
        },
      },
    })
  }, [state, persist])

  return { getWeekData, addTask, updateTask, deleteTask, moveTask }
}
