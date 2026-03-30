import { useState, useRef } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { uploadWeeklyReport } from '../../utils/graphUtils'

export default function WeeklyReportModal({ initialBlob, captureError, weekLabel, memberName, acquireToken, settings = {}, onClose }) {
  const blobRef = useRef(initialBlob)
  const [previewUrl] = useState(initialBlob ? URL.createObjectURL(initialBlob) : null)
  const [status, setStatus] = useState(initialBlob ? 'preview' : 'error')
  const [errorMsg, setErrorMsg] = useState(captureError ?? (initialBlob ? '' : '캡처된 이미지가 없습니다.'))

  const handleSend = async () => {
    setStatus('sending')
    try {
      const webhookUrl = settings.webhookUrl || import.meta.env.VITE_TEAMS_WEBHOOK_URL
      if (!webhookUrl) throw new Error('설정에서 Webhook URL을 입력해주세요.')

      const filename = `${weekLabel.replace(/[^a-zA-Z0-9가-힣_-]/g, '-')}-${memberName}.png`
      const imageUrl = await uploadWeeklyReport(blobRef.current, filename, acquireToken)

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${memberName} 주간 업무 계획 · ${weekLabel}`,
          memberName,
          imageUrl,
        }),
      })
      if (!res.ok) throw new Error(`전송 실패 (HTTP ${res.status})`)
      setStatus('success')
    } catch (e) {
      setErrorMsg(e.message)
      setStatus('error')
    }
  }

  const footer = (
    <>
      {status === 'success' && (
        <span className="text-sm text-jira-green font-medium mr-auto">✅ 전송 완료</span>
      )}
      {status === 'error' && (
        <span className="text-sm text-jira-red font-medium mr-auto">❌ {errorMsg}</span>
      )}
      {status === 'preview' && (
        <Button variant="primary" size="sm" onClick={handleSend}>Teams 전송</Button>
      )}
      <Button variant="ghost" size="sm" onClick={onClose}>
        {status === 'success' ? '닫기' : '취소'}
      </Button>
    </>
  )

  return (
    <Modal title="📸 주간 업무 계획 전송" onClose={onClose} footer={footer} size="lg">
      {status === 'sending' && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-jira-muted">
          <div className="text-3xl animate-pulse">📤</div>
          <div className="text-sm">OneDrive 업로드 후 Teams로 전송 중...</div>
        </div>
      )}
      {(status === 'preview' || status === 'success') && previewUrl && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-jira-muted">아래 이미지가 Teams로 전송됩니다. ({weekLabel})</p>
          <img
            src={previewUrl}
            alt="주간 업무 계획 미리보기"
            className="w-full rounded border border-jira-border"
          />
        </div>
      )}
      {status === 'error' && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="text-3xl">⚠️</div>
          <div className="text-sm text-jira-muted">{errorMsg}</div>
        </div>
      )}
    </Modal>
  )
}
