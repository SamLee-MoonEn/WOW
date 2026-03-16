import { useState } from 'react'

const DISMISSED_KEY = 'wow_info_dismissed'

export default function InfoBanner() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === '1')

  if (dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="bg-white rounded-lg px-4 py-3.5 mb-5 border-l-4 border-jira-blue shadow-sm relative">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-jira-muted hover:text-jira-dark hover:bg-jira-bg rounded p-1 text-xs transition-colors"
        title="닫기"
      >
        ✕
      </button>
      <p className="text-[12px] text-jira-mid leading-relaxed mb-1">
        <span className="text-[#de350b] font-bold">*</span>{' '}
        <strong>WOW</strong>(Work Overview Window); 업무 현황판{' '}
        <span className="text-jira-blue italic">"It's not what you think. 😄"</span>
      </p>
      <p className="text-[12px] text-jira-mid leading-relaxed mb-1">
        <span className="text-[#de350b] font-bold">**</span>{' '}
        여기서 무엇을 볼 수 있나요? 담당자별 ① 업무 진행 항목/규모, ② 업무 진행 현황
      </p>
      <p className="text-[12px] text-jira-mid leading-relaxed">
        <span className="text-[#de350b] font-bold">***</span>{' '}
        무엇이 더 보완되어야 할까요? ① 주간 업무 진행 현황, ② 일간 업무 진행 현황
      </p>
    </div>
  )
}
