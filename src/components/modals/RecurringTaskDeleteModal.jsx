import { useState, useMemo } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { splitByToday } from '../../utils/recurringUtils'
import { formatDateFull } from '../../utils/weekUtils'

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

function formatItem(m) {
  if (!m.date) return ''
  const d = m.date
  const dow = DAY_LABELS[(d.getDay() + 6) % 7]
  return `${formatDateFull(d)} (${dow})`
}

function PreviewList({ items, emptyText }) {
  if (!items.length) return <div className="text-[12px] text-jira-muted">{emptyText}</div>
  const visible = items.slice(0, 8)
  const rest = items.length - visible.length
  return (
    <div className="text-[12px] text-jira-mid leading-relaxed">
      {visible.map((m) => <div key={m.key + m.taskId}>· {formatItem(m)}</div>)}
      {rest > 0 && <div className="text-jira-muted">… 외 {rest}개</div>}
    </div>
  )
}

export default function RecurringTaskDeleteModal({ taskKey, taskId, matches, isFallback, anchorTask, onDelete, onClose }) {
  const { fromToday } = useMemo(() => splitByToday(matches), [matches])
  const singleMatch = useMemo(
    () => matches.find((m) => m.key === taskKey && m.taskId === taskId) || matches[0],
    [matches, taskKey, taskId]
  )

  const [scope, setScope] = useState('single')

  const handleConfirm = () => onDelete(scope)

  const options = [
    {
      value: 'single',
      label: '이 업무만 삭제',
      count: 1,
      preview: singleMatch ? [singleMatch] : [],
    },
    {
      value: 'fromToday',
      label: '오늘 이후 작업 삭제',
      count: fromToday.length,
      preview: fromToday,
      disabled: fromToday.length === 0,
    },
    {
      value: 'all',
      label: '전체 삭제',
      count: matches.length,
      preview: matches,
    },
  ]

  return (
    <Modal
      title="반복 업무 삭제"
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button variant="danger" onClick={handleConfirm}>삭제</Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="text-[13px] text-jira-mid">
          <span className="font-semibold text-jira-dark">"{anchorTask?.text || ''}"</span>
          {' '}와(과) 같은 반복 그룹의 작업이 <b>{matches.length}건</b> 있습니다. 어떻게 처리할까요?
        </div>

        {isFallback && (
          <div className="rounded border border-amber-200 bg-amber-50 text-[12px] text-amber-800 px-3 py-2 leading-relaxed">
            이 그룹은 동일한 <b>내용·스타일·메모</b>를 기준으로 추정한 것입니다. 의도하지 않은 항목이 포함되어 있는지 미리보기에서 확인하세요.
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
                  name="delete-scope"
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
