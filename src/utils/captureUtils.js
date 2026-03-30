export async function captureElement(element) {
  let stream
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: 'browser' },
      preferCurrentTab: true,
    })
  } catch {
    // preferCurrentTab 미지원 시 기본 옵션으로 재시도
    stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
  }

  try {
    const video = document.createElement('video')
    video.srcObject = stream
    video.muted = true

    await new Promise(resolve => { video.onloadedmetadata = resolve })
    await video.play()
    // 두 프레임 대기 — 탭 전환 후 렌더링 안정화
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    const rect = element.getBoundingClientRect()
    const sx = video.videoWidth / window.innerWidth
    const sy = video.videoHeight / window.innerHeight

    const crop = document.createElement('canvas')
    crop.width = Math.round(rect.width * sx)
    crop.height = Math.round(rect.height * sy)
    crop.getContext('2d').drawImage(
      canvas,
      Math.round(rect.left * sx), Math.round(rect.top * sy),
      Math.round(rect.width * sx), Math.round(rect.height * sy),
      0, 0, crop.width, crop.height
    )

    return new Promise(resolve => crop.toBlob(resolve, 'image/png'))
  } finally {
    stream.getTracks().forEach(t => t.stop())
  }
}
