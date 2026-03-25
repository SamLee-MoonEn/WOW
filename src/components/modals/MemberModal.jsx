import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { FormField, Input, Select } from '../ui/FormField'

export default function MemberModal({ isEdit, member, existingTags = [], onSave, onClose }) {
  const [name, setName] = useState(member?.name || '')
  const [rank, setRank] = useState(member?.rank || '')
  const [emoji, setEmoji] = useState(member?.emoji || '🚹')
  const [group, setGroup] = useState(member?.group || '')
  const [tags, setTags] = useState(member?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const suggestions = tagInput.trim()
    ? existingTags.filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t))
    : []

  const handleSave = () => {
    if (!name.trim() || !rank.trim()) { alert('이름과 직급을 입력해주세요.'); return }
    onSave({ name: name.trim(), rank: rank.trim(), emoji, group: group.trim(), tags })
  }

  const addTag = (value) => {
    const t = (value ?? tagInput).trim()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
    setShowSuggestions(false)
  }

  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t))

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
      <FormField label="부서/그룹">
        <Input value={group} onChange={e => setGroup(e.target.value)} placeholder="개발팀, 기획팀..." onKeyDown={e => { if (e.key === 'Enter') handleSave() }} />
      </FormField>
      <FormField label="태그">
        <div className="relative flex gap-1.5">
          <div className="relative flex-1">
            <Input
              value={tagInput}
              onChange={e => { setTagInput(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); addTag() }
                if (e.key === 'Escape') setShowSuggestions(false)
              }}
              placeholder="태그 입력 후 Enter"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-0.5 bg-white border border-jira-border rounded-lg shadow-md overflow-hidden">
                {suggestions.map(t => (
                  <button
                    key={t}
                    onMouseDown={() => addTag(t)}
                    className="w-full text-left text-[12px] px-3 py-1.5 hover:bg-jira-bg text-jira-dark transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => addTag()}>추가</Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map(t => (
              <span key={t} className="flex items-center gap-1 text-[11px] bg-jira-bg border border-jira-border px-2 py-0.5 rounded-full">
                {t}
                <button onClick={() => removeTag(t)} className="text-gray-400 hover:text-red-400 leading-none">✕</button>
              </span>
            ))}
          </div>
        )}
      </FormField>
    </Modal>
  )
}
