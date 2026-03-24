import Modal from '../ui/Modal'
import Button from '../ui/Button'

const ROLE_LABELS = {
  admin: { label: '관리자', badge: 'text-amber-700 bg-amber-50 border-amber-200' },
  member: { label: '팀원', badge: 'text-jira-muted bg-jira-bg border-jira-border' },
  external: { label: '외부인', badge: 'text-purple-700 bg-purple-50 border-purple-200' },
}

export default function MemberManageModal({ members, myMemberId, onEdit, onDelete, onChangeRole, onClose }) {
  const adminCount = members.filter(m => m.role === 'admin').length
  const isAdmin = members.find(m => m.id === myMemberId)?.role === 'admin'

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
        <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto scrollbar-thin">
          {members.map(m => {
            const role = m.role || 'member'
            const memberIsAdmin = role === 'admin'
            const isLastAdmin = memberIsAdmin && adminCount === 1
            const roleInfo = ROLE_LABELS[role] || ROLE_LABELS.member
            return (
              <div
                key={m.id}
                className="flex items-center justify-between px-3 py-2.5 border border-jira-border rounded-lg bg-jira-bg-alt"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{m.emoji}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm">{m.name}</span>
                      <span className="text-xs text-jira-muted">{m.rank}</span>
                      <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded-full ${roleInfo.badge}`}>{roleInfo.label}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5 items-center">
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => !isLastAdmin && onChangeRole(m, memberIsAdmin ? 'member' : 'admin')}
                        disabled={isLastAdmin}
                        title={isLastAdmin ? '마지막 관리자는 변경할 수 없습니다' : (memberIsAdmin ? '팀원으로 변경' : '관리자로 승격')}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                          isLastAdmin
                            ? 'border-jira-border text-gray-300 cursor-not-allowed'
                            : memberIsAdmin
                            ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                            : 'border-jira-border text-jira-muted hover:border-jira-blue hover:text-jira-blue hover:bg-jira-blue-light'
                        }`}
                      >
                        {memberIsAdmin ? '↓ 팀원' : '↑ 관리자'}
                      </button>
                      <button
                        onClick={() => onChangeRole(m, role === 'external' ? 'member' : 'external')}
                        disabled={isLastAdmin}
                        title={isLastAdmin ? '마지막 관리자는 변경할 수 없습니다' : (role === 'external' ? '팀원으로 변경' : '외부인으로 변경')}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                          isLastAdmin
                            ? 'border-jira-border text-gray-300 cursor-not-allowed'
                            : role === 'external'
                            ? 'border-purple-200 text-purple-600 hover:bg-purple-50'
                            : 'border-jira-border text-jira-muted hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50'
                        }`}
                      >
                        {role === 'external' ? '↑ 팀원' : '↓ 외부인'}
                      </button>
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={() => { onClose(); onEdit(m) }}>✏️</Button>
                  <Button variant="danger" size="sm" onClick={() => onDelete(m)}>🗑</Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
