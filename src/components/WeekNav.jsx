import Button from './ui/Button'
import { getWeekDates, formatDate } from '../utils/weekUtils'

export default function WeekNav({ wk, onPrev, onNext, onToday, isCurrentWeek, rightSlot }) {
  const prevDates = getWeekDates(wk.prevMonday)
  const curDates = getWeekDates(wk.currentMonday)
  const label =
    `WK${wk.prevWk} (${formatDate(prevDates[0])}~${formatDate(prevDates[4])}) ↔ ` +
    `WK${wk.currentWk} (${formatDate(curDates[0])}~${formatDate(curDates[4])})`

  return (
    <div className="flex flex-wrap items-center gap-3 mb-5 bg-white px-4 py-3 rounded-lg shadow-sm">
      <span className="text-[13px] font-semibold text-jira-mid">📅 기준 기간:</span>
      <Button variant="outline" size="sm" onClick={onNext}>◀ 다음</Button>
      <span className="text-sm font-bold text-jira-dark min-w-[260px] text-center">{label}</span>
      <Button variant="outline" size="sm" onClick={onPrev}>이전 ▶</Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onToday}
        className={isCurrentWeek ? 'opacity-40 cursor-default pointer-events-none' : ''}
      >
        오늘로
      </Button>
      {rightSlot && <div className="ml-auto">{rightSlot}</div>}
    </div>
  )
}
