import { memo, useMemo } from 'react'
import DayCol from './DayCol'
import CarryoverSection from './CarryoverSection'
import { getWeekDates, formatDate, getWeekKeys } from '../utils/weekUtils'

export default memo(function WeekBlock({ member, weekKey, weekNum, monday, isCurrent, canEdit, showDayGrid = true, isAdmin, tasks, onAddTask, onEditTask, onDeleteTask, onDeleteDivider, onCycleTaskStatus, onAddCarryover, onEditCarryover, onDeleteCarryover, onCycleCarryoverStatus, onMoveTask, onCopyTask }) {
  const dates = useMemo(() => getWeekDates(monday), [monday])
  const actualCurrentWeekKey = useMemo(() => getWeekKeys(0).current, [])
  const isActualCurrentWeek = weekKey === actualCurrentWeekKey

  // 요일별 items 미리 추출 — 변경 없는 요일은 같은 배열 참조 유지
  const dayItems = useMemo(() => {
    const result = []
    for (let i = 0; i < 5; i++) {
      result.push(tasks[`${member.id}_${weekKey}_${i}`] || EMPTY)
    }
    return result
  }, [tasks, member.id, weekKey])

  return (
    <div className="border border-jira-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-jira-bg border-b border-jira-border">
        <span className="text-sm font-bold text-jira-dark">
          WK{weekNum} {isActualCurrentWeek && <span className="text-red-500">🔴</span>}
        </span>
        <span className="text-[11px] text-jira-muted">
          {formatDate(dates[0])} ~ {formatDate(dates[4])}
        </span>
      </div>
      {showDayGrid ? (
        <div className="grid grid-cols-5 border-b border-jira-border">
          {dates.map((date, i) => (
            <DayCol
              key={i}
              member={member}
              weekKey={weekKey}
              dayIndex={i}
              date={date}
              canEdit={canEdit}
              isAdmin={isAdmin}
              items={dayItems[i]}
              onAddTask={onAddTask}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onDeleteDivider={onDeleteDivider}
              onCycleStatus={onCycleTaskStatus}
              onMoveTask={onMoveTask}
              onCopyTask={onCopyTask}
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
        tasks={tasks}
        onAddCarryover={onAddCarryover}
        onEditCarryover={onEditCarryover}
        onDeleteCarryover={onDeleteCarryover}
        onCycleStatus={onCycleCarryoverStatus}
        onMoveTask={onMoveTask}
        canEdit={canEdit}
        isAdmin={isAdmin}
      />
    </div>
  )
})

const EMPTY = []
