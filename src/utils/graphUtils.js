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
