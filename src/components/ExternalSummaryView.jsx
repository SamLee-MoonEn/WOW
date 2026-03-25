const PRESENCE = {
  working:  { label: '업무 중', dot: 'bg-green-500', badge: 'bg-green-50 border-green-200 text-green-700', pulse: true },
  off:      { label: '종료',    dot: 'bg-gray-400',  badge: 'bg-gray-50 border-gray-200 text-gray-400',   pulse: false },
  vacation: { label: '휴가',    dot: 'bg-sky-400',   badge: 'bg-sky-50 border-sky-200 text-sky-600',      pulse: false },
}

const PRESENCE_ORDER = { working: 0, vacation: 1, off: 2 }

function MemberCard({ member }) {
  const p = member.presence || 'working'
  const cfg = PRESENCE[p] || PRESENCE.working
  const isOff = p === 'off'

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border transition-colors ${isOff ? 'border-jira-border opacity-60' : 'border-jira-border hover:border-jira-blue hover:shadow-md'}`}>
      {/* 상단: 이모지 + 상태 */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-4xl">{member.emoji}</span>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* 이름 + 직급 */}
      <div className="mb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-[14px] text-jira-dark">{member.name}</span>
          {member.role === 'admin' && (
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">관리자</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[12px] text-jira-muted">{member.rank}</span>
          {member.group && (
            <span className="text-[10px] text-jira-muted bg-jira-bg border border-jira-border px-1.5 py-0.5 rounded-full">{member.group}</span>
          )}
        </div>
      </div>

      {/* 업무 설명 */}
      <div className="mt-2.5 pt-2.5 border-t border-jira-border min-h-[36px]">
        {member.workDesc ? (
          <p className="text-[12px] text-jira-dark leading-snug">{member.workDesc}</p>
        ) : (
          <p className="text-[12px] text-gray-300 italic">업무 설명 없음</p>
        )}
      </div>
    </div>
  )
}

function GroupSection({ label, members }) {
  return (
    <div>
      {label && (
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[12px] font-bold text-jira-muted uppercase tracking-wide">{label}</span>
          <div className="flex-1 h-px bg-jira-border" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1 sm:grid-cols-3 lg:grid-cols-4">
        {members.map(m => <MemberCard key={m.id} member={m} />)}
      </div>
    </div>
  )
}

export default function ExternalSummaryView({ members }) {
  const sorted = [...members].sort((a, b) => {
    const pa = PRESENCE_ORDER[a.presence || 'working'] ?? 0
    const pb = PRESENCE_ORDER[b.presence || 'working'] ?? 0
    if (pa !== pb) return pa - pb
    return a.name.localeCompare(b.name, 'ko')
  })

  const workingCount = members.filter(m => (m.presence || 'working') === 'working').length

  // 그룹별 분류
  const groupMap = {}
  for (const m of sorted) {
    const g = m.group || ''
    if (!groupMap[g]) groupMap[g] = []
    groupMap[g].push(m)
  }

  const hasGroups = Object.keys(groupMap).some(g => g !== '')

  const groupKeys = Object.keys(groupMap).sort((a, b) => {
    if (!a && b) return 1
    if (a && !b) return -1
    return a.localeCompare(b, 'ko')
  })

  return (
    <div>
      {/* 안내 배너 */}
      <div className="bg-white rounded-xl mb-5 shadow-sm border border-jira-border px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-[14px] font-bold text-jira-dark mb-0.5">팀 업무 현황</h2>
          <p className="text-[12px] text-jira-muted">
            담당자별 현재 업무 설명을 확인하고 연락할 담당자를 찾아보세요.
          </p>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <div className="text-[13px] font-bold text-green-600">{workingCount}명</div>
          <div className="text-[11px] text-jira-muted">업무 중</div>
        </div>
      </div>

      {/* 멤버 카드 목록 */}
      {members.length === 0 ? (
        <div className="text-center py-16 text-jira-muted">
          <div className="text-5xl mb-3">👤</div>
          <div className="text-sm">등록된 팀원이 없습니다</div>
        </div>
      ) : hasGroups ? (
        <div className="flex flex-col gap-6">
          {groupKeys.map(g => (
            <GroupSection key={g || '__none__'} label={g || null} members={groupMap[g]} />
          ))}
        </div>
      ) : (
        <GroupSection label={null} members={sorted} />
      )}
    </div>
  )
}
