const KEY = 'wow_data_v2'

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
}
