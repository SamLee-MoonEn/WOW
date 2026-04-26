import { memo, useMemo, useState } from 'react'
import DayCol from './DayCol'
import CarryoverSection from './CarryoverSection'
import { getWeekDates, formatDate, getWeekKeys, WEEKDAY_COUNT } from '../utils/weekUtils'

export default memo(function WeekBlock({ member, weekKey, weekNum, monday, isCurrent, canEdit, showDayGrid = true, isAdmin, tasks, todayStr, onAddTask, onEditTask, onDeleteTask, onDeleteDivider, onCycleTaskStatus, onAddCarryover, onEditCarryover, onDeleteCarryover, onCycleCarryoverStatus, onMoveTask, onCopyTask, onJiraImport, jiraDomain }) {
  const dates = useMemo(() => getWeekDates(monday), [monday])
  const actualCurrentWeekKey = useMemo(() => getWeekKeys(0).current, [])
  const isActualCurrentWeek = weekKey === actualCurrentWeekKey

  const dayItems = useMemo(() => {
    const result = []
    for (let i = 0; i < 7; i++) {
      result.push(tasks[`${member.id}_${weekKey}_${i}`] || EMPTY)
    }
    return result
  }, [tasks, member.id, weekKey])

  const hasWeekendData = useMemo(() => ({
    sat: dayItems[5].length > 0,
    sun: dayItems[6].length > 0,
  }), [dayItems])

  const [satOpen, setSatOpen] = useState(false)
  const [sunOpen, setSunOpen] = useState(false)
  const [satHidden, setSatHidden] = useState(false)
  const [sunHidden, setSunHidden] = useState(false)
  const [weekendConfirm, setWeekendConfirm] = useState(null)
  const showSat = satOpen || (hasWeekendData.sat && !satHidden)
  const showSun = sunOpen || (hasWeekendData.sun && !sunHidden)

  const colCount = WEEKDAY_COUNT + (showSat ? 1 : 0) + (showSun ? 1 : 0)
  const gridClass = colCount === 7 ? 'grid-cols-7' : colCount === 6 ? 'grid-cols-6' : 'grid-cols-5'

  const visibleDays = useMemo(() => {
    const days = []
    for (let i = 0; i < WEEKDAY_COUNT; i++) days.push(i)
    if (showSat) days.push(5)
    if (showSun) days.push(6)
    return days
  }, [showSat, showSun])

  const lastVisibleIdx = visibleDays[visibleDays.length - 1]

  const carryoverItems = useMemo(() => {
    const prefix = member.id + '_'
    const suffix = '_carryover'
    const entries = []
    for (const k in tasks) {
      if (!k.startsWith(prefix) || !k.endsWith(suffix)) continue
      const mid = k.slice(prefix.length, k.length - suffix.length)
      if (mid <= weekKey) entries.push([k, tasks[k]])
    }
    entries.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    const items = []
    for (const [key, arr] of entries) {
      for (const item of arr) items.push({ ...item, _key: key })
    }
    return items
  }, [tasks, member.id, weekKey])

  return (
    <div className="border border-jira-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-jira-bg border-b border-jira-border">
        <span className="text-sm font-bold text-jira-dark">
          WK{weekNum} {isActualCurrentWeek && <span className="text-red-500">🔴</span>}
        </span>
        <div className="flex items-center gap-2">
          {canEdit && (
            <div className="flex gap-1">
              {!showSat ? (
                <button
                  onClick={() => { setSatOpen(true); setSatHidden(false) }}
                  className="text-[10px] text-jira-muted hover:text-amber-600 hover:bg-amber-50 px-1.5 py-0.5 rounded border border-dashed border-jira-border hover:border-amber-300 transition-colors"
                >
                  + 토
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (hasWeekendData.sat) {
                      setWeekendConfirm({ day: 'sat', label: '토요일', count: dayItems[5].length })
                    } else {
                      setSatOpen(false)
                    }
                  }}
                  className="text-[10px] text-amber-600 hover:text-red-500 hover:bg-red-50 px-1.5 py-0.5 rounded border border-amber-200 hover:border-red-300 transition-colors"
                >
                  토 ✕
                </button>
              )}
              {!showSun ? (
                <button
                  onClick={() => { setSunOpen(true); setSunHidden(false) }}
                  className="text-[10px] text-jira-muted hover:text-amber-600 hover:bg-amber-50 px-1.5 py-0.5 rounded border border-dashed border-jira-border hover:border-amber-300 transition-colors"
                >
                  + 일
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (hasWeekendData.sun) {
                      setWeekendConfirm({ day: 'sun', label: '일요일', count: dayItems[6].length })
                    } else {
                      setSunOpen(false)
                    }
                  }}
                  className="text-[10px] text-amber-600 hover:text-red-500 hover:bg-red-50 px-1.5 py-0.5 rounded border border-amber-200 hover:border-red-300 transition-colors"
                >
                  일 ✕
                </button>
              )}
            </div>
          )}
          <span className="text-[11px] text-jira-muted">
            {formatDate(dates[0])} ~ {formatDate(dates[lastVisibleIdx])}
          </span>
        </div>
      </div>
      {showDayGrid ? (
        <div className={`grid ${gridClass} border-b border-jira-border`}>
          {visibleDays.map((i) => (
            <DayCol
              key={i}
              member={member}
              weekKey={weekKey}
              dayIndex={i}
              date={dates[i]}
              canEdit={canEdit}
              isAdmin={isAdmin}
              items={dayItems[i]}
              todayStr={todayStr}
              onAddTask={onAddTask}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onDeleteDivider={onDeleteDivider}
              onCycleStatus={onCycleTaskStatus}
              onMoveTask={onMoveTask}
              onCopyTask={onCopyTask}
              onJiraImport={onJiraImport}
              jiraDomain={jiraDomain}
            />
          ))}
        </div>
      ) : (
        <div className="px-3 py-5 bg-jira-bg/50 border-b border-jira-border text-center">
          <div className="text-base mb-1">🔒</div>
          <div className="text-[11px] text-jira-muted font-medium">일정 열람 권한 없음</div>
          <div className="text-[10px] text-gray-400 mt-0.5">관리자에게 권한을 요청하세요</div>
        </div>
      )}
      <CarryoverSection
        member={member}
        weekKey={weekKey}
        carryoverItems={carryoverItems}
        onAddCarryover={onAddCarryover}
        onEditCarryover={onEditCarryover}
        onDeleteCarryover={onDeleteCarryover}
        onCycleStatus={onCycleCarryoverStatus}
        onMoveTask={onMoveTask}
        canEdit={canEdit}
        isAdmin={isAdmin}
      />
      {weekendConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(9,30,66,0.54)]" onClick={() => setWeekendConfirm(null)}>
          <div className="bg-white rounded-lg shadow-2xl w-80 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-bold text-jira-dark mb-2">{weekendConfirm.label} 컬럼 숨기기</div>
            <div className="text-[12px] text-jira-mid mb-4">
              {weekendConfirm.label}에 {weekendConfirm.count}개의 일감이 있습니다.<br />컬럼을 숨기시겠습니까? (일감 데이터는 유지됩니다)
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setWeekendConfirm(null)}
                className="text-[12px] px-3 py-1.5 rounded border border-jira-border text-jira-mid hover:bg-jira-bg transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (weekendConfirm.day === 'sat') { setSatOpen(false); setSatHidden(true) }
                  else { setSunOpen(false); setSunHidden(true) }
                  setWeekendConfirm(null)
                }}
                className="text-[12px] px-3 py-1.5 rounded bg-jira-blue text-white hover:bg-jira-blue-dark transition-colors"
              >
                숨기기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

const EMPTY = []
