async function queryJira(settings, jql, maxResults = 50) {
  const { jiraDomain, jiraToken } = settings
  if (!jiraDomain || !jiraToken) {
    throw new Error('Jira 설정이 완료되지 않았습니다. 앱 설정에서 Jira 정보를 입력해주세요.')
  }

  const res = await fetch('/api/jira', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain: jiraDomain, token: jiraToken, jql, maxResults }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Jira 조회 실패 (HTTP ${res.status})`)
  }

  const data = await res.json()
  return data.issues || []
}

export async function fetchJiraProjects(settings) {
  const { jiraDomain, jiraToken } = settings
  if (!jiraDomain || !jiraToken) return []

  const res = await fetch('/api/jira-projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain: jiraDomain, token: jiraToken }),
  })

  if (!res.ok) return []
  const data = await res.json()
  return data.projects || []
}

export async function fetchMyJiraIssues(settings, userEmail, projectKey = '') {
  const conditions = [`assignee = "${userEmail}"`, `resolution = Unresolved`]
  if (projectKey) conditions.push(`project = "${projectKey}"`)
  const jql = `${conditions.join(' AND ')} ORDER BY updated DESC`
  return queryJira(settings, jql, 50)
}

export async function searchMyJiraIssues(settings, userEmail, keyword, projectKey = '') {
  const escaped = keyword.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const isKey = /^[A-Z][A-Z0-9]+-\d+$/i.test(keyword.trim())
  const conditions = [`assignee = "${userEmail}"`, `resolution = Unresolved`]
  if (projectKey) conditions.push(`project = "${projectKey}"`)
  if (isKey) {
    conditions.push(`key = "${escaped.trim().toUpperCase()}"`)
  } else {
    conditions.push(`summary ~ "${escaped}*"`)
  }
  const jql = `${conditions.join(' AND ')} ORDER BY updated DESC`
  return queryJira(settings, jql, 200)
}
