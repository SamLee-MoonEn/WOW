import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { FormField, Input } from '../ui/FormField'

export default function AppSettingsModal({ settings, onSave, onClose }) {
  const [webhookUrl,    setWebhookUrl]    = useState(settings.webhookUrl    ?? import.meta.env.VITE_TEAMS_WEBHOOK_URL ?? '')
  const [reportHeader,  setReportHeader]  = useState(settings.reportHeader  ?? '')
  const [reportFooter,  setReportFooter]  = useState(settings.reportFooter  ?? '')
  const handleSave = () => {
    onSave({ webhookUrl: webhookUrl.trim(), reportHeader: reportHeader.trim(), reportFooter: reportFooter.trim() })
    onClose()
  }

  return (
    <Modal
      title="⚙️ 앱 설정"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={handleSave}>저장</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Webhook URL */}
        <FormField label="Teams Webhook URL" hint="Power Automate HTTP 트리거 URL을 입력하세요.">
          <Input
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://prod-xx.westus.logic.azure.com/..."
          />
          {webhookUrl && (
            <p className="text-[11px] text-green-600 mt-1">✓ Webhook URL이 설정되어 있습니다.</p>
          )}
        </FormField>

        {/* 보고서 헤더 */}
        <FormField label="업무 종료 보고 — 상단 고정 문구" hint="보고서 내용 위에 항상 추가됩니다. (선택)">
          <textarea
            value={reportHeader}
            onChange={e => setReportHeader(e.target.value)}
            placeholder="예) 안녕하세요. 오늘의 업무 종료 보고입니다."
            rows={3}
            className="w-full text-[13px] px-3 py-2 border border-jira-border rounded-lg focus:outline-none focus:border-jira-blue resize-none bg-jira-bg"
          />
        </FormField>

        {/* 보고서 푸터 */}
        <FormField label="업무 종료 보고 — 하단 고정 문구" hint="보고서 내용 아래에 항상 추가됩니다. (선택)">
          <textarea
            value={reportFooter}
            onChange={e => setReportFooter(e.target.value)}
            placeholder="예) 감사합니다."
            rows={3}
            className="w-full text-[13px] px-3 py-2 border border-jira-border rounded-lg focus:outline-none focus:border-jira-blue resize-none bg-jira-bg"
          />
        </FormField>
      </div>
    </Modal>
  )
}
