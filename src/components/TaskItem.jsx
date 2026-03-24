import { useState } from 'react'
import StatusBadge from './ui/StatusBadge'

const styleMap = {
  bold: 'font-semibold',
  'red-text': 'text-[#de350b]',
  'blue-text': 'text-jira-blue',
  'bold blue-text': 'font-semibold text-jira-blue',
  'bold red-text': 'font-semibold text-[#de350b]',
}

export default function TaskItem({ task, taskKey, onEdit, onDelete, onCycleStatus, onDropBefore, onMoveToCarryover }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const textClass = styleMap[task.style] || ''

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('taskId', task.id)
    e.dataTransfer.setData('fromKey', taskKey)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const dragId = e.dataTransfer.getData('taskId')
    const fromKey = e.dataTransfer.getData('fromKey')
    if (dragId && dragId !== task.id) onDropBefore(dragId, fromKey)
  }

  return (
    <>
      {task.dividerBefore && <hr className="border-t border-jira-border my-1.5" />}
      {isDragOver && <div className="h-0.5 bg-jira-blue rounded mx-0.5" />}
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={() => setIsDragOver(false)}
        className="group flex items-start gap-1.5 px-0.5 py-1 rounded hover:bg-jira-bg relative cursor-grab active:cursor-grabbing active:opacity-50"
      >
        <StatusBadge status={task.status} onClick={() => onCycleStatus(taskKey, task.id)} />
        <span className={`flex-1 text-[11.5px] leading-snug break-words ${textClass}`}>
          {task.text}
        </span>
        <span className="hidden group-hover:flex items-center gap-0.5 absolute right-0.5 top-1">
          {task.memo && (
            <span className="text-[9px] px-1 py-0.5 bg-jira-bg border border-jira-border rounded text-jira-muted mr-0.5">메모</span>
          )}
          {onMoveToCarryover && (
            <button
              onClick={onMoveToCarryover}
              className="text-[10px] px-1 py-0.5 rounded hover:bg-orange-100 text-jira-muted hover:text-orange-600 border border-transparent hover:border-orange-200"
              title="이월/추가 업무로 이동"
            >↓ 이월</button>
          )}
          <button
            onClick={() => onEdit(task)}
            className="text-[10px] p-0.5 rounded hover:bg-gray-200 text-jira-muted hover:text-jira-dark"
            title="수정"
          >✏️</button>
          <button
            onClick={() => onDelete(taskKey, task.id)}
            className="text-[10px] p-0.5 rounded hover:bg-red-100 text-jira-muted hover:text-red-600"
            title="삭제"
          >🗑</button>
        </span>
      </div>
    </>
  )
}
