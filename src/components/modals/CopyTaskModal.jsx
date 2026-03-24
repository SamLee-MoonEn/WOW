import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { DAYS, getWeekKeys } from '../../utils/weekUtils'

export default function CopyTaskModal({ task, fromKey, members, wk, onCopy, onClose }) {
  const fromParts = fromKey.split('_')
  // key format: {memberId}_{YYYY}_{WNN}_{dayIndex}
  // memberId is the first segment, dayIndex is the last
  const sourceDayIndex = parseInt(fromParts[fromParts.length - 1])
  const defaultDay = isNaN(sourceDayIndex) ? 0 : sourceDayIndex

  const [targetMemberId, setTargetMemberId] = useState(members[0]?.id || '')
  const [weekOffset, setWeekOffset] = useState(0) // 0=current, -1=prev
  const [dayIndex, setDayIndex] = useState(defaultDay)

  const weekKey = weekOffset === 0 ? wk.current : wk.prev
  const weekLabel = weekOffset === 0 ? `WK${wk.currentWk} (이번 주)` : `WK${wk.prevWk} (지난 주)`

  const handleCopy = () => {
    if (!targetMemberId) return
    const toKey = `${targetMemberId}_${weekKey}_${dayIndex}`
    onCopy(toKey)
  }

  return (
    <Modal
      title="📋 일감 복사"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={handleCopy}>복사</Button>
        </>
      }
    >
      <div className="mb-3 px-3 py-2 bg-jira-bg rounded border border-jira-border text-[12px] text-jira-dark">
        <span className="text-jira-muted mr-1">복사할 업무:</span>
        {task.text}
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-[12px] font-semibold text-jira-dark mb-1">담당자</label>
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

        <div>
          <label className="block text-[12px] font-semibold text-jira-dark mb-1">주차</label>
          <div className="flex gap-2">
            {[0, -1].map(offset => (
              <button
                key={offset}
                onClick={() => setWeekOffset(offset)}
                className={`text-[12px] px-3 py-1 rounded border transition-colors ${
                  weekOffset === offset
                    ? 'bg-jira-blue text-white border-jira-blue'
                    : 'border-jira-border text-jira-muted hover:border-jira-blue hover:text-jira-blue'
                }`}
              >
                {offset === 0 ? `WK${wk.currentWk} 이번 주` : `WK${wk.prevWk} 지난 주`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-jira-dark mb-1">요일</label>
          <div className="flex gap-1.5">
            {DAYS.map((d, i) => (
              <button
                key={i}
                onClick={() => setDayIndex(i)}
                className={`text-[12px] w-10 py-1 rounded border transition-colors ${
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
      </div>
    </Modal>
  )
}
