import WeekBlock from './WeekBlock'
import Button from './ui/Button'

export default function MemberSection({ member, isMe, isAdmin, wk, tasks, onEditMember, onDeleteMember, onAddTask, onEditTask, onDeleteTask, onCycleTaskStatus, onAddCarryover, onEditCarryover, onDeleteCarryover, onMoveTask }) {
  const canEdit = isMe || isAdmin

  return (
    <div className={`bg-white rounded-xl mb-6 overflow-hidden ${isMe ? 'shadow-md ring-2 ring-jira-blue ring-offset-1' : 'shadow-sm'}`}>
      <div className={`group/header flex items-center justify-between px-5 py-3.5 border-b-2 ${isMe ? 'bg-jira-blue-light border-blue-200' : 'bg-jira-bg-alt border-jira-bg'}`}>
        <div className="text-lg font-bold flex items-center gap-2">
          {member.emoji} {member.name}
          <span className="text-jira-muted text-sm font-normal">{member.rank}</span>
          {isMe && <span className="text-[11px] font-semibold text-jira-blue bg-white border border-blue-300 px-2 py-0.5 rounded-full">나</span>}
        </div>
        {isAdmin && (
          <div className="flex gap-1.5 opacity-0 group-hover/header:opacity-100 transition-opacity">
            <Button variant="outline" size="sm" onClick={onEditMember}>✏️ 수정</Button>
            <Button variant="danger" size="sm" onClick={onDeleteMember}>🗑 삭제</Button>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 max-[1024px]:grid-cols-1">
          <WeekBlock
            member={member}
            weekKey={wk.current}
            weekNum={wk.currentWk}
            monday={wk.currentMonday}
            isCurrent={true}
            canEdit={canEdit}
            tasks={tasks}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onCycleTaskStatus={onCycleTaskStatus}
            onAddCarryover={onAddCarryover}
            onEditCarryover={onEditCarryover}
            onDeleteCarryover={onDeleteCarryover}
            onCycleCarryoverStatus={onCycleTaskStatus}
            onMoveTask={onMoveTask}
          />
          <WeekBlock
            member={member}
            weekKey={wk.prev}
            weekNum={wk.prevWk}
            monday={wk.prevMonday}
            isCurrent={false}
            canEdit={canEdit}
            tasks={tasks}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onCycleTaskStatus={onCycleTaskStatus}
            onAddCarryover={onAddCarryover}
            onEditCarryover={onEditCarryover}
            onDeleteCarryover={onDeleteCarryover}
            onCycleCarryoverStatus={onCycleTaskStatus}
            onMoveTask={onMoveTask}
          />
        </div>
      </div>
    </div>
  )
}
