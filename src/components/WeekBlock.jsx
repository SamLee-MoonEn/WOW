import DayCol from './DayCol'
import CarryoverSection from './CarryoverSection'
import { getWeekDates, formatDate, getWeekKeys } from '../utils/weekUtils'

export default function WeekBlock({ member, weekKey, weekNum, monday, isCurrent, canEdit, tasks, onAddTask, onEditTask, onDeleteTask, onCycleTaskStatus, onAddCarryover, onEditCarryover, onDeleteCarryover, onCycleCarryoverStatus, onMoveTask }) {
  const dates = getWeekDates(monday)
  const isActualCurrentWeek = weekKey === getWeekKeys(0).current

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
      <div className="grid grid-cols-5 border-b border-jira-border">
        {dates.map((date, i) => (
          <DayCol
            key={i}
            member={member}
            weekKey={weekKey}
            dayIndex={i}
            date={date}
            canEdit={canEdit}
            tasks={tasks}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onCycleStatus={onCycleTaskStatus}
            onMoveTask={onMoveTask}
          />
        ))}
      </div>
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
      />
    </div>
  )
}
