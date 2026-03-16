import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function MemberManageModal({ members, onEdit, onDelete, onClose }) {
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
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto scrollbar-thin">
          {members.map(m => (
            <div
              key={m.id}
              className="flex items-center justify-between px-3 py-2.5 border border-jira-border rounded-lg bg-jira-bg-alt"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{m.emoji}</span>
                <span className="font-semibold text-sm">{m.name}</span>
                <span className="text-xs text-jira-muted">{m.rank}</span>
              </div>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={() => { onClose(); onEdit(m) }}>✏️</Button>
                <Button variant="danger" size="sm" onClick={() => { onDelete(m) }}>🗑</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
