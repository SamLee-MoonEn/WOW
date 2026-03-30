import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { DAYS } from '../../utils/weekUtils'

const DAY_LABELS = ['월', '화', '수', '목', '금']

export default function CopyTaskModal({ task, fromKey, members, myMemberId, wk, baseWeekOffset, onCopy, onClose }) {
  const fromParts = fromKey.split('_')
  const sourceMemberId = fromParts[0]
  const sourceDayIndex = parseInt(fromParts[fromParts.length - 1])
  const defaultDay = isNaN(sourceDayIndex) ? 0 : sourceDayIndex

  const sourceMember = members.find(m => m.id === sourceMemberId)
  const sourceDay = !isNaN(sourceDayIndex) ? DAYS[sourceDayIndex] : null

  const [targetMemberId, setTargetMemberId] = useState(myMemberId || members[0]?.id || '')
  const [weekOffset, setWeekOffset] = useState(0)
  const [dayIndex, setDayIndex] = useState(defaultDay)
  const [multiDay, setMultiDay] = useState(false)
  const [selectedDays, setSelectedDays] = useState(new Set([defaultDay]))
  const [repeatWeeks, setRepeatWeeks] = useState(1)

  const weekKey = weekOffset === 0 ? wk.current : wk.prev

  const toggleDay = (d) => {
    setSelectedDays(prev => {
      const next = new Set(prev)
      next.has(d) ? next.delete(d) : next.add(d)
      return next
    })
  }

  const handleCopy = () => {
    if (!targetMemberId) return
    if (multiDay) {
      onCopy({ targetMemberId, selectedDays: [...selectedDays].sort(), repeatWeeks, weekOffset })
    } else {
      onCopy({ targetMemberId, selectedDays: [dayIndex], repeatWeeks: 1, weekOffset })
    }
  }

  const dayCount = multiDay ? selectedDays.size : 1
  const totalCopies = dayCount * (multiDay ? repeatWeeks : 1)

  return (
    <Modal
      title="📋 일감 복사"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={handleCopy}>
            {totalCopies > 1 ? `${totalCopies}건 복사` : '복사'}
          </Button>
        </>
      }
    >
      {/* 원본 업무 정보 */}
      <div className="mb-4 px-3 py-2.5 bg-jira-bg rounded-lg border border-jira-border">
        <div className="text-[11px] text-jira-muted mb-1 font-medium">복사할 업무</div>
        <div className="text-[13px] text-jira-dark font-medium">{task.text}</div>
        {(sourceMember || sourceDay) && (
          <div className="text-[11px] text-jira-muted mt-1.5 flex items-center gap-1.5">
            {sourceMember && <span>{sourceMember.emoji} {sourceMember.name}</span>}
            {sourceMember && sourceDay && <span className="text-gray-300">·</span>}
            {sourceDay && <span>WK{wk.currentWk} {sourceDay}요일</span>}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* 담당자 */}
        <div>
          <label className="block text-[12px] font-semibold text-jira-dark mb-1.5">담당자</label>
          <select
            value={targetMemberId}
            onChange={e => setTargetMemberId(e.target.value)}
            className="w-full text-sm border border-jira-border rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-jira-blue"
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.emoji} {m.name} ({m.rank})</option>
            ))}
          </select>
        </div>

        {/* 주차 */}
        <div>
          <label className="block text-[12px] font-semibold text-jira-dark mb-1.5">주차</label>
          <div className="flex gap-2">
            {[
              { offset: 0,  label: `WK${wk.currentWk}`, sub: '이번 주' },
              { offset: -1, label: `WK${wk.prevWk}`,    sub: '지난 주' },
            ].map(({ offset, label, sub }) => (
              <button
                key={offset}
                onClick={() => setWeekOffset(offset)}
                className={`flex-1 py-2 rounded-lg border text-center transition-colors ${
                  weekOffset === offset
                    ? 'bg-jira-blue text-white border-jira-blue'
                    : 'border-jira-border text-jira-muted hover:border-jira-blue hover:text-jira-blue'
                }`}
              >
                <div className="text-[13px] font-semibold">{label}</div>
                <div className="text-[10px] opacity-70">{sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 요일 — 단일 선택 */}
        {!multiDay && (
          <div>
            <label className="block text-[12px] font-semibold text-jira-dark mb-1.5">요일</label>
            <div className="grid grid-cols-5 gap-1.5">
              {DAYS.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setDayIndex(i)}
                  className={`py-2 rounded-lg border text-[13px] font-medium transition-colors ${
                    dayIndex === i
                      ? 'bg-jira-blue text-white border-jira-blue'
                      : 'border-jira-border text-jira-muted hover:border-jira-blue hover:text-jira-blue'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 반복 옵션 */}
        <div>
          <label className="flex items-center gap-2 text-[13px] cursor-pointer text-jira-dark">
            <input
              type="checkbox"
              checked={multiDay}
              onChange={e => setMultiDay(e.target.checked)}
              className="w-4 h-4 rounded accent-jira-blue"
            />
            여러 요일에 반복 복사
          </label>
          {multiDay && (
            <div className="space-y-2 mt-2 ml-6">
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
              <div className="flex items-center gap-2 text-[13px] text-jira-mid">
                <span>매주 반복:</span>
                <select
                  value={repeatWeeks}
                  onChange={e => setRepeatWeeks(Number(e.target.value))}
                  className="border border-jira-border rounded px-2 py-0.5 text-[12px] bg-white"
                >
                  <option value={1}>이번 주만</option>
                  <option value={2}>2주</option>
                  <option value={3}>3주</option>
                  <option value={4}>4주</option>
                  <option value={6}>6주</option>
                  <option value={8}>8주</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
