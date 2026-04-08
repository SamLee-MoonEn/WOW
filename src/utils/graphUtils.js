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

  // 익명 조회 가능한 공유 링크 생성 (downloadUrl은 임시라 만료됨)
  const shareRes = await fetch(
    `${GRAPH}/me/drive/items/${item.id}/createLink`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'view', scope: 'organization' }),
    }
  )
  if (shareRes.ok) {
    const shareData = await shareRes.json()
    return shareData.link?.webUrl ?? item['@microsoft.graph.downloadUrl'] ?? item.webUrl
  }
  return item['@microsoft.graph.downloadUrl'] ?? item.webUrl
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
