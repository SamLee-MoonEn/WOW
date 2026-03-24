import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

const ROLES = [
  { value: 'admin',    label: '관리자', badge: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 'member',   label: '팀원',   badge: 'text-jira-muted bg-jira-bg border-jira-border' },
  { value: 'external', label: '외부인', badge: 'text-purple-700 bg-purple-50 border-purple-200' },
]
const ROLE_MAP = Object.fromEntries(ROLES.map(r => [r.value, r]))

function MemberRow({ m, isAdmin, isLastAdmin, onEdit, onDelete, onChangeRole, onClose,
                     isDragging, isDragOver, onDragStart, onDragOver, onDragEnd, onDrop }) {
  const role = m.role || 'member'
  const roleInfo = ROLE_MAP[role] || ROLE_MAP.member

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      className={`flex items-center justify-between px-3 py-2.5 border rounded-lg transition-colors cursor-grab active:cursor-grabbing select-none ${
        isDragOver
          ? 'border-jira-blue bg-jira-blue-light'
          : isDragging
          ? 'border-jira-border bg-jira-bg opacity-40'
          : 'border-jira-border bg-jira-bg-alt'
      }`}
    >
      {/* 드래그 핸들 */}
      <span className="text-gray-300 mr-2 text-[16px] leading-none cursor-grab">⠿</span>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xl flex-shrink-0">{m.emoji}</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-sm">{m.name}</span>
          <span className="text-xs text-jira-muted">{m.rank}</span>
          {!isAdmin && (
            <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded-full ${roleInfo.badge}`}>{roleInfo.label}</span>
          )}
        </div>
      </div>

      <div className="flex gap-1.5 items-center flex-shrink-0">
        {isAdmin && (
          <div className="flex flex-col items-end gap-0.5">
            <select
              value={role}
              disabled={isLastAdmin}
              title={isLastAdmin ? '마지막 관리자는 변경할 수 없습니다' : undefined}
              onChange={e => onChangeRole(m, e.target.value)}
              className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                isLastAdmin
                  ? 'border-jira-border text-gray-300 cursor-not-allowed bg-white'
                  : 'border-jira-border text-jira-dark bg-white hover:border-jira-blue cursor-pointer'
              }`}
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {isLastAdmin && (
              <span className="text-[10px] text-amber-500">관리자 최소 1명 필요</span>
            )}
          </div>
        )}
        <Button variant="outline" size="sm" onClick={() => { onClose(); onEdit(m) }}>✏️</Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(m)}>🗑</Button>
      </div>
    </div>
  )
}

function DraggableList({ list, adminCount, isAdmin, onReorder, onEdit, onDelete, onChangeRole, onClose }) {
  const [draggedId, setDraggedId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)

  const handleDrop = (targetId) => {
    if (!draggedId || draggedId === targetId) return
    const ids = list.map(m => m.id)
    const fromIdx = ids.indexOf(draggedId)
    const toIdx = ids.indexOf(targetId)
    if (fromIdx < 0 || toIdx < 0) return
    const newIds = [...ids]
    newIds.splice(fromIdx, 1)
    newIds.splice(toIdx, 0, draggedId)
    onReorder(newIds)
    setDraggedId(null)
    setDragOverId(null)
  }

  return (
    <div className="flex flex-col gap-2">
      {list.map(m => (
        <MemberRow
          key={m.id}
          m={m}
          isAdmin={isAdmin}
          isLastAdmin={m.role === 'admin' && adminCount === 1}
          isDragging={draggedId === m.id}
          isDragOver={dragOverId === m.id && draggedId !== m.id}
          onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDraggedId(m.id) }}
          onDragOver={(e) => { e.preventDefault(); if (m.id !== draggedId) setDragOverId(m.id) }}
          onDragEnd={() => { setDraggedId(null); setDragOverId(null) }}
          onDrop={(e) => { e.preventDefault(); handleDrop(m.id) }}
          onEdit={onEdit}
          onDelete={onDelete}
          onChangeRole={onChangeRole}
          onClose={onClose}
        />
      ))}
    </div>
  )
}

export default function MemberManageModal({ members, myMemberId, onEdit, onDelete, onChangeRole, onClose, onReorderAll }) {
  const adminCount = members.filter(m => m.role === 'admin').length
  const isAdmin = members.find(m => m.id === myMemberId)?.role === 'admin'

  const internalMembers = members.filter(m => m.role !== 'external')
  const externalMembers = members.filter(m => m.role === 'external')

  return (
    <Modal
      title="담당자 관리"
      onClose={onClose}
      footer={<Button variant="outline" onClick={onClose}>닫기</Button>}
    >
      {members.length === 0 ? (
        <div className="text-center py-8 text-jira-muted">
          <div className="text-4xl mb-2">👤</div>
          <div className="text-sm">담당자가 없습니다</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-h-[480px] overflow-y-auto scrollbar-thin">
          <div className="text-[11px] text-jira-muted flex items-center gap-1.5">
            <span>⠿</span><span>드래그하여 순서를 변경할 수 있습니다</span>
          </div>

          {internalMembers.length > 0 && (
            <DraggableList
              list={internalMembers}
              adminCount={adminCount}
              isAdmin={isAdmin}
              onReorder={(newIds) => onReorderAll([...newIds, ...externalMembers.map(m => m.id)])}
              onEdit={onEdit}
              onDelete={onDelete}
              onChangeRole={onChangeRole}
              onClose={onClose}
            />
          )}

          {externalMembers.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-purple-600">외부인</span>
                <span className="text-[11px] text-jira-muted">{externalMembers.length}명</span>
                <div className="flex-1 h-px bg-purple-100" />
              </div>
              <DraggableList
                list={externalMembers}
                adminCount={adminCount}
                isAdmin={isAdmin}
                onReorder={(newIds) => onReorderAll([...internalMembers.map(m => m.id), ...newIds])}
                onEdit={onEdit}
                onDelete={onDelete}
                onChangeRole={onChangeRole}
                onClose={onClose}
              />
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
