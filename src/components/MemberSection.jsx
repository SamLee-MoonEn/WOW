import { useRef } from 'react'
import WeekBlock from './WeekBlock'
import Button from './ui/Button'
import MemberAvatar from './ui/MemberAvatar'

export default function MemberSection({ member, isMe, isAdmin, showDayGrid = true, wk, tasks, onEditMember, onDeleteMember, onAddTask, onEditTask, onDeleteTask, onDeleteDivider, onCycleTaskStatus, onAddCarryover, onEditCarryover, onDeleteCarryover, onMoveTask, onCopyTask, onWeeklyReport, onEndOfDay }) {
  const canEdit = (isMe || isAdmin) && showDayGrid
  const currentWeekRef = useRef(null)

  return (
    <div className={`bg-white rounded-xl mb-6 overflow-hidden ${isMe ? 'shadow-md ring-2 ring-jira-blue ring-offset-1' : 'shadow-sm'}`}>
      <div className={`group/header flex items-center justify-between px-5 py-3.5 border-b-2 ${isMe ? 'bg-jira-blue-light border-blue-200' : 'bg-jira-bg-alt border-jira-bg'}`}>
        <div className="text-lg font-bold flex items-center gap-2">
          <MemberAvatar member={member} size="md" /> {member.name}
          <span className="text-jira-muted text-sm font-normal">{member.rank}</span>
          {isMe && <span className="text-[11px] font-semibold text-jira-blue bg-white border border-blue-300 px-2 py-0.5 rounded-full">나</span>}
        </div>
        <div className="flex gap-1.5 opacity-40 group-hover/header:opacity-100 transition-opacity">
          {isMe && onEndOfDay && (
            <Button variant="outline" size="sm" onClick={onEndOfDay}>📤 업무 종료</Button>
          )}
          {onWeeklyReport && (
            <Button variant="outline" size="sm" onClick={() => onWeeklyReport(currentWeekRef.current, member)}>📸 주간 계획 전송</Button>
          )}
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={onEditMember}>✏️ 수정</Button>
              <Button variant="danger" size="sm" onClick={onDeleteMember}>🗑 삭제</Button>
            </>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 max-[1024px]:grid-cols-1">
          <div ref={currentWeekRef}>
          <WeekBlock
            member={member}
            weekKey={wk.current}
            weekNum={wk.currentWk}
            monday={wk.currentMonday}
            isCurrent={true}
            canEdit={canEdit}
            showDayGrid={showDayGrid}
            isAdmin={isAdmin}
            tasks={tasks}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onDeleteDivider={onDeleteDivider}
            onCycleTaskStatus={onCycleTaskStatus}
            onAddCarryover={onAddCarryover}
            onEditCarryover={onEditCarryover}
            onDeleteCarryover={onDeleteCarryover}
            onCycleCarryoverStatus={onCycleTaskStatus}
            onMoveTask={onMoveTask}
            onCopyTask={onCopyTask}
          />
          </div>
          <WeekBlock
            member={member}
            weekKey={wk.prev}
            weekNum={wk.prevWk}
            monday={wk.prevMonday}
            isCurrent={false}
            canEdit={canEdit}
            showDayGrid={showDayGrid}
            isAdmin={isAdmin}
            tasks={tasks}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onDeleteDivider={onDeleteDivider}
            onCycleTaskStatus={onCycleTaskStatus}
            onAddCarryover={onAddCarryover}
            onEditCarryover={onEditCarryover}
            onDeleteCarryover={onDeleteCarryover}
            onCycleCarryoverStatus={onCycleTaskStatus}
            onMoveTask={onMoveTask}
            onCopyTask={onCopyTask}
          />
        </div>
      </div>
    </div>
  )
}
