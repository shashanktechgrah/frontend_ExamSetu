import api from "../config/api"
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Classmate = {
  studentId: number
  userId: number | null
  name: string | null
  rollNo: string | null
  profilePhoto: string | null
}

function StudentsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [classmates, setClassmates] = useState<Classmate[]>([])
  const [query, setQuery] = useState('')
  const [pulse, setPulse] = useState(0)
  const tickRef = useRef<number | null>(null)

  const currentUserId = useMemo(() => localStorage.getItem('userId') || '', [])
  const studentName = localStorage.getItem('studentName') || 'Student'

  const load = async () => {
    const role = localStorage.getItem('userRole')
    const userId = localStorage.getItem('userId')
    if (!userId || role !== 'STUDENT') return

    setLoading(true)
    setError(null)
    try {
      const res = await api.get("/api/students/classmates", {
        params: { userId }
      })
      
      const json = res.data
      if (Array.isArray(json)) {
        setClassmates(json)
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()

    // periodic refresh so changes in profile photo reflect without reload
    tickRef.current = window.setInterval(() => setPulse((p) => p + 1), 12000)
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current)
    }
  }, [])

  useEffect(() => {
    load()
  }, [pulse])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return classmates
    return classmates.filter((c) => {
      const name = (c.name || '').toLowerCase()
      const roll = (c.rollNo || '').toLowerCase()
      return name.includes(q) || roll.includes(q)
    })
  }, [classmates, query])

  const getLocalPhotoFallback = (userId: number | null) => {
    if (!userId) return 'profile_boy.png'
    return localStorage.getItem(`selectedProfilePhoto:${String(userId)}`) || 'profile_boy.png'
  }

  const getPhoto = (c: Classmate) => {
    const p = c.profilePhoto || getLocalPhotoFallback(c.userId)
    return `/profile_illus/${p}`
  }

  return (
    <div className="dashboard-page">
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
              navigate('/dashboard')
            }}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Dashboard</span>
          </a>
          <a href="#" className="nav-item active" onClick={(e) => e.preventDefault()}>
            <span className="nav-icon">👨🏻‍🎓</span>
            <span className="nav-text">Students</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">📄</span>
            <span className="nav-text">Exams</span>
          </a>
          <a
            href="#"
            className="nav-item"
            onClick={(e) => {
              e.preventDefault()
              navigate('/results')
            }}
          >
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

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <span className="header-icon">👨🏻‍🎓</span>
            <h1 className="header-title">Classmates</h1>
          </div>
          <div className="header-right">
            <div className="user-profile">
              <div className="user-avatar">{studentName ? studentName.charAt(0).toUpperCase() : 'S'}</div>
              <span className="user-name">{studentName}</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="classmates-hero">
            <div>
              <h2 className="classmates-hero-title">Your classmates</h2>
              <p className="classmates-hero-subtitle">See everyone in your class</p>
            </div>
            <div className="classmates-hero-actions">
              <div className="classmates-search">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or roll no..."
                />
              </div>
              <button
                className="classmates-refresh"
                onClick={() => setPulse((p) => p + 1)}
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {error && (
            <div className="responses-error" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}

          <div className="classmates-grid">
            {filtered.length === 0 && !loading ? (
              <div className="classmates-empty">
                <div className="classmates-empty-title">No classmates found</div>
                <div className="classmates-empty-subtitle">Try clearing the search.</div>
              </div>
            ) : (
              filtered
                .filter((c) => String(c.userId || '') !== String(currentUserId))
                .map((c, idx) => (
                  <div
                    key={c.studentId}
                    className="classmate-card"
                    style={{ ['--delay' as any]: `${idx * 0.04}s` }}
                  >
                    <div className="classmate-avatar">
                      <img src={getPhoto(c)} alt={c.name || 'Student'} />
                    </div>
                    <div className="classmate-info">
                      <div className="classmate-name">{c.name || 'Student'}</div>
                      <div className="classmate-meta">
                        <span className="classmate-roll">Roll: {c.rollNo || '-'}</span>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default StudentsPage
