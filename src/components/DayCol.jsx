import { useState } from 'react'
import TaskItem from './TaskItem'
import { DAYS, formatDate, formatDateFull } from '../utils/weekUtils'

export default function DayCol({ member, weekKey, dayIndex, date, tasks, onAddTask, onEditTask, onDeleteTask, onCycleStatus, onMoveTask }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const key = `${member.id}_${weekKey}_${dayIndex}`
  const carryoverKey = `${member.id}_${weekKey}_carryover`
  const items = tasks[key] || []
  const isFriday = dayIndex === 4
  const isToday = formatDateFull(date) === formatDateFull(new Date())

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const fromKey = e.dataTransfer.getData('fromKey')
    const taskId = e.dataTransfer.getData('taskId')
    // 다른 멤버의 카드는 드롭 거부
    if (!fromKey || !fromKey.startsWith(member.id + '_')) return
    onMoveTask(fromKey, key, taskId, null)
  }

  return (
    <div
      className={`border-r border-jira-border last:border-r-0 min-h-[160px] flex flex-col transition-colors ${isDragOver ? 'bg-jira-blue-light' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={`text-center py-1.5 px-1 text-[11px] font-semibold border-b border-jira-border ${
          isToday
            ? 'bg-jira-blue-light text-jira-blue'
            : isFriday
            ? 'bg-gray-200 text-jira-muted'
            : 'bg-jira-bg text-jira-mid'
        }`}
      >
        {DAYS[dayIndex]}
        <span className="block text-[10px] font-normal text-jira-muted">{formatDate(date)}</span>
      </div>
      <div className="p-1.5 flex-1 flex flex-col">
        {items.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            taskKey={key}
            onEdit={(t) => onEditTask(key, t)}
            onDelete={onDeleteTask}
            onCycleStatus={onCycleStatus}
            onDropBefore={(dragId, fromKey) => onMoveTask(fromKey, key, dragId, task.id)}
            onMoveToCarryover={() => onMoveTask(key, carryoverKey, task.id, null)}
          />
        ))}
        <button
          onClick={() => onAddTask(key)}
          className="mt-auto flex items-center gap-1 text-jira-muted text-[11px] px-1 py-1 rounded border border-dashed border-transparent hover:text-jira-blue hover:border-jira-blue hover:bg-jira-blue-light w-full text-left transition-all"
        >
          + 업무 추가
        </button>
      </div>
    </div>
  )
}
