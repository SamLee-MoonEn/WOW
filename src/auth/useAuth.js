import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { loginRequest } from './msalConfig'

export function useAuth() {
  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const account = accounts[0] ?? null

  const login = () => instance.loginRedirect(loginRequest)

  const logout = () =>
    instance.logoutPopup({ postLogoutRedirectUri: window.location.origin })

  return {
    isAuthenticated,
    account,
    // 표시 이름: "홍길동"
    displayName: account?.name ?? '',
    // 이메일: "hong@company.com"
    email: account?.username ?? '',
    login,
    logout,
  }
}
