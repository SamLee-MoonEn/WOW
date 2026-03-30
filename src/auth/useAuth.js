import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { loginRequest } from './msalConfig'

export function useAuth() {
  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const account = accounts[0] ?? null

  const login = () => instance.loginRedirect(loginRequest)

  const logout = () =>
    instance.logoutPopup({ postLogoutRedirectUri: window.location.origin })

  const acquireToken = async (scopes = ['User.Read']) => {
    try {
      const res = await instance.acquireTokenSilent({ scopes, account })
      return res.accessToken
    } catch (e) {
      if (e instanceof InteractionRequiredAuthError) {
        // 동의가 필요한 경우 팝업으로 재시도
        const res = await instance.acquireTokenPopup({ scopes, account })
        return res.accessToken
      }
      throw e
    }
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
