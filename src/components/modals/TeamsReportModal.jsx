import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { formatTeamsText, getTodayLabel, preserveIndentToHtml } from '../../utils/teamsUtils'
import { sendChatMessage } from '../../utils/graphUtils'

export default function TeamsReportModal({ memberName, todayTasks, onClose, onConfirmEnd, settings = {}, acquireToken }) {
  const [sendStatus, setSendStatus] = useState('idle') // idle | sending | success | error
  const [copied, setCopied] = useState(false)

  const dateLabel = getTodayLabel()
  const defaultText = formatTeamsText(memberName, todayTasks, dateLabel, settings.reportHeader, settings.reportFooter)
  const [text, setText] = useState(defaultText)

  const isEdited = text !== defaultText

  const handleReset = () => {
    setText(defaultText)
    setSendStatus('idle')
  }

  const handleSend = async () => {
    setSendStatus('sending')
    try {
      const chatId = settings.dailyReportChatId
      if (!chatId) throw new Error('설정에서 업무 종료 보고 채팅 ID를 입력해주세요.')
      const htmlText = preserveIndentToHtml(text)
      await sendChatMessage(chatId, htmlText, acquireToken)
      setSendStatus('success')
      onConfirmEnd?.()
    } catch {
      setSendStatus('error')
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirmEnd = () => {
    onConfirmEnd?.()
  }

  const hasChatId = !!settings.dailyReportChatId

  const footer = (
    <>
      {sendStatus === 'success' ? (
        <span className="text-sm text-jira-green font-medium mr-auto">✅ 전송 완료 · 업무 종료 처리되었습니다.</span>
      ) : sendStatus === 'error' ? (
        <span className="text-sm text-jira-red font-medium mr-auto">❌ 전송 실패. 복사 후 수동으로 붙여넣기 해주세요.</span>
      ) : null}

      {isEdited && sendStatus === 'idle' && (
        <Button variant="ghost" size="sm" onClick={handleReset}>↺ 초기화</Button>
      )}
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? '✓ 복사됨' : '📋 복사'}
      </Button>
      {hasChatId && sendStatus !== 'success' && (
        <Button
          variant="primary"
          size="sm"
          onClick={handleSend}
          disabled={sendStatus === 'sending'}
        >
          {sendStatus === 'sending' ? '전송 중...' : 'Teams 전송 후 종료'}
        </Button>
      )}
      {sendStatus !== 'success' && (
        <Button variant="outline" size="sm" onClick={handleConfirmEnd}>
          종료만 처리
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={onClose}>
        {sendStatus === 'success' ? '닫기' : '취소'}
      </Button>
    </>
  )

  return (
    <Modal title="📤 업무 종료 보고" onClose={onClose} footer={footer} size="md">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-jira-muted">
          오늘({dateLabel}) 업무 목록을 Teams로 전송합니다.
          {!hasChatId && (
            <span className="ml-1 text-amber-600 font-medium">
              (채팅 ID 미설정 — 복사 후 수동 전송)
            </span>
          )}
        </p>
        {isEdited && (
          <span className="text-[11px] text-amber-600 font-medium shrink-0 ml-2">수정됨</span>
        )}
      </div>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setSendStatus('idle') }}
        className="w-full bg-jira-bg border border-jira-border rounded p-4 text-[13px] text-jira-dark leading-relaxed font-sans resize-none focus:outline-none focus:ring-2 focus:ring-jira-blue focus:border-transparent"
        rows={Math.max(8, text.split('\n').length + 1)}
        spellCheck={false}
      />
      {sendStatus !== 'success' && (
        <p className="text-[11px] text-jira-muted mt-2">
          · <strong>Teams 전송 후 종료</strong>: 전송 성공 시 자동으로 업무 종료 처리됩니다.<br />
          · <strong>종료만 처리</strong>: Teams 전송 없이 상태만 종료로 변경합니다.<br />
          · <strong>취소</strong>: 닫아도 업무 중 상태가 유지됩니다.
        </p>
      )}
    </Modal>
  )
}
