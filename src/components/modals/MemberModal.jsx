import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { FormField, Input, Select } from '../ui/FormField'

export default function MemberModal({ isEdit, member, onSave, onClose }) {
  const [name, setName] = useState(member?.name || '')
  const [rank, setRank] = useState(member?.rank || '')
  const [emoji, setEmoji] = useState(member?.emoji || '🚹')

  const handleSave = () => {
    if (!name.trim() || !rank.trim()) { alert('이름과 직급을 입력해주세요.'); return }
    onSave({ name: name.trim(), rank: rank.trim(), emoji })
  }

  return (
    <Modal
      title={isEdit ? '담당자 수정' : '담당자 추가'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={handleSave} className="bg-jira-blue text-white hover:bg-jira-blue-dark">
            {isEdit ? '저장' : '추가'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <FormField label="이름" required>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" autoFocus onKeyDown={e => { if (e.key === 'Enter') handleSave() }} />
        </FormField>
        <FormField label="직급" required>
          <Input value={rank} onChange={e => setRank(e.target.value)} placeholder="과장, 차장, 부장..." onKeyDown={e => { if (e.key === 'Enter') handleSave() }} />
        </FormField>
      </div>
      <FormField label="이모지">
        <Select value={emoji} onChange={e => setEmoji(e.target.value)}>
          <option value="🚹">🚹 남성</option>
          <option value="🚺">🚺 여성</option>
          <option value="👤">👤 일반</option>
          <option value="⭐">⭐ 스타</option>
        </Select>
      </FormField>
    </Modal>
  )
}
