import { useState, useRef, useCallback, memo } from 'react'
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
        className="group/div flex items-center gap-1.5 my-1.5 py-1 px-1 rounded cursor-grab active:cursor-grabbing active:opacity-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex-1 flex items-center gap-1">
          <span className="opacity-0 group-hover/div:opacity-100 text-[10px] text-gray-400 transition-opacity select-none">⠿</span>
          <hr className="flex-1 border-t border-gray-300 group-hover/div:border-t-2 group-hover/div:border-jira-blue transition-colors" />
        </div>
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

const DRAG_OVER_CLS = 'bg-jira-blue-light ring-2 ring-inset ring-jira-blue'

export default memo(function DayCol({ member, weekKey, dayIndex, date, canEdit, isAdmin, items, todayStr, onAddTask, onEditTask, onDeleteTask, onDeleteDivider, onCycleStatus, onMoveTask, onCopyTask, onJiraImport, jiraDomain }) {
  const colRef = useRef(null)
  const key = `${member.id}_${weekKey}_${dayIndex}`
  const isWeekend = dayIndex >= 5
  const isToday = formatDateFull(date) === todayStr

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    colRef.current?.classList.add(...DRAG_OVER_CLS.split(' '))
  }, [])

  const handleDragLeave = useCallback((e) => {
    if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) {
      colRef.current?.classList.remove(...DRAG_OVER_CLS.split(' '))
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    colRef.current?.classList.remove(...DRAG_OVER_CLS.split(' '))
    const fromKey = e.dataTransfer.getData('fromKey')
    const taskId = e.dataTransfer.getData('taskId')
    if (!fromKey) return
    if (!isAdmin && !fromKey.startsWith(member.id + '_')) return
    onMoveTask(fromKey, key, taskId, null)
  }, [isAdmin, member.id, key, onMoveTask])

  const handleDragEnd = useCallback(() => {
    colRef.current?.classList.remove(...DRAG_OVER_CLS.split(' '))
  }, [])

  const handleMoveToHere = useCallback((dragId, fromKey, beforeId) => {
    onMoveTask(fromKey, key, dragId, beforeId)
  }, [onMoveTask, key])

  return (
    <div
      ref={colRef}
      className="border-r border-jira-border last:border-r-0 min-h-[160px] flex flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
    >
      <div
        className={`text-center py-1.5 px-1 text-[11px] font-semibold border-b border-jira-border ${
          isToday
            ? 'bg-jira-blue-light text-jira-blue'
            : isWeekend
            ? 'bg-amber-50 text-amber-600'
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
              onDropBefore={(dragId, fromKey) => handleMoveToHere(dragId, fromKey, task.id)}
            />
          ) : (
            <TaskItem
              key={task.id}
              task={task}
              dayKey={key}
              canEdit={canEdit}
              isAdmin={isAdmin}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onCycleStatus={onCycleStatus}
              onMoveTask={handleMoveToHere}
              onCopyTask={onCopyTask}
              jiraDomain={jiraDomain}
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
            {onJiraImport && (
              <button
                onClick={() => onJiraImport(key)}
                className="flex items-center gap-1 text-jira-muted text-[11px] px-1 py-1 rounded border border-dashed border-transparent hover:text-jira-blue hover:border-jira-blue hover:bg-jira-blue-light w-full text-left transition-all"
              >
                🔗 Jira 가져오기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
})
