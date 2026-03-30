const GRAPH = 'https://graph.microsoft.com/v1.0'

export async function sendImageToTeamsChat(blob, title, acquireToken, chatId) {
  const token = await acquireToken(['Chat.ReadWrite'])

  const base64 = await new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.readAsDataURL(blob)
  })

  const res = await fetch(`${GRAPH}/chats/${chatId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      body: {
        contentType: 'html',
        content: `<p><b>${title}</b></p><img src="../hostedContents/1/$value" style="max-width:100%">`,
      },
      hostedContents: [
        {
          '@microsoft.graph.temporaryId': '1',
          contentBytes: base64,
          contentType: 'image/png',
        },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Teams 채팅 전송 실패 (${res.status}): ${err?.error?.message ?? ''}`)
  }
  return res.json()
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
