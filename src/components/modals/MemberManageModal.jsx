import Modal from '../ui/Modal'
import Button from '../ui/Button'

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
            const memberIsAdmin = m.role === 'admin'
            const isLastAdmin = memberIsAdmin && adminCount === 1
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
                      {memberIsAdmin && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">관리자</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5 items-center">
                  {isAdmin && (
                    <button
                      onClick={() => !isLastAdmin && onChangeRole(m, memberIsAdmin ? 'member' : 'admin')}
                      disabled={isLastAdmin}
                      title={isLastAdmin ? '마지막 관리자는 변경할 수 없습니다' : (memberIsAdmin ? '일반으로 변경' : '관리자로 승격')}
                      className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                        isLastAdmin
                          ? 'border-jira-border text-gray-300 cursor-not-allowed'
                          : memberIsAdmin
                          ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                          : 'border-jira-border text-jira-muted hover:border-jira-blue hover:text-jira-blue hover:bg-jira-blue-light'
                      }`}
                    >
                      {memberIsAdmin ? '↓ 일반' : '↑ 관리자'}
                    </button>
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
