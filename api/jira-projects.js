export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { domain, token } = req.body || {}

  if (!domain || !token) {
    return res.status(400).json({ error: 'Missing required fields: domain, token' })
  }

  const url = `https://${domain}/rest/api/2/project`

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
    const projects = (data || []).map((p) => ({
      key: p.key,
      name: p.name,
    }))

    return res.status(200).json({ projects })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
