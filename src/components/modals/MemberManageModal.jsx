import { useState, useRef } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

const ROLES = [
  { value: 'admin',    label: '관리자', badge: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 'member',   label: '팀원',   badge: 'text-jira-muted bg-jira-bg border-jira-border' },
  { value: 'external', label: '외부인', badge: 'text-purple-700 bg-purple-50 border-purple-200' },
]
const ROLE_MAP = Object.fromEntries(ROLES.map(r => [r.value, r]))

function DraggableList({ list, adminCount, isAdmin, onReorder, onEdit, onDelete, onChangeRole, onClose }) {
  const draggedIdRef = useRef(null)
  const [dragOverId, setDragOverId] = useState(null)

  const handleDrop = (targetId) => {
    const fromId = draggedIdRef.current
    if (!fromId || fromId === targetId) return
    const ids = list.map(m => m.id)
    const fromIdx = ids.indexOf(fromId)
    const toIdx = ids.indexOf(targetId)
    if (fromIdx < 0 || toIdx < 0) return
    const newIds = [...ids]
    newIds.splice(fromIdx, 1)
    newIds.splice(toIdx, 0, fromId)
    onReorder(newIds)
    draggedIdRef.current = null
    setDragOverId(null)
  }

  return (
    <div className="flex flex-col gap-2">
      {list.map(m => {
        const role = m.role || 'member'
        const roleInfo = ROLE_MAP[role] || ROLE_MAP.member
        const isLastAdmin = role === 'admin' && adminCount === 1
        const isOver = dragOverId === m.id

        return (
          <div
            key={m.id}
            className={`flex items-center justify-between px-2 py-2.5 border rounded-lg transition-colors ${
              isOver
                ? 'border-jira-blue bg-jira-blue-light'
                : 'border-jira-border bg-jira-bg-alt'
            }`}
            onDragOver={(e) => { e.preventDefault(); if (m.id !== draggedIdRef.current) setDragOverId(m.id) }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverId(null) }}
            onDrop={(e) => { e.preventDefault(); handleDrop(m.id) }}
          >
            {/* 드래그 핸들 — 이 요소만 draggable */}
            <span
              draggable
              onDragStart={(e) => {
                draggedIdRef.current = m.id
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', m.id)
              }}
              onDragEnd={() => {
                draggedIdRef.current = null
                setDragOverId(null)
              }}
              className="text-gray-300 hover:text-gray-400 mr-1.5 text-[18px] leading-none cursor-grab active:cursor-grabbing flex-shrink-0 select-none px-0.5"
              title="드래그하여 순서 변경"
            >⠿</span>

            {/* 멤버 정보 */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xl flex-shrink-0">{m.emoji}</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-sm">{m.name}</span>
                <span className="text-xs text-jira-muted">{m.rank}</span>
                {!isAdmin && (
                  <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded-full ${roleInfo.badge}`}>
                    {roleInfo.label}
                  </span>
                )}
              </div>
            </div>

            {/* 역할 + 버튼 */}
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
      })}
    </div>
  )
}

export default function MemberManageModal({ members, myMemberId, onEdit, onDelete, onChangeRole, onClose, onReorderAll }) {
  const adminCount = members.filter(m => m.role === 'admin').length
  const isAdmin = members.find(m => m.id === myMemberId)?.role === 'admin'

  const internalMembers = members.filter(m => m.role !== 'external')
  const externalMembers = members.filter(m => m.role === 'external')

  const sharedProps = { adminCount, isAdmin, onEdit, onDelete, onChangeRole, onClose }

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
          <p className="text-[11px] text-jira-muted flex items-center gap-1.5">
            <span className="text-base leading-none">⠿</span>
            <span>핸들을 드래그하여 순서를 변경할 수 있습니다</span>
          </p>

          {internalMembers.length > 0 && (
            <DraggableList
              list={internalMembers}
              onReorder={(newIds) => onReorderAll([...newIds, ...externalMembers.map(m => m.id)])}
              {...sharedProps}
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
                onReorder={(newIds) => onReorderAll([...internalMembers.map(m => m.id), ...newIds])}
                {...sharedProps}
              />
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
