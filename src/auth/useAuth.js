import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { loginRequest } from './msalConfig'

export function useAuth() {
  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const account = accounts[0] ?? null

  const login = () => instance.loginRedirect(loginRequest)

  const logout = () =>
    instance.logoutPopup({ postLogoutRedirectUri: window.location.origin })

  const acquireToken = async () => {
    const res = await instance.acquireTokenSilent({ scopes: ['User.Read'], account })
    return res.accessToken
  }

  return {
    isAuthenticated,
    account,
    displayName: account?.name ?? '',
    email: account?.username ?? '',
    login,
    logout,
    acquireToken,
  }
}
