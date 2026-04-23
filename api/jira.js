export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { domain, token, jql, maxResults = 50 } = req.body || {}

  if (!domain || !token || !jql) {
    return res.status(400).json({ error: 'Missing required fields: domain, token, jql' })
  }

  const url = `https://${domain}/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=summary,status,priority,assignee`

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(response.status).json({ error: err })
    }

    const data = await response.json()
    const issues = (data.issues || []).map((issue) => ({
      key: issue.key,
      summary: issue.fields.summary,
      statusName: issue.fields.status?.name || '',
      priorityName: issue.fields.priority?.name || '',
      assigneeEmail: issue.fields.assignee?.emailAddress || '',
      assigneeName: issue.fields.assignee?.name || '',
    }))

    return res.status(200).json({ issues, total: data.total })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
