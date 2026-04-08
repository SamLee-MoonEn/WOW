import { useState, useRef, useCallback, memo } from 'react'
import StatusBadge from './ui/StatusBadge'

const styleMap = {
  bold: 'font-semibold',
  'blue-text': 'text-jira-blue',
  'bold blue-text': 'font-semibold text-jira-blue',
}

function CarryoverItem({ item, itemKey, canEdit, onEdit, onDelete, onCycleStatus }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const textClass = styleMap[item.style] || ''

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('taskId', item.id)
    e.dataTransfer.setData('fromKey', itemKey)
  }

  return (
    <>
      {isDragOver && <div className="h-0.5 bg-jira-blue rounded mx-0.5" />}
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDragEnd={() => setIsDragOver(false)}
        className="group flex items-start gap-1.5 py-1 px-0.5 rounded hover:bg-orange-50 relative cursor-grab active:cursor-grabbing active:opacity-50"
      >
        {item.date && (
          <span className="text-[10px] text-jira-muted whitespace-nowrap pt-px font-semibold">
            📅 {item.date}
          </span>
        )}
        <StatusBadge status={item.status} onClick={() => onCycleStatus(itemKey, item.id)} />
        <span className={`flex-1 text-[11.5px] leading-snug break-words ${textClass}`}>
          {item.text}
        </span>
        {canEdit && (
          <span className="flex items-center gap-0.5 absolute right-0.5 top-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(item)}
              className="text-[10px] p-0.5 rounded hover:bg-gray-200 text-jira-muted hover:text-jira-dark"
              title="수정"
            >✏️</button>
            <button
              onClick={() => onDelete(itemKey, item.id)}
              className="text-[10px] p-0.5 rounded hover:bg-red-100 text-jira-muted hover:text-red-600"
              title="삭제"
            >🗑</button>
          </span>
        )}
      </div>
    </>
  )
}

const CARRY_DRAG_CLS = 'bg-orange-100 ring-2 ring-inset ring-orange-300'

export default memo(function CarryoverSection({ member, weekKey, carryoverItems, onAddCarryover, onEditCarryover, onDeleteCarryover, onCycleStatus, onMoveTask, canEdit, isAdmin }) {
  const sectionRef = useRef(null)
  const currentKey = `${member.id}_${weekKey}_carryover`

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    const el = sectionRef.current
    if (el) { el.classList.remove('bg-jira-orange-light'); el.classList.add(...CARRY_DRAG_CLS.split(' ')) }
  }, [])

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      const el = sectionRef.current
      if (el) { el.classList.remove(...CARRY_DRAG_CLS.split(' ')); el.classList.add('bg-jira-orange-light') }
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const el = sectionRef.current
    if (el) { el.classList.remove(...CARRY_DRAG_CLS.split(' ')); el.classList.add('bg-jira-orange-light') }
    const fromKey = e.dataTransfer.getData('fromKey')
    const taskId = e.dataTransfer.getData('taskId')
    if (!fromKey || fromKey.endsWith('_carryover')) return
    if (!isAdmin && !fromKey.startsWith(member.id + '_')) return
    if (onMoveTask) onMoveTask(fromKey, currentKey, taskId, null)
  }, [isAdmin, member.id, currentKey, onMoveTask])

  return (
    <div
      ref={sectionRef}
      className="px-3 py-2 border-t border-jira-border bg-jira-orange-light"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-jira-orange">
          📌 이월 / 추가 업무
        </span>
        {canEdit && (
          <button
            onClick={() => onAddCarryover(currentKey)}
            className="text-[11px] text-jira-muted hover:text-jira-blue px-1.5 py-0.5 rounded hover:bg-jira-blue-light transition-colors"
          >
            + 추가
          </button>
        )}
      </div>
      <div>
        {carryoverItems.length === 0 ? (
          <span className="text-[11px] text-gray-400">이월 업무 없음</span>
        ) : (
          carryoverItems.map(item => (
            <CarryoverItem
              key={item.id}
              item={item}
              itemKey={item._key}
              canEdit={canEdit}
              onEdit={(i) => onEditCarryover(item._key, i)}
              onDelete={onDeleteCarryover}
              onCycleStatus={onCycleStatus}
            />
          ))
        )}
      </div>
    </div>
  )
})
