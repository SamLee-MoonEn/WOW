import { STATUS_CONFIG } from '../../utils/statusUtils'

export default function StatusBadge({ status, onClick }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['none']

  if (!cfg.label && !onClick) return null

  return (
    <span
      onClick={onClick}
      title={onClick ? '클릭하여 상태 변경' : undefined}
      data-status-badge
      className={`inline-flex items-center justify-center min-w-[24px] px-1.5 py-px rounded text-[10px] font-bold tracking-wide uppercase whitespace-nowrap shrink-0 ${cfg.cls} ${onClick ? `${cfg.hoverCls} cursor-pointer` : ''}`}
    >
      {cfg.label || '○'}
    </span>
  )
}
