import { useState } from 'react'
import StatusBadge from './ui/StatusBadge'

const styleMap = {
  bold: 'font-semibold',
  'blue-text': 'text-jira-blue',
  'bold blue-text': 'font-semibold text-jira-blue',
}

function CarryoverItem({ item, itemKey, onEdit, onDelete, onCycleStatus }) {
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
        className="group flex items-start gap-1.5 py-1 px-0.5 rounded hover:bg-yellow-100 relative cursor-grab active:cursor-grabbing active:opacity-50"
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
        <span className="hidden group-hover:flex items-center gap-0.5 absolute right-0.5 top-1">
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
      </div>
    </>
  )
}

export default function CarryoverSection({ member, weekKey, tasks, onAddCarryover, onEditCarryover, onDeleteCarryover, onCycleStatus }) {
  const currentKey = `${member.id}_${weekKey}_carryover`
  const prefix = member.id + '_'
  const suffix = '_carryover'

  // 현재 주차 이하에 등록된 모든 이월 업무 집계
  const aggregatedItems = Object.entries(tasks)
    .filter(([k]) => {
      if (!k.startsWith(prefix) || !k.endsWith(suffix)) return false
      const mid = k.slice(prefix.length, k.length - suffix.length)
      return mid <= weekKey // 'YYYY_WNN' 형식은 사전순 비교로 주차 비교 가능
    })
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0) // 오래된 주차 먼저
    .flatMap(([key, items]) => items.map(item => ({ ...item, _key: key })))

  return (
    <div className="px-3 py-2 bg-jira-orange-light border-t border-jira-border">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-jira-orange">📌 이월 / 추가 업무</span>
        <button
          onClick={() => onAddCarryover(currentKey)}
          className="text-[11px] text-jira-muted hover:text-jira-blue px-1.5 py-0.5 rounded hover:bg-jira-blue-light transition-colors"
        >
          + 추가
        </button>
      </div>
      <div>
        {aggregatedItems.length === 0 ? (
          <span className="text-[11px] text-gray-400">이월 업무 없음</span>
        ) : (
          aggregatedItems.map(item => (
            <CarryoverItem
              key={item.id}
              item={item}
              itemKey={item._key}
              onEdit={(i) => onEditCarryover(item._key, i)}
              onDelete={onDeleteCarryover}
              onCycleStatus={onCycleStatus}
            />
          ))
        )}
      </div>
    </div>
  )
}
