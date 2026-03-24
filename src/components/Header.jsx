import Button from './ui/Button'

export default function Header({ onManageMembers, displayName, onLogout }) {
  return (
    <header className="bg-jira-blue text-white px-6 py-3.5 flex items-center justify-between shadow-md sticky top-0 z-40">
      <div>
        <h1 className="text-lg font-bold tracking-tight">🗂 WOW · Work Overview Window</h1>
        <div className="text-[11px] opacity-80 mt-0.5">담당자별 업무 진행 항목 / 현황 관리 · 격주 단위</div>
      </div>
      <div className="flex gap-2 items-center">
        {onManageMembers && <Button variant="secondary" size="sm" onClick={onManageMembers}>👤 담당자 관리</Button>}
        <Button variant="primary" size="sm" onClick={() => window.print()}>🖨 인쇄</Button>

        {displayName && (
          <>
            <div className="w-px h-5 bg-white/30 mx-1" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[13px] font-bold">
                {displayName.charAt(0)}
              </div>
              <span className="text-[13px] font-medium opacity-90">{displayName}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={onLogout}>로그아웃</Button>
          </>
        )}
      </div>
    </header>
  )
}
