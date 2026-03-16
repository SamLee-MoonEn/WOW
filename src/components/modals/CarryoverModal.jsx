import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { FormField, Input, Textarea, Select } from '../ui/FormField'

export default function CarryoverModal({ isEdit, item, onSave, onClose }) {
  const [text, setText] = useState(item?.text || '')
  const [date, setDate] = useState(item?.date || '')
  const [status, setStatus] = useState(item?.status || 'none')
  const [style, setStyle] = useState(item?.style || '')

  const handleSave = () => {
    if (!text.trim()) { alert('업무 내용을 입력해주세요.'); return }
    onSave({ text: text.trim(), date, status, style })
  }

  return (
    <Modal
      title={isEdit ? '이월/추가 업무 수정' : '이월/추가 업무 추가'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={handleSave} className="bg-jira-blue text-white hover:bg-jira-blue-dark">저장</Button>
        </>
      }
    >
      <FormField label="업무 내용" required>
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="이월 또는 추가 업무 내용을 입력하세요..."
          rows={3}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave() }}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="예정 날짜">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </FormField>
        <FormField label="상태">
          <Select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="none">상태 없음</option>
            <option value="done">✅ DONE</option>
            <option value="progress">🔵 IN PROGRESS</option>
            <option value="canceled">❌ CANCELED</option>
          </Select>
        </FormField>
      </div>
      <FormField label="텍스트 스타일">
        <Select value={style} onChange={e => setStyle(e.target.value)}>
          <option value="">기본</option>
          <option value="bold">굵게 (Bold)</option>
          <option value="blue-text">파란색</option>
          <option value="bold blue-text">굵게 + 파란색</option>
        </Select>
      </FormField>
    </Modal>
  )
}
