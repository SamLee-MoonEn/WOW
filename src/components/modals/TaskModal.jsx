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

const DAY_LABELS = ['월', '화', '수', '목', '금']

export default function TaskModal({ isEdit, task, onSave, onClose }) {
  const [text, setText] = useState(task?.text || '')
  const [status, setStatus] = useState(task?.status || 'none')
  const [style, setStyle] = useState(task?.style || '')
  const [dividerBefore, setDividerBefore] = useState(task?.dividerBefore || false)
  const [memo, setMemo] = useState(task?.memo || '')
  const [textError, setTextError] = useState(false)
  const [multiDay, setMultiDay] = useState(false)
  const [selectedDays, setSelectedDays] = useState(new Set([0, 1, 2, 3, 4]))
  const [repeatWeeks, setRepeatWeeks] = useState(1)
  const [customWeeks, setCustomWeeks] = useState('')
  const isCustom = repeatWeeks === 'custom'
  const effectiveRepeatWeeks = isCustom ? (parseInt(customWeeks) || 1) : repeatWeeks

  const toggleDay = (d) => {
    setSelectedDays(prev => {
      const next = new Set(prev)
      next.has(d) ? next.delete(d) : next.add(d)
      return next
    })
  }

  const handleSave = () => {
    if (!text.trim()) { setTextError(true); return }
    const data = { text: text.trim(), status, style, dividerBefore, memo }
    if (!isEdit && multiDay) {
      onSave({ ...data, selectedDays: [...selectedDays].sort(), repeatWeeks: effectiveRepeatWeeks })
    } else {
      onSave(data)
    }
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

      {!isEdit && (
        <FormField label="여러 날 반복">
          <label className="flex items-center gap-2 text-[13px] cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={multiDay}
              onChange={e => setMultiDay(e.target.checked)}
              className="w-4 h-4 rounded accent-jira-blue"
            />
            선택한 요일에 모두 추가
          </label>
          {multiDay && (
            <div className="space-y-2 mt-1">
              <div className="flex gap-1.5">
                {DAY_LABELS.map((label, d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`w-8 h-8 rounded-full text-[12px] font-semibold border transition-colors ${
                      selectedDays.has(d)
                        ? 'bg-jira-blue text-white border-jira-blue'
                        : 'bg-white text-jira-muted border-jira-border hover:border-jira-blue'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[13px] text-jira-mid flex-wrap">
                <span>매주 반복:</span>
                <select
                  value={repeatWeeks}
                  onChange={e => setRepeatWeeks(e.target.value === 'custom' ? 'custom' : Number(e.target.value))}
                  className="border border-jira-border rounded px-2 py-0.5 text-[12px] bg-white"
                >
                  <option value={1}>이번 주만</option>
                  <option value={2}>2주</option>
                  <option value={3}>3주</option>
                  <option value={4}>4주</option>
                  <option value={6}>6주</option>
                  <option value={8}>8주</option>
                  <option value="custom">직접 입력</option>
                </select>
                {isCustom && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={52}
                      value={customWeeks}
                      onChange={e => setCustomWeeks(e.target.value)}
                      placeholder="주 수"
                      className="w-16 border border-jira-border rounded px-2 py-0.5 text-[12px]"
                    />
                    <span className="text-[12px]">주</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </FormField>
      )}

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
