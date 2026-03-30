import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { DAYS, getWeekKeys } from '../../utils/weekUtils'

const DAY_LABELS = ['월', '화', '수', '목', '금']

export default function CopyTaskModal({ task, fromKey, members, myMemberId, wk, baseWeekOffset, onCopy, onClose }) {
  const fromParts = fromKey.split('_')
  const sourceMemberId = fromParts[0]
  const sourceDayIndex = parseInt(fromParts[fromParts.length - 1])
  const defaultDay = isNaN(sourceDayIndex) ? 0 : sourceDayIndex

  const sourceMember = members.find(m => m.id === sourceMemberId)
  const sourceDay = !isNaN(sourceDayIndex) ? DAYS[sourceDayIndex] : null

  // 주차 옵션: 지난 주 ~ 8주 후
  const weekOptions = []
  for (let i = -1; i <= 8; i++) {
    const info = getWeekKeys(baseWeekOffset + i)
    const label = i === -1 ? '지난 주' : i === 0 ? '이번 주' : i === 1 ? '다음 주' : `${i}주 후`
    weekOptions.push({ offset: i, wkNum: info.currentWk, label, weekKey: info.current })
  }

  const [targetMemberId, setTargetMemberId] = useState(myMemberId || members[0]?.id || '')
  const [startWeekIdx, setStartWeekIdx] = useState(1) // weekOptions index (default: 이번 주)
  const [dayIndex, setDayIndex] = useState(defaultDay)
  const [multiDay, setMultiDay] = useState(false)
  const [selectedDays, setSelectedDays] = useState(new Set([defaultDay]))
  const [repeatWeeks, setRepeatWeeks] = useState(1)

  const toggleDay = (d) => {
    setSelectedDays(prev => {
      const next = new Set(prev)
      next.has(d) ? next.delete(d) : next.add(d)
      return next
    })
  }

  const handleCopy = () => {
    if (!targetMemberId) return
    const startOffset = weekOptions[startWeekIdx].offset
    const days = multiDay ? [...selectedDays].sort() : [dayIndex]
    const weeks = multiDay ? repeatWeeks : 1
    onCopy({ targetMemberId, selectedDays: days, repeatWeeks: weeks, startWeekOffset: startOffset })
  }

  const dayCount = multiDay ? selectedDays.size : 1
  const totalCopies = dayCount * (multiDay ? repeatWeeks : 1)

  // 반복 시 마지막 주차 표시
  const endWeekIdx = startWeekIdx + (multiDay ? repeatWeeks : 1) - 1
  const endWeekInfo = endWeekIdx < weekOptions.length ? weekOptions[endWeekIdx] : null

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
          <div className="flex gap-1.5 flex-wrap">
            {weekOptions.slice(0, 5).map((opt, idx) => (
              <button
                key={opt.offset}
                onClick={() => setStartWeekIdx(idx)}
                className={`flex-1 min-w-0 py-2 rounded-lg border text-center transition-colors ${
                  startWeekIdx === idx
                    ? 'bg-jira-blue text-white border-jira-blue'
                    : 'border-jira-border text-jira-muted hover:border-jira-blue hover:text-jira-blue'
                }`}
              >
                <div className="text-[12px] font-semibold">WK{opt.wkNum}</div>
                <div className="text-[10px] opacity-70">{opt.label}</div>
              </button>
            ))}
          </div>
          {/* 더 먼 주차: 드롭다운 */}
          {startWeekIdx >= 5 && (
            <div className="mt-1.5 text-[12px] text-jira-blue font-medium">
              WK{weekOptions[startWeekIdx].wkNum} ({weekOptions[startWeekIdx].label}) 선택됨
            </div>
          )}
          <select
            value={startWeekIdx}
            onChange={e => setStartWeekIdx(Number(e.target.value))}
            className="mt-1.5 w-full text-[12px] border border-jira-border rounded px-2 py-1 bg-white text-jira-mid"
          >
            {weekOptions.map((opt, idx) => (
              <option key={opt.offset} value={idx}>
                WK{opt.wkNum} — {opt.label}
              </option>
            ))}
          </select>
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
                  {[1, 2, 3, 4, 6, 8].filter(n => startWeekIdx + n - 1 < weekOptions.length).map(n => (
                    <option key={n} value={n}>
                      {n === 1 ? '선택한 주만' : `${n}주 연속`}
                    </option>
                  ))}
                </select>
              </div>
              {repeatWeeks > 1 && endWeekInfo && (
                <div className="text-[11px] text-jira-muted">
                  WK{weekOptions[startWeekIdx].wkNum} ~ WK{endWeekInfo.wkNum} ({repeatWeeks}주간)
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
