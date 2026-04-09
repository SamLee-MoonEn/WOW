import { useState, useRef } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { FormField, Input } from '../ui/FormField'
import { exportBackup, importBackup, getLocalBackup, getPrevLocalBackup } from '../../utils/storage'

function BackupSection() {
  const [status, setStatus] = useState('')
  const fileRef = useRef(null)

  const handleExport = async () => {
    setStatus('백업 중...')
    try {
      const data = await exportBackup()
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      a.href = url
      a.download = `wow-backup-${date}.json`
      a.click()
      URL.revokeObjectURL(url)
      setStatus(`백업 완료 (멤버 ${data.members.length}명)`)
    } catch (e) {
      setStatus(`백업 실패: ${e.message}`)
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const memberCount = data.members?.length ?? 0
      const taskCount = data.tasks ? Object.keys(data.tasks).length : 0
      const confirmed = window.confirm(
        `백업 파일 정보:\n` +
        `- 백업 일시: ${data.exportedAt ?? '알 수 없음'}\n` +
        `- 멤버: ${memberCount}명\n` +
        `- 태스크: ${taskCount}명분\n\n` +
        `현재 데이터를 이 백업으로 덮어씁니다. 계속하시겠습니까?`
      )
      if (!confirmed) { fileRef.current.value = ''; return }
      setStatus('복원 중...')
      await importBackup(data)
      setStatus('복원 완료. 새로고침합니다...')
      setTimeout(() => window.location.reload(), 1000)
    } catch (e) {
      setStatus(`복원 실패: ${e.message}`)
    }
    fileRef.current.value = ''
  }

  const handleRestoreLocal = async (getter, label) => {
    const data = getter()
    if (!data) { setStatus(`${label} 백업이 없습니다.`); return }
    const memberCount = data.members?.length ?? 0
    const confirmed = window.confirm(
      `${label} 백업 복원:\n` +
      `- 백업 일시: ${data.exportedAt ?? '알 수 없음'}\n` +
      `- 멤버: ${memberCount}명\n\n` +
      `현재 데이터를 이 백업으로 덮어씁니다. 계속하시겠습니까?`
    )
    if (!confirmed) return
    setStatus('복원 중...')
    try {
      await importBackup(data)
      setStatus('복원 완료. 새로고침합니다...')
      setTimeout(() => window.location.reload(), 1000)
    } catch (e) { setStatus(`복원 실패: ${e.message}`) }
  }

  const localBackup = getLocalBackup()
  const prevBackup = getPrevLocalBackup()

  return (
    <div className="border-t border-jira-border pt-4">
      <p className="text-[12px] font-semibold text-jira-dark mb-1">데이터 백업 / 복원</p>
      <p className="text-[11px] text-jira-muted mb-3">멤버, 설정, 업무 데이터를 JSON 파일로 백업하거나 복원합니다. 앱 실행 시 자동으로 브라우저에 백업됩니다.</p>
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={handleExport}>📥 백업 다운로드</Button>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>📤 파일에서 복원</Button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      </div>
      {(localBackup || prevBackup) && (
        <div className="mt-2 flex flex-col gap-1">
          <p className="text-[11px] font-medium text-jira-dark">자동 백업 (브라우저 저장)</p>
          {localBackup && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-jira-muted">최신: {new Date(localBackup.exportedAt).toLocaleString('ko')} ({localBackup.members?.length}명)</span>
              <button onClick={() => handleRestoreLocal(getLocalBackup, '최신')} className="text-jira-blue hover:underline">복원</button>
            </div>
          )}
          {prevBackup && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-jira-muted">이전: {new Date(prevBackup.exportedAt).toLocaleString('ko')} ({prevBackup.members?.length}명)</span>
              <button onClick={() => handleRestoreLocal(getPrevLocalBackup, '이전')} className="text-jira-blue hover:underline">복원</button>
            </div>
          )}
        </div>
      )}
      {status && <p className="text-[11px] text-jira-muted mt-2">{status}</p>}
    </div>
  )
}

export default function AppSettingsModal({ settings, onSave, onClose }) {
  const [dailyReportChatId,   setDailyReportChatId]   = useState(settings.dailyReportChatId ?? '')
  const [weeklyReportChatId,  setWeeklyReportChatId]  = useState(settings.weeklyReportChatId ?? '')
  const [reportHeader,        setReportHeader]        = useState(settings.reportHeader  ?? '')
  const [reportFooter,        setReportFooter]        = useState(settings.reportFooter  ?? '')
  const handleSave = () => {
    onSave({ dailyReportChatId: dailyReportChatId.trim(), weeklyReportChatId: weeklyReportChatId.trim(), reportHeader: reportHeader.trim(), reportFooter: reportFooter.trim() })
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
        {/* 업무 종료 보고 Teams 채팅 ID */}
        <FormField label="업무 종료 보고 — Teams 채팅 ID" hint="업무 종료 보고를 전송할 Teams 채팅 ID를 입력하세요.">
          <Input
            value={dailyReportChatId}
            onChange={e => setDailyReportChatId(e.target.value)}
            placeholder="19:xxxxxxxx@thread.v2"
          />
          {dailyReportChatId && (
            <p className="text-[11px] text-green-600 mt-1">✓ 채팅 ID가 설정되어 있습니다.</p>
          )}
        </FormField>

        {/* 주간 계획 전송 Teams 채팅 ID */}
        <FormField label="주간 계획 전송 — Teams 채팅 ID" hint="주간 계획 이미지를 전송할 Teams 채팅 ID를 입력하세요.">
          <Input
            value={weeklyReportChatId}
            onChange={e => setWeeklyReportChatId(e.target.value)}
            placeholder="19:xxxxxxxx@thread.v2"
          />
          {weeklyReportChatId && (
            <p className="text-[11px] text-green-600 mt-1">✓ 채팅 ID가 설정되어 있습니다.</p>
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

        {/* 데이터 백업/복원 */}
        <BackupSection />
      </div>
    </Modal>
  )
}
