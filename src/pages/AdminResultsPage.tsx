import api from "../config/api"
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type ApiClass = { id: number; className: string; section: string }

type ApiSubject = { id: number; subjectName: string }

type AttemptRow = {
  attemptId: number
  testId: number
  testType: string | null
  subjectId: number | null
  subject: string | null
  classId: number | null
  className: string | null
  section: string | null
  startedAt: string
  submittedAt: string | null
  status: string
  score: number
  percentage: number
  totalQuestions: number | null
  questionsAttempted: number
  durationMin: number
  timeTakenMin: number | null
  timesGiven: number
  student: {
    studentId: number
    userId: number | null
    name: string | null
    rollNo: string | null
    email: string | null
    phone: string | null
    profilePhoto: string | null
  }
}

type AttemptResponseItem = {
  orderNo: number
  questionId: number
  questionType: string
  questionText: string
  marks: number
  marksObtained: number
  studentAnswer: string | null
  correctAnswer: string | null
  similarityScore: number | null
}

function AdminResultsPage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [classes, setClasses] = useState<ApiClass[]>([])
  const [subjects, setSubjects] = useState<ApiSubject[]>([])

  const [selectedClassId, setSelectedClassId] = useState<number | ''>('')
  const [selectedSection, setSelectedSection] = useState<string>('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('')
  const [selectedTestType, setSelectedTestType] = useState<'MOCK' | 'TEACHER'>('MOCK')

  const [attempts, setAttempts] = useState<AttemptRow[]>([])
  const [query, setQuery] = useState('')
  const [pulse, setPulse] = useState(0)
  const tickRef = useRef<number | null>(null)

  const [selectedAttempt, setSelectedAttempt] = useState<AttemptRow | null>(null)
  const [showResponses, setShowResponses] = useState(false)
  const [responsesLoading, setResponsesLoading] = useState(false)
  const [responsesError, setResponsesError] = useState<string | null>(null)
  const [attemptResponses, setAttemptResponses] = useState<AttemptResponseItem[]>([])

  const userName = localStorage.getItem('userName') || 'User'

  const normalizeSubjectName = (subject: string) => {
    const s = String(subject || '').trim().toLowerCase()
    if (s.includes('geography') || s === 'geo' || s.startsWith('geo ') || s.startsWith('geo-') || s.startsWith('geo')) return 'Geography'
    if (s.includes('history') || s === 'his') return 'History'
    if (s.includes('english') || s === 'eng') return 'English'
    if (s.includes('biology') || s === 'bio') return 'Biology'
    if (s.includes('chemistry') || s === 'chem') return 'Chemistry'
    if (s.includes('physics') || s === 'phy') return 'Physics'
    if (s.includes('polity') || s.includes('civics')) return 'Polity'
    if (s.includes('math') || s.includes('maths')) return 'Maths'
    return String(subject || '').trim() || 'Subject'
  }

  const getSubjectGradient = (subject: string) => {
    const key = normalizeSubjectName(subject)
    const gradients: Record<string, { from: string; to: string }> = {
      Physics: { from: '#f3e8ff', to: '#a855f7' },
      Chemistry: { from: '#dbeafe', to: '#60a5fa' },
      Maths: { from: '#fce7f3', to: '#f472b6' },
      Biology: { from: '#d1fae5', to: '#34d399' },
      English: { from: '#fed7aa', to: '#fb923c' },
      History: { from: '#fef3c7', to: '#d97706' },
      Geography: { from: '#dcfce7', to: '#22c55e' },
      Polity: { from: '#fef9c3', to: '#facc15' }
    }
    return gradients[key] || { from: '#f3f4f6', to: '#6b7280' }
  }

  const getLocalPhotoFallback = (userId: number | null) => {
    if (!userId) return 'profile_boy.png'
    return localStorage.getItem(`selectedProfilePhoto:${String(userId)}`) || 'profile_boy.png'
  }

  const getPhoto = (row: AttemptRow) => {
    const p = row.student.profilePhoto || getLocalPhotoFallback(row.student.userId)
    return `/profile_illus/${p}`
  }

  const loadFilters = async () => {
    const [clsRes, subjRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/classes`),
      fetch(`${API_BASE_URL}/api/subjects`),
    ])

    const clsJson = await clsRes.json().catch(() => null)
    if (!clsRes.ok) {
      const msg = clsJson?.details ? `${clsJson?.error || 'Failed'}: ${clsJson.details}` : clsJson?.error
      throw new Error(msg || 'Failed to load classes')
    }

    const subjJson = await subjRes.json().catch(() => null)
    if (!subjRes.ok) {
      const msg = subjJson?.details ? `${subjJson?.error || 'Failed'}: ${subjJson.details}` : subjJson?.error
      throw new Error(msg || 'Failed to load subjects')
    }

    setClasses(Array.isArray(clsJson) ? clsJson : [])
    setSubjects(Array.isArray(subjJson) ? subjJson : [])
  }

  const loadResults = async () => {
    const params = new URLSearchParams()
    if (selectedClassId !== '') params.set('classId', String(selectedClassId))
    if (selectedSection) params.set('section', selectedSection)
    if (selectedSubjectId !== '') params.set('subjectId', String(selectedSubjectId))
    if (selectedTestType) params.set('testType', selectedTestType)

    const res = await fetch(`${API_BASE_URL}/api/admin/results?${params.toString()}`)
    const json = await res.json().catch(() => null)
    if (!res.ok) {
      const msg = json?.details ? `${json?.error || 'Failed'}: ${json.details}` : json?.error
      throw new Error(msg || 'Failed to load results')
    }

    setAttempts(Array.isArray(json) ? json : [])
  }

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'ADMIN' && role !== 'TEACHER') {
      navigate('/admin-dashboard')
      return
    }

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        await loadFilters()
        await loadResults()
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    })()

    tickRef.current = window.setInterval(() => setPulse((p) => p + 1), 20000)
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        await loadResults()
      } catch {}
    })()
  }, [pulse])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        await loadResults()
      } catch (e: any) {
        setError(e?.message || 'Failed to load results')
      } finally {
        setLoading(false)
      }
    })()
  }, [selectedClassId, selectedSection, selectedSubjectId, selectedTestType])

  useEffect(() => {
    if (selectedClassId === '') {
      setSelectedSection('')
      return
    }
    const cls = classes.find((c) => c.id === selectedClassId)
    if (cls) setSelectedSection(cls.section)
  }, [selectedClassId, classes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return attempts
    return attempts.filter((a) => {
      const name = (a.student.name || '').toLowerCase()
      const roll = (a.student.rollNo || '').toLowerCase()
      const subj = (a.subject || '').toLowerCase()
      return name.includes(q) || roll.includes(q) || subj.includes(q)
    })
  }, [attempts, query])

  const fetchResponses = async (row: AttemptRow) => {
    const userId = localStorage.getItem('userId')
    if (!userId) return

    setSelectedAttempt(row)
    setShowResponses(true)
    setResponsesLoading(true)
    setResponsesError(null)
    setAttemptResponses([])

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/mock-tests/attempt/${row.attemptId}/responses?userId=${userId}`
      )
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to load responses')
      }
      setAttemptResponses(Array.isArray(json?.responses) ? json.responses : [])
    } catch (e: any) {
      setResponsesError(e?.message || 'Failed to load responses')
    } finally {
      setResponsesLoading(false)
    }
  }

  return (
    <div className="admin-dashboard-page">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <img className="sidebar-brand-logo" src="/exam_setu.png" alt="ExamSetu" />
          <span className="sidebar-brand-name">ExamSetu</span>
        </div>
        <nav className="sidebar-nav">
          <a
            href="#"
            className="nav-item"
            onClick={(e) => {
              e.preventDefault()
              navigate('/admin-dashboard')
            }}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Dashboard</span>
          </a>
          <a
            href="#"
            className="nav-item"
            onClick={(e) => {
              e.preventDefault()
              navigate('/admin-students')
            }}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">Students</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">📄</span>
            <span className="nav-text">Tests</span>
          </a>
          <a href="#" className="nav-item active" onClick={(e) => e.preventDefault()}>
            <span className="nav-icon">📊</span>
            <span className="nav-text">Results</span>
          </a>
          <a
            href="#"
            className="nav-item"
            onClick={(e) => {
              e.preventDefault()
              navigate('/settings')
            }}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </a>
        </nav>
      </aside>

      <main className="admin-dashboard-main">
        <header className="admin-dashboard-header">
          <div className="header-left">
            <h1 className="header-title">📊 Results</h1>
          </div>
          <div className="header-right">
            <div className="user-profile">
              <div className="user-avatar">{userName ? userName.charAt(0).toUpperCase() : 'U'}</div>
              <span className="user-name">{userName}</span>
            </div>
          </div>
        </header>

        <div className="admin-dashboard-content">
          {showResponses && selectedAttempt ? (
            <div className="responses-page">
              <div className="responses-page-header">
                <div>
                  <h2 className="responses-page-title">Responses</h2>
                  <p className="responses-page-subtitle">
                    {selectedAttempt.subject} - {selectedAttempt.testType}
                  </p>
                </div>
                <button className="responses-page-close" onClick={() => setShowResponses(false)}>
                  Back
                </button>
              </div>

              <div className="responses-page-body">
                {responsesLoading ? (
                  <div className="responses-loading">Loading...</div>
                ) : responsesError ? (
                  <div className="responses-error">{responsesError}</div>
                ) : (
                  <div className="responses-list">
                    {attemptResponses.map((r) => (
                      <div key={`${r.questionId}-${r.orderNo}`} className="response-item">
                        <div className="response-q">
                          <span className="response-q-no">Q{r.orderNo}.</span>
                          <span className="response-q-text">{r.questionText}</span>
                          <span className="response-marks">
                            {r.marksObtained}/{r.marks}
                          </span>
                        </div>
                        <div className="response-answers">
                          <div className="response-answer-block">
                            <div className="response-answer-label">Student Answer</div>
                            <div className="response-answer-value">{r.studentAnswer || '-'}</div>
                            {r.questionType !== 'MCQ' && r.similarityScore != null && (
                              <div className="response-similarity">Similarity Score: {r.similarityScore}</div>
                            )}
                          </div>
                          <div className="response-answer-block">
                            <div className="response-answer-label">Correct Answer</div>
                            <div className="response-answer-value">{r.correctAnswer || '-'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {attemptResponses.length === 0 && <div className="responses-empty">No responses found</div>}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="admin-results-hero">
                <div>
                  <h2 className="admin-results-hero-title">Class performance</h2>
                  <p className="admin-results-hero-subtitle">
                    Filter and review mock tests. You can open a student attempt to see full responses.
                  </p>
                </div>
                <div className="admin-results-filters">
                  <div className="admin-results-filter">
                    <label>Class</label>
                    <select
                      value={selectedClassId === '' ? '' : String(selectedClassId)}
                      onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : '')}
                      disabled={loading}
                    >
                      <option value="">All</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.className} {c.section}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-results-filter">
                    <label>Section</label>
                    <input value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} placeholder="A" disabled={loading} />
                  </div>

                  <div className="admin-results-filter">
                    <label>Subject</label>
                    <select
                      value={selectedSubjectId === '' ? '' : String(selectedSubjectId)}
                      onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : '')}
                      disabled={loading}
                    >
                      <option value="">All</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.subjectName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-results-filter">
                    <label>Test Type</label>
                    <select
                      value={selectedTestType}
                      onChange={(e) => setSelectedTestType(e.target.value === 'TEACHER' ? 'TEACHER' : 'MOCK')}
                      disabled={loading}
                    >
                      <option value="MOCK">Mock</option>
                      <option value="TEACHER" disabled>
                        Teacher created
                      </option>
                    </select>
                  </div>

                  <div className="admin-results-filter admin-results-search">
                    <label>Search</label>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search by student name or roll no..."
                      disabled={loading}
                    />
                  </div>

                  <div className="admin-results-filter admin-results-actions">
                    <label>&nbsp;</label>
                    <button className="classmates-refresh" onClick={() => setPulse((p) => p + 1)} disabled={loading}>
                      {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="responses-error" style={{ marginBottom: 12 }}>
                  {error}
                </div>
              )}

              <div className="admin-results-grid">
                {filtered.length === 0 && !loading ? (
                  <div className="classmates-empty">
                    <div className="classmates-empty-title">No results found</div>
                    <div className="classmates-empty-subtitle">Try changing filters or refreshing.</div>
                  </div>
                ) : (
                  filtered.map((row, idx) => {
                    const gradient = getSubjectGradient(row.subject || '')
                    return (
                      <div
                        key={row.attemptId}
                        className="admin-result-card"
                        style={
                          {
                            '--delay': `${idx * 0.04}s`,
                            '--gradient-from': gradient.from,
                            '--gradient-to': gradient.to,
                          } as any
                        }
                      >
                        <div className="admin-result-card-head">
                          <div className="admin-result-student">
                            <div className="admin-result-avatar">
                              <img src={getPhoto(row)} alt={row.student.name || 'Student'} />
                            </div>
                            <div className="admin-result-student-meta">
                              <div className="admin-result-name">{row.student.name || 'Student'}</div>
                              <div className="admin-result-sub">
                                Roll: {row.student.rollNo || '-'} | Class: {row.className || '-'} {row.section || ''}
                              </div>
                            </div>
                          </div>

                          <div className="admin-result-pill">{normalizeSubjectName(row.subject || 'Subject')}</div>
                        </div>

                        <div className="admin-result-stats">
                          <div className="admin-result-stat">
                            <div className="admin-result-label">Score</div>
                            <div className="admin-result-value">{row.score}</div>
                          </div>
                          <div className="admin-result-stat">
                            <div className="admin-result-label">Percent</div>
                            <div className="admin-result-value">{row.percentage}%</div>
                          </div>
                          <div className="admin-result-stat">
                            <div className="admin-result-label">Questions</div>
                            <div className="admin-result-value">{row.totalQuestions ?? '-'}</div>
                          </div>
                          <div className="admin-result-stat">
                            <div className="admin-result-label">Attempted</div>
                            <div className="admin-result-value">{row.questionsAttempted}</div>
                          </div>
                          <div className="admin-result-stat">
                            <div className="admin-result-label">Duration</div>
                            <div className="admin-result-value">{row.durationMin} min</div>
                          </div>
                          <div className="admin-result-stat">
                            <div className="admin-result-label">Time Taken</div>
                            <div className="admin-result-value">{row.timeTakenMin != null ? `${row.timeTakenMin} min` : '-'}</div>
                          </div>
                          <div className="admin-result-stat">
                            <div className="admin-result-label">Times given</div>
                            <div className="admin-result-value">{row.timesGiven}</div>
                          </div>
                        </div>

                        <div className="admin-result-card-actions">
                          <button className="see-responses-button" onClick={() => fetchResponses(row)}>
                            See responses
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminResultsPage
