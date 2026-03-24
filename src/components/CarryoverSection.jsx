import { useState } from 'react'
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

export default function CarryoverSection({ member, weekKey, tasks, onAddCarryover, onEditCarryover, onDeleteCarryover, onCycleStatus, onMoveTask, canEdit, isAdmin }) {
  const [isDragOver, setIsDragOver] = useState(false)
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

  const handleDragOver = (e) => {
    e.preventDefault()
    const fromKey = e.dataTransfer.types.includes('text/plain') ? null : undefined
    // fromKey 체크는 drop 시에만 가능, 여기선 일단 허용 표시
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
    // carryover → carryover 이동 제외, 관리자가 아닌 경우 다른 멤버 드롭 거부
    if (!fromKey || fromKey.endsWith('_carryover')) return
    if (!isAdmin && !fromKey.startsWith(member.id + '_')) return
    if (onMoveTask) onMoveTask(fromKey, currentKey, taskId, null)
  }

  return (
    <div
      className={`px-3 py-2 border-t border-jira-border transition-colors ${isDragOver ? 'bg-orange-100 ring-2 ring-inset ring-orange-300' : 'bg-jira-orange-light'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-jira-orange">
          📌 이월 / 추가 업무
          {isDragOver && <span className="ml-1.5 font-normal text-orange-500">여기에 놓으면 이월됩니다</span>}
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
        {aggregatedItems.length === 0 ? (
          <span className="text-[11px] text-gray-400">이월 업무 없음</span>
        ) : (
          aggregatedItems.map(item => (
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
}
