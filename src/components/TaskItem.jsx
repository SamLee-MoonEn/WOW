import { useState, useCallback, memo } from 'react'
import StatusBadge from './ui/StatusBadge'

const styleMap = {
  bold: 'font-semibold',
  'red-text': 'text-[#de350b]',
  'blue-text': 'text-jira-blue',
  'bold blue-text': 'font-semibold text-jira-blue',
  'bold red-text': 'font-semibold text-[#de350b]',
}

const URL_RE = /(https?:\/\/[^\s<]+)/g

function getMemoUrls(text) {
  if (!text) return []
  const matches = text.match(URL_RE)
  return matches || []
}

export default memo(function TaskItem({ task, dayKey, canEdit, isAdmin, onEditTask, onDeleteTask, onCycleStatus, onMoveTask, onCopyTask, jiraDomain }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const textClass = styleMap[task.style] || ''

  const handleDragStart = useCallback((e) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('taskId', task.id)
    e.dataTransfer.setData('fromKey', dayKey)
  }, [task.id, dayKey])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragOver(false), [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const dragId = e.dataTransfer.getData('taskId')
    const fromKey = e.dataTransfer.getData('fromKey')
    if (dragId && dragId !== task.id) onMoveTask(dragId, fromKey, task.id)
  }, [task.id, onMoveTask])

  const handleCycleStatus = useCallback(() => {
    onCycleStatus(dayKey, task.id)
  }, [onCycleStatus, dayKey, task.id])

  const handleEdit = useCallback(() => {
    onEditTask(dayKey, task)
  }, [onEditTask, dayKey, task])

  const handleDelete = useCallback(() => {
    onDeleteTask(dayKey, task.id)
  }, [onDeleteTask, dayKey, task.id])

  const handleCopy = useCallback(() => {
    onCopyTask(dayKey, task)
  }, [onCopyTask, dayKey, task])

  const memoUrls = getMemoUrls(task.memo)
  const showCopy = (canEdit || isAdmin) && onCopyTask
  const hasActions = showCopy || canEdit || memoUrls.length > 0

  return (
    <>
      {isDragOver && <div className="h-0.5 bg-jira-blue rounded mx-0.5" />}
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragLeave}
        className="group relative px-0.5 pt-1 pb-0.5 rounded hover:bg-jira-bg cursor-grab active:cursor-grabbing active:opacity-50"
      >
        {/* 일감 본문 행 */}
        <div data-task-row className="flex items-start gap-1.5">
          <StatusBadge status={task.status} onClick={handleCycleStatus} />
          <span className="flex-1 min-w-0">
            <span className={`text-[11.5px] leading-snug break-words ${textClass}`}>
              {task.text}
            </span>
            {task.jiraKey && jiraDomain && (
              <a
                href={`https://${jiraDomain}/browse/${task.jiraKey}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-block text-[9px] font-mono text-jira-muted hover:text-jira-blue mt-0.5 transition-colors"
              >
                {task.jiraKey}
              </a>
            )}
            {task.memo && (
              <span className="block text-[10.5px] text-jira-muted italic leading-snug mt-0.5 truncate">
                {task.memo}
              </span>
            )}
          </span>
        </div>

        {/* 액션바 — hover 시 표시 (absolute로 레이아웃 영향 없음) */}
        {hasActions && (
          <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-100 absolute right-0.5 bottom-full z-10 pb-1">
              <div className="flex items-center gap-1 py-0.5 px-1 bg-white/95 rounded-md shadow-sm border border-jira-border">
                {memoUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 flex items-center justify-center text-[13px] rounded border border-jira-border bg-white hover:bg-blue-50 hover:border-blue-300 text-jira-muted hover:text-jira-blue transition-colors"
                    title={url}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </a>
                ))}
                {showCopy && (
                  <button
                    onClick={handleCopy}
                    className="w-6 h-6 flex items-center justify-center text-[13px] rounded border border-jira-border bg-white hover:bg-gray-100 hover:border-gray-300 text-jira-muted transition-colors"
                    title="다른 날로 복사"
                  >
                    📋
                  </button>
                )}
                {canEdit && (
                  <>
                    <button
                      onClick={handleEdit}
                      className="w-6 h-6 flex items-center justify-center text-[13px] rounded border border-jira-border bg-white hover:bg-gray-100 hover:border-gray-300 text-jira-muted transition-colors"
                      title="수정"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-6 h-6 flex items-center justify-center rounded border border-jira-border bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-jira-muted transition-colors"
                      title="삭제"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
          </div>
        )}
      </div>
    </>
  )
})
