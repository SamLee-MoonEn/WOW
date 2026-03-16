import { useEffect } from 'react'

export default function Modal({ title, onClose, children, footer, size = 'md' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const sizeClass = size === 'sm' ? 'w-96' : 'w-[520px]'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(9,30,66,0.54)]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`bg-white rounded-lg ${sizeClass} max-w-[95vw] max-h-[90vh] flex flex-col shadow-2xl`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-jira-border">
          <span className="text-base font-bold text-jira-dark">{title}</span>
          <button
            onClick={onClose}
            className="text-jira-muted hover:text-jira-dark hover:bg-jira-bg rounded p-1 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto scrollbar-thin flex-1">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-jira-border flex justify-end gap-2">{footer}</div>
        )}
      </div>
    </div>
  )
}
