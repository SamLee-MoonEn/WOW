const GRAPH = 'https://graph.microsoft.com/v1.0'

export async function uploadWeeklyReport(blob, filename, acquireToken) {
  const token = await acquireToken(['Files.ReadWrite'])
  const res = await fetch(
    `${GRAPH}/me/drive/root:/WOW-Reports/${filename}:/content`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/png' },
      body: blob,
    }
  )
  if (!res.ok) throw new Error(`OneDrive 업로드 실패 (${res.status})`)
  const item = await res.json()
  return item['@microsoft.graph.downloadUrl'] ?? item.webUrl
}

export async function sendChatMessage(chatId, html, acquireToken) {
  const token = await acquireToken(['Chat.ReadWrite'])
  const res = await fetch(`${GRAPH}/chats/${chatId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      body: { contentType: 'html', content: html },
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Teams 전송 실패 (HTTP ${res.status})`)
  }
}

export async function sendDirectMessage(recipientEmail, message, acquireToken) {
  const token = await acquireToken(['Chat.ReadWrite', 'User.Read'])
  // 현재 사용자 ID 조회
  const meRes = await fetch(`${GRAPH}/me?$select=id`, { headers: { Authorization: `Bearer ${token}` } })
  if (!meRes.ok) throw new Error('사용자 정보 조회 실패')
  const me = await meRes.json()
  // 1:1 채팅 생성 (이미 존재하면 기존 chatId 반환)
  const chatRes = await fetch(`${GRAPH}/chats`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatType: 'oneOnOne',
      members: [
        { '@odata.type': '#microsoft.graph.aadUserConversationMember', roles: ['owner'], 'user@odata.bind': `${GRAPH}/users/${me.id}` },
        { '@odata.type': '#microsoft.graph.aadUserConversationMember', roles: ['owner'], 'user@odata.bind': `${GRAPH}/users/${recipientEmail}` },
      ],
    }),
  })
  if (!chatRes.ok) {
    const err = await chatRes.json().catch(() => ({}))
    throw new Error(err?.error?.message || `채팅 생성 실패 (HTTP ${chatRes.status})`)
  }
  const chat = await chatRes.json()
  // 메시지 전송
  const html = message.replace(/\n/g, '<br>')
  const msgRes = await fetch(`${GRAPH}/chats/${chat.id}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: { contentType: 'html', content: html } }),
  })
  if (!msgRes.ok) {
    const err = await msgRes.json().catch(() => ({}))
    throw new Error(err?.error?.message || `메시지 전송 실패 (HTTP ${msgRes.status})`)
  }
}

export async function fetchProfilePhoto(acquireToken) {
  try {
    const token = await acquireToken()
    const res = await fetch('https://graph.microsoft.com/v1.0/me/photos/96x96/$value', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}
