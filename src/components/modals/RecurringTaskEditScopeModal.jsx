import { useState, useMemo } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { splitByToday } from '../../utils/recurringUtils'
import { formatDateFull } from '../../utils/weekUtils'

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']
const FIELD_LABELS = { text: '내용', status: '상태', style: '스타일', memo: '메모' }
const STATUS_LABELS = { none: '상태 없음', done: '✅ DONE', progress: '🔵 IN PROGRESS', canceled: '❌ CANCELED' }
const STYLE_LABELS = {
  '': '기본',
  bold: '굵게',
  'red-text': '빨간색',
  'blue-text': '파란색',
  'bold blue-text': '굵게+파랑',
  'bold red-text': '굵게+빨강',
}

function formatFieldValue(field, value) {
  if (field === 'status') return STATUS_LABELS[value || 'none'] || value || ''
  if (field === 'style') return STYLE_LABELS[value || ''] || value || '기본'
  return value || '(비어있음)'
}

function formatDateItem(m) {
  if (!m.date) return ''
  const dow = DAY_LABELS[(m.date.getDay() + 6) % 7]
  return `${formatDateFull(m.date)} (${dow})`
}

function PreviewList({ items, emptyText }) {
  if (!items.length) return <div className="text-[12px] text-jira-muted">{emptyText}</div>
  const visible = items.slice(0, 8)
  const rest = items.length - visible.length
  return (
    <div className="text-[12px] text-jira-mid leading-relaxed">
      {visible.map((m) => <div key={m.key + m.taskId}>· {formatDateItem(m)}</div>)}
      {rest > 0 && <div className="text-jira-muted">… 외 {rest}개</div>}
    </div>
  )
}

export default function RecurringTaskEditScopeModal({
  taskKey,
  taskId,
  matches,
  isFallback,
  anchorTask,
  changed, // { field: newValue } 만 포함 (실제 변경된 것만)
  onApply, // (scope) => void  scope: 'single' | 'fromToday' | 'all'
  onClose,
}) {
  const { fromToday } = useMemo(() => splitByToday(matches), [matches])
  const singleMatch = useMemo(
    () => matches.find((m) => m.key === taskKey && m.taskId === taskId) || matches[0],
    [matches, taskKey, taskId]
  )
  const [scope, setScope] = useState('single')

  const changedKeys = Object.keys(changed || {})

  const options = [
    { value: 'single', label: '이 업무만 수정', count: 1, preview: singleMatch ? [singleMatch] : [] },
    { value: 'fromToday', label: '오늘 이후 작업 수정', count: fromToday.length, preview: fromToday, disabled: fromToday.length === 0 },
    { value: 'all', label: '전체 수정', count: matches.length, preview: matches },
  ]

  return (
    <Modal
      title="반복 업무 수정"
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={() => onApply(scope)} className="bg-jira-blue text-white hover:bg-jira-blue-dark">적용</Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="text-[13px] text-jira-mid">
          <span className="font-semibold text-jira-dark">"{anchorTask?.text || ''}"</span>
          {' '}와(과) 같은 반복 그룹의 작업이 <b>{matches.length}건</b> 있습니다. 변경을 어디까지 적용할까요?
        </div>

        {isFallback && (
          <div className="rounded border border-amber-200 bg-amber-50 text-[12px] text-amber-800 px-3 py-2 leading-relaxed">
            이 그룹은 동일한 <b>내용·스타일·메모</b>를 기준으로 추정한 것입니다. 미리보기에서 확인 후 적용하세요.
          </div>
        )}

        {changedKeys.length > 0 && (
          <div className="rounded border border-jira-border bg-jira-bg-alt px-3 py-2">
            <div className="text-[11px] text-jira-muted mb-1">변경되는 항목</div>
            <div className="space-y-1">
              {changedKeys.map((k) => (
                <div key={k} className="text-[12px] flex gap-2">
                  <span className="text-jira-mid font-semibold min-w-[3rem]">{FIELD_LABELS[k] || k}:</span>
                  <span className="text-jira-muted line-through">{formatFieldValue(k, anchorTask?.[k])}</span>
                  <span className="text-jira-muted">→</span>
                  <span className="text-jira-dark font-medium">{formatFieldValue(k, changed[k])}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {options.map((opt) => (
            <label
              key={opt.value}
              className={`block rounded border px-3 py-2 cursor-pointer transition-colors ${
                scope === opt.value
                  ? 'border-jira-blue bg-blue-50'
                  : 'border-jira-border bg-white hover:border-jira-blue/60'
              } ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="edit-scope"
                  value={opt.value}
                  checked={scope === opt.value}
                  onChange={() => !opt.disabled && setScope(opt.value)}
                  disabled={opt.disabled}
                  className="accent-jira-blue"
                />
                <span className="text-[13px] font-semibold text-jira-dark">{opt.label}</span>
                <span className="text-[12px] text-jira-muted ml-auto">{opt.count}건</span>
              </div>
              {scope === opt.value && (
                <div className="mt-2 pl-6">
                  <PreviewList items={opt.preview} emptyText="해당하는 항목이 없습니다." />
                </div>
              )}
            </label>
          ))}
        </div>
      </div>
    </Modal>
  )
}
