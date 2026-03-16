import { useEffect } from 'react'
import Button from '../ui/Button'

export default function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(9,30,66,0.54)]"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-white rounded-lg p-6 w-[380px] max-w-[95vw] shadow-2xl">
        <div className="text-base font-bold mb-2 text-jira-dark">{title}</div>
        <div className="text-[13px] text-jira-mid mb-5 leading-relaxed">{message}</div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>취소</Button>
          <Button variant="danger" onClick={onConfirm}>삭제</Button>
        </div>
      </div>
    </div>
  )
}
