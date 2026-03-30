import { useState } from 'react'
import TaskItem from './TaskItem'
import { DAYS, formatDate, formatDateFull } from '../utils/weekUtils'

function DividerItem({ task, taskKey, canEdit, onDelete, onDropBefore }) {
  const [isDragOver, setIsDragOver] = useState(false)

  return (
    <>
      {isDragOver && <div className="h-0.5 bg-jira-blue rounded mx-0.5" />}
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('taskId', task.id)
          e.dataTransfer.setData('fromKey', taskKey)
        }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation(); setIsDragOver(false)
          const dragId = e.dataTransfer.getData('taskId')
          const fromKey = e.dataTransfer.getData('fromKey')
          if (dragId && dragId !== task.id) onDropBefore(dragId, fromKey)
        }}
        onDragEnd={() => setIsDragOver(false)}
        className="group/div flex items-center gap-1 my-1 cursor-grab active:cursor-grabbing active:opacity-50"
      >
        <hr className="flex-1 border-t border-jira-border" />
        {canEdit && (
          <button
            onClick={onDelete}
            className="opacity-0 group-hover/div:opacity-100 text-[10px] text-jira-muted hover:text-red-500 transition-opacity"
            title="구분선 삭제"
          >✕</button>
        )}
      </div>
    </>
  )
}

export default function DayCol({ member, weekKey, dayIndex, date, canEdit, isAdmin, tasks, onAddTask, onEditTask, onDeleteTask, onDeleteDivider, onCycleStatus, onMoveTask, onCopyTask }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const key = `${member.id}_${weekKey}_${dayIndex}`
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
    if (!fromKey) return
    // 관리자가 아닌 경우 다른 멤버 카드 드롭 거부
    if (!isAdmin && !fromKey.startsWith(member.id + '_')) return
    onMoveTask(fromKey, key, taskId, null)
  }

  return (
    <div
      className={`border-r border-jira-border last:border-r-0 min-h-[160px] flex flex-col transition-colors ${isDragOver ? 'bg-jira-blue-light ring-2 ring-inset ring-jira-blue' : ''}`}
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
          task.type === 'divider' ? (
            <DividerItem
              key={task.id}
              task={task}
              taskKey={key}
              canEdit={canEdit}
              onDelete={() => onDeleteDivider(key, task.id)}
              onDropBefore={(dragId, fromKey) => onMoveTask(fromKey, key, dragId, task.id)}
            />
          ) : (
            <TaskItem
              key={task.id}
              task={task}
              taskKey={key}
              canEdit={canEdit}
              onEdit={(t) => onEditTask(key, t)}
              onDelete={onDeleteTask}
              onCycleStatus={onCycleStatus}
              onDropBefore={(dragId, fromKey) => onMoveTask(fromKey, key, dragId, task.id)}
              onCopy={isAdmin ? () => onCopyTask(key, task) : undefined}
            />
          )
        ))}
        {canEdit && (
          <div className="mt-auto flex flex-col gap-0.5">
            <button
              onClick={() => onAddTask(key)}
              className="flex items-center gap-1 text-jira-muted text-[11px] px-1 py-1 rounded border border-dashed border-transparent hover:text-jira-blue hover:border-jira-blue hover:bg-jira-blue-light w-full text-left transition-all"
            >
              + 업무 추가
            </button>
            <button
              onClick={() => onAddTask(key, { type: 'divider' })}
              className="flex items-center gap-1 text-jira-muted text-[11px] px-1 py-0.5 rounded border border-dashed border-transparent hover:text-gray-500 hover:border-gray-300 w-full text-left transition-all"
            >
              ― 구분선
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
