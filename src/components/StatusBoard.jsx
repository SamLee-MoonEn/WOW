import { useState } from 'react'

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

export default function StatusBoard({ members, myMemberId, isAdmin, onUpdatePresence, onEndOfDay, onUpdateWorkDesc }) {
  const [editingDescId, setEditingDescId] = useState(null)
  const [descDraft, setDescDraft] = useState('')

  const now = new Date()
  const isWeekday = now.getDay() >= 1 && now.getDay() <= 5
  const isAfterWorkHour = now.getHours() >= 18
  const showUnreported = isWeekday && isAfterWorkHour

  const sorted = [...members].sort((a, b) => {
    const pa = a.presence || 'working'
    const pb = b.presence || 'working'
    if (pa === 'working' && pb !== 'working') return -1
    if (pa !== 'working' && pb === 'working') return 1
    return a.name.localeCompare(b.name)
  })

  const workingCount = members.filter(m => (m.presence || 'working') === 'working').length

  const commitDesc = (memberId, value) => {
    onUpdateWorkDesc?.(memberId, value.trim())
    setEditingDescId(null)
  }

  return (
    <div className="bg-white rounded-xl mb-5 shadow-sm overflow-hidden border border-jira-border">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-jira-border bg-jira-bg-alt flex items-center gap-2">
        <span className="text-[12px] font-bold text-jira-dark">상황판</span>
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[11px] text-jira-muted">업무 중 {workingCount}명 / 전체 {members.length}명</span>
        {showUnreported && (() => {
          const unreportedCount = members.filter(m => (m.presence || 'working') === 'working').length
          return unreportedCount > 0 ? (
            <span className="text-[11px] text-amber-600 font-semibold ml-2">⚠ 미보고 {unreportedCount}명</span>
          ) : null
        })()}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-jira-border bg-jira-bg">
              <th className="px-4 py-1.5 text-[11px] font-semibold text-jira-muted w-8" />
              <th className="px-2 py-1.5 text-[11px] font-semibold text-jira-muted">이름 / 업무 설명</th>
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
                  <td className="px-4 py-2 text-base text-center align-top pt-3">{member.emoji}</td>

                  {/* 이름 + 업무 설명 */}
                  <td className="px-2 py-2">
                    <div className="flex items-center flex-wrap gap-1">
                      <span className="text-[13px] font-semibold text-jira-dark">{member.name}</span>
                      {isMe && (
                        <span className="text-[10px] font-semibold text-jira-blue bg-white border border-blue-200 px-1.5 py-0.5 rounded-full">나</span>
                      )}
                      {member.role === 'admin' && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">관리자</span>
                      )}
                      {member.group && (
                        <span className="text-[10px] text-jira-muted bg-jira-bg border border-jira-border px-1.5 py-0.5 rounded-full">{member.group}</span>
                      )}
                    </div>

                    {/* 업무 설명 */}
                    {isMe ? (
                      editingDescId === member.id ? (
                        <input
                          value={descDraft}
                          onChange={e => setDescDraft(e.target.value)}
                          onBlur={() => commitDesc(member.id, descDraft)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitDesc(member.id, descDraft)
                            if (e.key === 'Escape') setEditingDescId(null)
                          }}
                          autoFocus
                          maxLength={60}
                          placeholder="현재 업무를 간단히 입력... (Enter 저장)"
                          className="text-[11px] text-jira-muted bg-transparent border-b border-jira-blue focus:outline-none w-full mt-1"
                        />
                      ) : (
                        <div
                          className="flex items-center gap-1 mt-0.5 cursor-pointer group/desc"
                          onClick={() => { setEditingDescId(member.id); setDescDraft(member.workDesc || '') }}
                          title="클릭하여 업무 설명 편집"
                        >
                          <span className={`text-[11px] ${member.workDesc ? 'text-jira-muted' : 'text-gray-300 italic'}`}>
                            {member.workDesc || '업무 설명 추가...'}
                          </span>
                          <span className="opacity-0 group-hover/desc:opacity-50 text-[10px] transition-opacity">✏️</span>
                        </div>
                      )
                    ) : (
                      member.workDesc && (
                        <div className="text-[11px] text-jira-muted mt-0.5">{member.workDesc}</div>
                      )
                    )}
                  </td>

                  {/* 직급 */}
                  <td className="px-2 py-2 align-top pt-3">
                    <span className="text-[12px] text-jira-muted">{member.rank}</span>
                  </td>

                  {/* 상태 배지 */}
                  <td className="px-2 py-2 align-top pt-3">
                    <PresenceBadge presence={p} />
                    {showUnreported && (member.presence || 'working') === 'working' && (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full ml-1.5 animate-pulse">
                        미보고
                      </span>
                    )}
                  </td>

                  {/* 상태 변경 버튼 (본인만) */}
                  <td className="px-2 py-2 align-top pt-2.5">
                    {isMe && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-jira-muted">내 상태 변경</span>
                        <div className="flex gap-1">
                          {Object.entries(PRESENCE).map(([key, cfg]) => (
                            <button
                              key={key}
                              onClick={() => {
                                if (key === 'off' && onEndOfDay) {
                                  onEndOfDay()
                                } else {
                                  onUpdatePresence(member.id, key)
                                }
                              }}
                              title={key === 'off' && onEndOfDay ? '클릭 시 업무 종료 보고 화면이 열립니다' : undefined}
                              className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors ${
                                p === key
                                  ? `${cfg.badge} border font-semibold`
                                  : 'border-jira-border text-jira-muted hover:bg-jira-bg'
                              }`}
                            >
                              {key === 'off' && onEndOfDay ? `${cfg.label} 📤` : cfg.label}
                            </button>
                          ))}
                        </div>
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
