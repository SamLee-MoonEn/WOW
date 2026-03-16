import { useAuth } from '../auth/useAuth'

export default function LoginPage() {
  const { login } = useAuth()

  return (
    <div className="min-h-screen bg-jira-bg flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-sm text-center">
        {/* Logo */}
        <div className="text-5xl mb-4">🗂</div>
        <h1 className="text-2xl font-bold text-jira-dark mb-1">WOW</h1>
        <p className="text-sm text-jira-muted mb-8">Work Overview Window</p>

        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-lg border-2 border-gray-200 hover:border-jira-blue hover:bg-jira-blue-light transition-all font-semibold text-jira-dark text-sm group"
        >
          {/* Microsoft Logo */}
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          Microsoft 계정으로 로그인
        </button>

        <p className="mt-6 text-[11px] text-jira-muted">
          사내 Microsoft 계정(Azure AD)으로 로그인해주세요.
        </p>
      </div>
    </div>
  )
}
