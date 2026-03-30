const GRAPH = 'https://graph.microsoft.com/v1.0'
const REPORT_FOLDER = 'WOW-Reports'
const KEEP_DAYS = 28

export async function uploadWeeklyReport(blob, filename, acquireToken) {
  const token = await acquireToken(['Files.ReadWrite'])

  // 1. 파일 업로드
  const uploadRes = await fetch(
    `${GRAPH}/me/drive/root:/${REPORT_FOLDER}/${filename}:/content`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/png' },
      body: blob,
    }
  )
  if (!uploadRes.ok) throw new Error(`OneDrive 업로드 실패 (${uploadRes.status})`)
  const item = await uploadRes.json()

  // 2. 조직 내 영구 공유 링크 생성
  try {
    const linkRes = await fetch(`${GRAPH}/me/drive/items/${item.id}/createLink`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'view', scope: 'organization' }),
    })
    if (linkRes.ok) {
      const linkData = await linkRes.json()
      // sharingUrl → 직접 콘텐츠 URL 변환
      const encodedUrl = `u!${btoa(linkData.link.webUrl).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`
      const contentRes = await fetch(
        `${GRAPH}/shares/${encodedUrl}/driveItem?$select=@microsoft.graph.downloadUrl`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (contentRes.ok) {
        const contentData = await contentRes.json()
        if (contentData['@microsoft.graph.downloadUrl']) {
          return contentData['@microsoft.graph.downloadUrl']
        }
      }
      return linkData.link.webUrl
    }
  } catch { /* 공유 링크 생성 실패 시 임시 URL fallback */ }

  return item['@microsoft.graph.downloadUrl'] ?? item.webUrl
}

export async function cleanupOldReports(acquireToken) {
  try {
    const token = await acquireToken(['Files.ReadWrite'])
    const res = await fetch(`${GRAPH}/me/drive/root:/${REPORT_FOLDER}:/children`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return
    const data = await res.json()
    const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000
    await Promise.all(
      (data.value ?? [])
        .filter(item => new Date(item.lastModifiedDateTime).getTime() < cutoff)
        .map(item =>
          fetch(`${GRAPH}/me/drive/items/${item.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
        )
    )
  } catch {
    // 정리 실패는 무시 (전송 성공에 영향 없음)
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
