import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { FormField, Input, Textarea, Select } from '../ui/FormField'
import StatusBadge from '../ui/StatusBadge'

const styleMap = {
  bold: 'font-semibold',
  'red-text': 'text-[#de350b]',
  'blue-text': 'text-jira-blue',
  'bold blue-text': 'font-semibold text-jira-blue',
  'bold red-text': 'font-semibold text-[#de350b]',
}

export default function TaskModal({ isEdit, task, onSave, onClose }) {
  const [text, setText] = useState(task?.text || '')
  const [status, setStatus] = useState(task?.status || 'none')
  const [style, setStyle] = useState(task?.style || '')
  const [dividerBefore, setDividerBefore] = useState(task?.dividerBefore || false)
  const [memo, setMemo] = useState(task?.memo || '')
  const [textError, setTextError] = useState(false)

  const handleSave = () => {
    if (!text.trim()) { setTextError(true); return }
    onSave({ text: text.trim(), status, style, dividerBefore, memo })
  }

  return (
    <Modal
      title={isEdit ? '업무 수정' : '업무 추가'}
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
          onChange={e => { setText(e.target.value); if (textError) setTextError(false) }}
          placeholder="업무 내용을 입력하세요..."
          rows={3}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave() }}
          className={textError ? 'border-red-400 focus:ring-red-300' : ''}
        />
        {textError && <p className="text-[11px] text-red-500 mt-1">업무 내용을 입력해주세요.</p>}
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="상태">
          <Select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="none">상태 없음</option>
            <option value="done">✅ DONE</option>
            <option value="progress">🔵 IN PROGRESS</option>
            <option value="canceled">❌ CANCELED</option>
          </Select>
        </FormField>
        <FormField label="텍스트 스타일">
          <Select value={style} onChange={e => setStyle(e.target.value)}>
            <option value="">기본</option>
            <option value="bold">굵게 (Bold)</option>
            <option value="red-text">빨간색</option>
            <option value="blue-text">파란색</option>
            <option value="bold blue-text">굵게 + 파란색</option>
            <option value="bold red-text">굵게 + 빨간색</option>
          </Select>
        </FormField>
      </div>

      <FormField label="섹션 구분선">
        <label className="flex items-center gap-2 text-[13px] cursor-pointer">
          <input
            type="checkbox"
            checked={dividerBefore}
            onChange={e => setDividerBefore(e.target.checked)}
            className="w-4 h-4 rounded accent-jira-blue"
          />
          이 항목 위에 구분선 추가
        </label>
      </FormField>

      <FormField label="메모">
        <Textarea
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder="상세 내용, 참고 사항 등..."
          rows={3}
        />
      </FormField>

      <FormField label="미리보기">
        <div className="border border-jira-border rounded p-2.5 min-h-9 bg-jira-bg-alt">
          {dividerBefore && <hr className="border-t border-jira-border mb-1" />}
          <div className="flex items-start gap-1.5">
            <StatusBadge status={status} />
            <span className={`text-[11.5px] leading-snug ${styleMap[style] || ''}`}>
              {text || <span className="text-jira-muted">업무 내용 미리보기</span>}
            </span>
          </div>
        </div>
      </FormField>
    </Modal>
  )
}
