import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { formatTeamsText, getTodayLabel, sendToTeamsWebhook } from '../../utils/teamsUtils'

export default function TeamsReportModal({ memberName, todayTasks, onClose }) {
  const [sendStatus, setSendStatus] = useState('idle') // idle | sending | success | error
  const [copied, setCopied] = useState(false)

  const dateLabel = getTodayLabel()
  const text = formatTeamsText(memberName, todayTasks, dateLabel)
  const webhookUrl = import.meta.env.VITE_TEAMS_WEBHOOK_URL

  const handleSend = async () => {
    setSendStatus('sending')
    try {
      await sendToTeamsWebhook(webhookUrl, memberName, todayTasks, dateLabel)
      setSendStatus('success')
    } catch {
      setSendStatus('error')
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const footer = (
    <>
      {sendStatus === 'success' ? (
        <span className="text-sm text-jira-green font-medium mr-auto">✅ Teams로 전송되었습니다!</span>
      ) : sendStatus === 'error' ? (
        <span className="text-sm text-jira-red font-medium mr-auto">❌ 전송 실패. 복사 후 수동으로 붙여넣기 해주세요.</span>
      ) : null}

      <Button variant="secondary" size="sm" onClick={handleCopy}>
        {copied ? '✓ 복사됨' : '📋 복사'}
      </Button>
      {webhookUrl && (
        <Button
          variant="primary"
          size="sm"
          onClick={handleSend}
          disabled={sendStatus === 'sending' || sendStatus === 'success'}
        >
          {sendStatus === 'sending' ? '전송 중...' : 'Teams로 전송'}
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={onClose}>닫기</Button>
    </>
  )

  return (
    <Modal title="📤 업무 종료 보고" onClose={onClose} footer={footer} size="md">
      <p className="text-xs text-jira-muted mb-3">
        오늘({dateLabel}) 업무 목록을 Teams로 전송합니다.
        {!webhookUrl && (
          <span className="ml-1 text-amber-600 font-medium">
            (VITE_TEAMS_WEBHOOK_URL 미설정 — 복사 후 수동 전송)
          </span>
        )}
      </p>
      <pre className="bg-jira-bg border border-jira-border rounded p-4 text-[13px] text-jira-dark whitespace-pre-wrap leading-relaxed font-sans">
        {text}
      </pre>
    </Modal>
  )
}
