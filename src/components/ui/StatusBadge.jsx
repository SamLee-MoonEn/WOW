import { STATUS_CONFIG } from '../../utils/statusUtils'

export default function StatusBadge({ status, onClick }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['none']

  // onClick 없이 none 상태면 표시하지 않음
  if (!cfg.label && !onClick) return null

  return (
    <span
      onClick={onClick}
      title={onClick ? '클릭하여 상태 변경' : undefined}
      className={`inline-block w-[56px] px-1 text-center rounded text-[10px] font-bold tracking-wide uppercase shrink-0 leading-[18px] whitespace-nowrap overflow-hidden text-ellipsis ${cfg.cls} ${onClick ? `${cfg.hoverCls} cursor-pointer` : ''}`}
    >
      {cfg.label || '○'}
    </span>
  )
}
