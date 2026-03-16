const PRESENCE = {
  working:  { label: '업무 중', dot: 'bg-green-500',  badge: 'bg-green-50 border-green-200 text-green-700',  pulse: true  },
  off:      { label: '종료',    dot: 'bg-gray-400',   badge: 'bg-gray-50 border-gray-200 text-gray-500',    pulse: false },
  vacation: { label: '휴가',    dot: 'bg-sky-400',    badge: 'bg-sky-50 border-sky-200 text-sky-600',       pulse: false },
}

function PresenceBadge({ presence }) {
  const p = presence || 'working'
  const cfg = PRESENCE[p] || PRESENCE.working
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
        {cfg.label}
      </span>
    </div>
  )
}

export default function StatusBoard({ members, myMemberId, onUpdatePresence }) {
  // 업무 중 먼저, 그 다음 이름순
  const sorted = [...members].sort((a, b) => {
    const pa = a.presence || 'working'
    const pb = b.presence || 'working'
    if (pa === 'working' && pb !== 'working') return -1
    if (pa !== 'working' && pb === 'working') return 1
    return a.name.localeCompare(b.name)
  })

  const workingCount = members.filter(m => (m.presence || 'working') === 'working').length

  return (
    <div className="bg-white rounded-xl mb-5 shadow-sm overflow-hidden border border-jira-border">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-jira-border bg-jira-bg-alt flex items-center gap-2">
        <span className="text-[12px] font-bold text-jira-dark">상황판</span>
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[11px] text-jira-muted">업무 중 {workingCount}명 / 전체 {members.length}명</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-jira-border bg-jira-bg">
              <th className="px-4 py-1.5 text-[11px] font-semibold text-jira-muted w-8" />
              <th className="px-2 py-1.5 text-[11px] font-semibold text-jira-muted">이름</th>
              <th className="px-2 py-1.5 text-[11px] font-semibold text-jira-muted">직급</th>
              <th className="px-2 py-1.5 text-[11px] font-semibold text-jira-muted">상태</th>
              <th className="px-2 py-1.5 text-[11px] font-semibold text-jira-muted" />
            </tr>
          </thead>
          <tbody className="divide-y divide-jira-border">
            {sorted.map(member => {
              const p = member.presence || 'working'
              const isMe = member.id === myMemberId

              return (
                <tr
                  key={member.id}
                  className={`transition-colors ${isMe ? 'bg-jira-blue-light/40' : 'hover:bg-jira-bg'}`}
                >
                  {/* 이모지 */}
                  <td className="px-4 py-2 text-base text-center">{member.emoji}</td>

                  {/* 이름 */}
                  <td className="px-2 py-2">
                    <span className="text-[13px] font-semibold text-jira-dark">{member.name}</span>
                    {isMe && (
                      <span className="ml-1.5 text-[10px] font-semibold text-jira-blue bg-white border border-blue-200 px-1.5 py-0.5 rounded-full">나</span>
                    )}
                  </td>

                  {/* 직급 */}
                  <td className="px-2 py-2">
                    <span className="text-[12px] text-jira-muted">{member.rank}</span>
                  </td>

                  {/* 상태 배지 */}
                  <td className="px-2 py-2">
                    <PresenceBadge presence={p} />
                  </td>

                  {/* 상태 변경 버튼 (본인만) */}
                  <td className="px-2 py-2">
                    {isMe && (
                      <div className="flex gap-1">
                        {Object.entries(PRESENCE).map(([key, cfg]) => (
                          <button
                            key={key}
                            onClick={() => onUpdatePresence(member.id, key)}
                            className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors ${
                              p === key
                                ? `${cfg.badge} border font-semibold`
                                : 'border-jira-border text-jira-muted hover:bg-jira-bg'
                            }`}
                          >
                            {cfg.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
