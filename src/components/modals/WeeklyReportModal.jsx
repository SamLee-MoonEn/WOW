import { useState, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { uploadWeeklyReport } from '../../utils/graphUtils'

export default function WeeklyReportModal({ targetEl, weekLabel, memberName, acquireToken, settings = {}, onClose }) {
  const [status, setStatus] = useState('capturing')
  const [errorMsg, setErrorMsg] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)
  const blobRef = useRef(null)

  useEffect(() => {
    if (!targetEl) {
      setStatus('error')
      setErrorMsg('캡쳐할 영역을 찾을 수 없습니다.')
      return
    }
    html2canvas(targetEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (doc) => {
        // html2canvas는 inline-flex 텍스트 정렬을 렌더링 못함
        // → 배지를 캔버스로 미리 그린 이미지로 교체
        doc.querySelectorAll('[data-status-badge]').forEach(el => {
          const text = el.textContent.trim()
          if (!text) return
          try {
            const cs = doc.defaultView?.getComputedStyle(el) ?? getComputedStyle(el)
            const bgColor = cs.backgroundColor
            const textColor = cs.color
            const borderColor = cs.borderColor
            const w = el.offsetWidth || 40
            const h = el.offsetHeight || 16

            const c = document.createElement('canvas')
            c.width = w * 2
            c.height = h * 2
            const ctx = c.getContext('2d')
            ctx.scale(2, 2)

            // 배경
            ctx.fillStyle = bgColor
            ctx.beginPath()
            ctx.roundRect(0, 0, w, h, 3)
            ctx.fill()

            // 테두리
            ctx.strokeStyle = borderColor
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.roundRect(0.5, 0.5, w - 1, h - 1, 3)
            ctx.stroke()

            // 텍스트 (정확히 중앙)
            ctx.fillStyle = textColor
            ctx.font = 'bold 10px system-ui, -apple-system, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(text, w / 2, h / 2)

            const img = doc.createElement('img')
            img.src = c.toDataURL()
            img.style.width = w + 'px'
            img.style.height = h + 'px'
            img.style.display = 'inline-block'
            img.style.verticalAlign = 'middle'
            img.style.flexShrink = '0'
            el.replaceWith(img)
          } catch { /* 실패 시 원본 유지 */ }
        })
        doc.querySelectorAll('[data-task-row]').forEach(el => {
          el.style.alignItems = 'center'
        })
      },
    })
      .then(canvas => {
        canvas.toBlob(blob => {
          blobRef.current = blob
          setPreviewUrl(URL.createObjectURL(blob))
          setStatus('preview')
        }, 'image/png')
      })
      .catch(() => {
        setStatus('error')
        setErrorMsg('화면 캡쳐에 실패했습니다.')
      })
  }, [targetEl])

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
      {status === 'capturing' && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-jira-muted">
          <div className="text-3xl animate-pulse">📸</div>
          <div className="text-sm">화면을 캡쳐하는 중...</div>
        </div>
      )}
      {status === 'sending' && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-jira-muted">
          <div className="text-3xl animate-pulse">📤</div>
          <div className="text-sm">OneDrive 업로드 후 Teams로 전송 중...</div>
        </div>
      )}
      {(status === 'preview' || status === 'success') && previewUrl && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-jira-muted">아래 이미지가 Teams로 전송됩니다. ({weekLabel})</p>
          <img src={previewUrl} alt="주간 업무 계획 미리보기" className="w-full rounded border border-jira-border" />
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
