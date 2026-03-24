import Modal from '../ui/Modal'
import Button from '../ui/Button'

const ROLES = [
  { value: 'admin',    label: '관리자', badge: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 'member',   label: '팀원',   badge: 'text-jira-muted bg-jira-bg border-jira-border' },
  { value: 'external', label: '외부인', badge: 'text-purple-700 bg-purple-50 border-purple-200' },
]
const ROLE_MAP = Object.fromEntries(ROLES.map(r => [r.value, r]))

function MemberRow({ m, isAdmin, isLastAdmin, onEdit, onDelete, onChangeRole, onClose, isExternal, isFirst, isLast, onMoveUp, onMoveDown }) {
  const role = m.role || 'member'
  const roleInfo = ROLE_MAP[role] || ROLE_MAP.member
  return (
    <div className="flex items-center justify-between px-3 py-2.5 border border-jira-border rounded-lg bg-jira-bg-alt">
      <div className="flex items-center gap-2">
        <span className="text-xl">{m.emoji}</span>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm">{m.name}</span>
          <span className="text-xs text-jira-muted">{m.rank}</span>
          {!isAdmin && (
            <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded-full ${roleInfo.badge}`}>{roleInfo.label}</span>
          )}
        </div>
      </div>
      <div className="flex gap-1.5 items-center">
        {!isExternal && (
          <div className="flex gap-0.5">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="text-[11px] px-1.5 py-0.5 border rounded text-jira-muted hover:bg-jira-bg disabled:opacity-30 disabled:cursor-not-allowed"
              title="위로"
            >↑</button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="text-[11px] px-1.5 py-0.5 border rounded text-jira-muted hover:bg-jira-bg disabled:opacity-30 disabled:cursor-not-allowed"
              title="아래로"
            >↓</button>
          </div>
        )}
        {isAdmin && (
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
        )}
        <Button variant="outline" size="sm" onClick={() => { onClose(); onEdit(m) }}>✏️</Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(m)}>🗑</Button>
      </div>
    </div>
  )
}

export default function MemberManageModal({ members, myMemberId, onEdit, onDelete, onChangeRole, onClose, onReorder }) {
  const adminCount = members.filter(m => m.role === 'admin').length
  const isAdmin = members.find(m => m.id === myMemberId)?.role === 'admin'

  const internalMembers = members.filter(m => m.role !== 'external')
  const externalMembers = members.filter(m => m.role === 'external')

  const rowProps = { isAdmin, onEdit, onDelete, onChangeRole, onClose }

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
          {internalMembers.length > 0 && (
            <div className="flex flex-col gap-2">
              {internalMembers.map((m, idx) => (
                <MemberRow
                  key={m.id}
                  m={m}
                  isLastAdmin={m.role === 'admin' && adminCount === 1}
                  isExternal={false}
                  isFirst={idx === 0}
                  isLast={idx === internalMembers.length - 1}
                  onMoveUp={() => onReorder(m.id, 'up')}
                  onMoveDown={() => onReorder(m.id, 'down')}
                  {...rowProps}
                />
              ))}
            </div>
          )}

          {externalMembers.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-purple-600">외부인</span>
                <span className="text-[11px] text-jira-muted">{externalMembers.length}명</span>
                <div className="flex-1 h-px bg-purple-100" />
              </div>
              {externalMembers.map((m, idx) => (
                <MemberRow
                  key={m.id}
                  m={m}
                  isLastAdmin={false}
                  isExternal={true}
                  isFirst={idx === 0}
                  isLast={idx === externalMembers.length - 1}
                  onMoveUp={() => onReorder(m.id, 'up')}
                  onMoveDown={() => onReorder(m.id, 'down')}
                  {...rowProps}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
