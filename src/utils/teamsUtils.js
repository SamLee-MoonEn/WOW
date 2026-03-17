import { getWeekKeys, formatDateFull } from './weekUtils'

export function getTodayTasks(memberId, tasks) {
  const wk = getWeekKeys(0)
  const today = new Date()
  const dayIndex = (today.getDay() + 6) % 7 // Mon=0 ... Fri=4, Sat=5, Sun=6
  if (dayIndex > 4) return [] // 주말은 업무 없음
  const key = `${memberId}_${wk.current}_${dayIndex}`
  return tasks[key] || []
}

export function getTodayLabel() {
  const today = new Date()
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  return `${formatDateFull(today)} (${dayNames[today.getDay()]})`
}

export function formatTeamsText(memberName, todayTasks, dateLabel) {
  const groups = {
    done: todayTasks.filter(t => t.status === 'done'),
    progress: todayTasks.filter(t => t.status === 'progress'),
    none: todayTasks.filter(t => t.status === 'none'),
    canceled: todayTasks.filter(t => t.status === 'canceled'),
  }

  const lines = [`📋 ${memberName} · 업무 종료 보고 · ${dateLabel}`, '']

  const sections = [
    { emoji: '✅', label: '완료', tasks: groups.done },
    { emoji: '🔄', label: '진행 중', tasks: groups.progress },
    { emoji: '⬜', label: '대기', tasks: groups.none },
    { emoji: '❌', label: '취소', tasks: groups.canceled },
  ]

  let hasAny = false
  for (const { emoji, label, tasks } of sections) {
    if (tasks.length === 0) continue
    hasAny = true
    lines.push(`${emoji} ${label}`)
    tasks.forEach(t => {
      const memo = t.memo ? ` (${t.memo})` : ''
      lines.push(`• ${t.text}${memo}`)
    })
    lines.push('')
  }

  if (!hasAny) {
    lines.push('등록된 업무가 없습니다.')
  }

  return lines.join('\n').trimEnd()
}

export async function sendToTeamsWebhook(webhookUrl, memberName, todayTasks, dateLabel) {
  const text = formatTeamsText(memberName, todayTasks, dateLabel)

  // Power Automate HTTP 트리거에 전달할 JSON 페이로드
  const payload = {
    title: `${memberName} 업무 종료 보고`,
    date: dateLabel,
    memberName,
    message: text,
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`Teams 전송 실패 (HTTP ${res.status})`)
  }
}
