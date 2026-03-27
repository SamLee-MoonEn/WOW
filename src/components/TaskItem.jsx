import { useState } from 'react'
import StatusBadge from './ui/StatusBadge'

const styleMap = {
  bold: 'font-semibold',
  'red-text': 'text-[#de350b]',
  'blue-text': 'text-jira-blue',
  'bold blue-text': 'font-semibold text-jira-blue',
  'bold red-text': 'font-semibold text-[#de350b]',
}

export default function TaskItem({ task, taskKey, canEdit, onEdit, onDelete, onCycleStatus, onDropBefore, onCopy }) {
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

  const hasActions = onCopy || canEdit

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
        className="group px-0.5 pt-1 pb-0.5 rounded hover:bg-jira-bg cursor-grab active:cursor-grabbing active:opacity-50"
      >
        {/* 일감 본문 행 */}
        <div className="flex items-start gap-1.5">
          <StatusBadge status={task.status} onClick={() => onCycleStatus(taskKey, task.id)} />
          <span className="flex-1 min-w-0">
            <span className={`text-[11.5px] leading-snug break-words ${textClass}`}>
              {task.text}
            </span>
            {task.memo && (
              <span className="block text-[10.5px] text-jira-muted italic leading-snug mt-0.5 truncate">
                {task.memo}
              </span>
            )}
          </span>
        </div>

        {/* 액션바 — hover 시 아래로 슬라이드 */}
        {hasActions && (
          <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-150">
            <div className="overflow-hidden">
              <div className="flex items-center gap-1 pt-1.5 pb-0.5 pl-5">
                {onCopy && (
                  <button
                    onClick={onCopy}
                    className="text-[13px] px-1.5 py-0.5 rounded border border-jira-border bg-white hover:bg-blue-50 hover:border-jira-blue text-jira-muted transition-colors"
                    title="다른 날로 복사"
                  >
                    📋
                  </button>
                )}
                {canEdit && (
                  <>
                    <button
                      onClick={() => onEdit(task)}
                      className="text-[13px] px-1.5 py-0.5 rounded border border-jira-border bg-white hover:bg-gray-100 text-jira-muted transition-colors"
                      title="수정"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(taskKey, task.id)}
                      className="text-[13px] px-1.5 py-0.5 rounded border border-transparent hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-jira-muted transition-colors ml-auto"
                      title="삭제"
                    >
                      🗑
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
