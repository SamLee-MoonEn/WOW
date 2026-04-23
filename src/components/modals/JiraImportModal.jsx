import { useState, useEffect, useRef, useCallback } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { fetchMyJiraIssues, searchMyJiraIssues, fetchJiraProjects } from '../../utils/jiraUtils'

const priorityColor = {
  Highest: 'text-red-600',
  High: 'text-orange-500',
  Medium: 'text-yellow-600',
  Low: 'text-blue-500',
  Lowest: 'text-gray-400',
}

export default function JiraImportModal({ userEmail, settings, existingJiraKeys, onImport, onClose }) {
  const [projects, setProjects] = useState([])
  const [projectKey, setProjectKey] = useState('')
  const [projectQuery, setProjectQuery] = useState('')
  const [projectOpen, setProjectOpen] = useState(false)
  const [recentIssues, setRecentIssues] = useState([])
  const [searchResults, setSearchResults] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef(null)
  const projectRef = useRef(null)

  useEffect(() => {
    fetchJiraProjects(settings).then(setProjects)
  }, [settings])

  // 프로젝트 드롭다운 외부 클릭 닫기
  useEffect(() => {
    const handler = (e) => {
      if (projectRef.current && !projectRef.current.contains(e.target)) {
        setProjectOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setSearchResults(null)
    setFilter('')
    fetchMyJiraIssues(settings, userEmail, projectKey)
      .then((data) => {
        if (cancelled) return
        setRecentIssues(data)
        setLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e.message)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [settings, userEmail, projectKey])

  const doSearch = useCallback((keyword) => {
    if (!keyword.trim()) {
      setSearchResults(null)
      return
    }
    setSearching(true)
    searchMyJiraIssues(settings, userEmail, keyword.trim(), projectKey)
      .then((data) => {
        setSearchResults(data)
        setSearching(false)
      })
      .catch(() => {
        setSearchResults([])
        setSearching(false)
      })
  }, [settings, userEmail, projectKey])

  const handleFilterChange = (e) => {
    const value = e.target.value
    setFilter(value)
    clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setSearchResults(null)
      return
    }
    debounceRef.current = setTimeout(() => doSearch(value), 400)
  }

  const selectProject = (key, name) => {
    setProjectKey(key)
    setProjectQuery(key ? `${name} (${key})` : '')
    setProjectOpen(false)
    setSelected(new Set())
  }

  const filteredProjects = projects.filter((p) => {
    if (!projectQuery) return true
    const q = projectQuery.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)
  })

  const issues = searchResults !== null ? searchResults : recentIssues
  const importable = issues.filter((i) => !existingJiraKeys.has(i.key))

  const toggle = (key) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const toggleAll = () => {
    const allSelected = importable.length > 0 && importable.every((i) => selected.has(i.key))
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        importable.forEach((i) => next.delete(i.key))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        importable.forEach((i) => next.add(i.key))
        return next
      })
    }
  }

  const handleImport = () => {
    const selectedIssues = issues.filter((i) => selected.has(i.key))
    onImport(selectedIssues)
  }

  const footer = (
    <>
      <span className="text-[11px] text-jira-muted mr-auto">
        {selected.size}개 선택
      </span>
      <Button variant="outline" size="sm" onClick={onClose}>취소</Button>
      <Button variant="primary" size="sm" onClick={handleImport} disabled={selected.size === 0}>
        가져오기 ({selected.size})
      </Button>
    </>
  )

  return (
    <Modal title="Jira 이슈 가져오기" onClose={onClose} footer={footer} size="lg">
      {/* 프로젝트 필터 + 검색 */}
      <div className="flex gap-2 mb-3">
        <div className="relative shrink-0 w-[200px]" ref={projectRef}>
          <input
            type="text"
            value={projectQuery}
            onChange={(e) => {
              setProjectQuery(e.target.value)
              setProjectOpen(true)
              if (projectKey) {
                setProjectKey('')
                setSelected(new Set())
              }
            }}
            onFocus={() => setProjectOpen(true)}
            placeholder="프로젝트 검색"
            className="w-full text-[13px] px-2.5 py-2 border border-jira-border rounded-lg bg-jira-bg focus:outline-none focus:border-jira-blue"
          />
          {projectKey && (
            <button
              onClick={() => selectProject('', '')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-jira-muted hover:text-jira-dark text-[14px] leading-none"
            >
              ✕
            </button>
          )}
          {projectOpen && (
            <div className="absolute z-10 top-full left-0 mt-1 w-full bg-white border border-jira-border rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
              <div
                onClick={() => selectProject('', '')}
                className={`px-3 py-2 text-[12px] cursor-pointer hover:bg-jira-bg transition-colors ${!projectKey ? 'text-jira-blue font-semibold' : 'text-jira-dark'}`}
              >
                전체 프로젝트
              </div>
              {filteredProjects.map((p) => (
                <div
                  key={p.key}
                  onClick={() => selectProject(p.key, p.name)}
                  className={`px-3 py-2 text-[12px] cursor-pointer hover:bg-jira-bg transition-colors ${projectKey === p.key ? 'text-jira-blue font-semibold' : 'text-jira-dark'}`}
                >
                  {p.name} <span className="text-jira-muted">({p.key})</span>
                </div>
              ))}
              {filteredProjects.length === 0 && (
                <div className="px-3 py-2 text-[11px] text-jira-muted">일치하는 프로젝트 없음</div>
              )}
            </div>
          )}
        </div>
        <div className="relative flex-1">
          <input
            type="text"
            value={filter}
            onChange={handleFilterChange}
            placeholder="이슈 키 또는 제목으로 검색"
            className="w-full text-[13px] px-3 py-2 border border-jira-border rounded-lg focus:outline-none focus:border-jira-blue bg-jira-bg pr-16"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-jira-muted">검색 중...</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-jira-muted">
          <div className="text-2xl mb-2">🔄</div>
          <div className="text-sm">Jira 이슈를 불러오는 중...</div>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="text-sm text-red-600">{error}</div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-jira-border">
            <label className="flex items-center gap-1.5 text-[12px] text-jira-mid cursor-pointer">
              <input
                type="checkbox"
                checked={importable.length > 0 && importable.every((i) => selected.has(i.key))}
                onChange={toggleAll}
                className="w-3.5 h-3.5 rounded accent-jira-blue"
              />
              전체 선택
            </label>
            <span className="text-[11px] text-jira-muted ml-auto">
              {searchResults !== null
                ? `검색 결과 ${issues.length}개`
                : `최근 수정 ${issues.length}개`}
            </span>
          </div>

          {issues.length === 0 ? (
            <div className="text-center py-8 text-jira-muted">
              <div className="text-sm">
                {searchResults !== null ? `"${filter}"에 해당하는 이슈가 없습니다.` : '할당된 미완료 이슈가 없습니다.'}
              </div>
            </div>
          ) : (
            <div className="max-h-[350px] overflow-y-auto -mx-1 px-1">
              {issues.map((issue) => {
                const alreadyImported = existingJiraKeys.has(issue.key)
                return (
                  <label
                    key={issue.key}
                    className={`flex items-center gap-2.5 px-2 py-2 rounded cursor-pointer transition-colors ${
                      alreadyImported ? 'opacity-40 cursor-not-allowed' : selected.has(issue.key) ? 'bg-jira-blue-light' : 'hover:bg-jira-bg'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(issue.key)}
                      onChange={() => !alreadyImported && toggle(issue.key)}
                      disabled={alreadyImported}
                      className="w-3.5 h-3.5 rounded accent-jira-blue shrink-0"
                    />
                    <span className="text-[11px] font-mono font-semibold text-jira-blue shrink-0 w-[80px]">
                      {issue.key}
                    </span>
                    <span className="text-[12px] text-jira-dark flex-1 min-w-0 truncate">
                      {issue.summary}
                    </span>
                    <span className="text-[10px] text-jira-muted bg-jira-bg px-1.5 py-0.5 rounded shrink-0">
                      {issue.statusName}
                    </span>
                    <span className={`text-[10px] shrink-0 ${priorityColor[issue.priorityName] || 'text-jira-muted'}`}>
                      {issue.priorityName}
                    </span>
                    {alreadyImported && (
                      <span className="text-[10px] text-amber-600 shrink-0">이미 추가됨</span>
                    )}
                  </label>
                )
              })}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
