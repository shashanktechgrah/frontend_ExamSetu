import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type ApiClass = { id: number; className: string; section: string }

type StudentSummary = {
  studentId: number
  userId: number | null
  name: string | null
  rollNo: string | null
  classId: number | null
  className: string | null
  section: string | null
  profilePhoto: string | null
}

type StudentDetails = {
  student: {
    id: number
    rollNo: string | null
    guardianName: string | null
    admissionDate: string | null
    dateOfBirth: string | null
    gender: string | null
    createdAt: string
  }
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    role: string
    status: string
    createdAt: string
  }
  class: {
    id: number
    className: string
    section: string
  } | null
  profilePhoto: string | null
}

function AdminStudentsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [classes, setClasses] = useState<ApiClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('')

  const [students, setStudents] = useState<StudentSummary[]>([])
  const [query, setQuery] = useState('')
  const [pulse, setPulse] = useState(0)
  const tickRef = useRef<number | null>(null)

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [details, setDetails] = useState<StudentDetails | null>(null)

  const userName = localStorage.getItem('userName') || 'User'

  const loadClasses = async () => {
    const res = await fetch('http://localhost:5000/api/classes')
    const json = await res.json().catch(() => null)
    if (!res.ok) {
      const msg = json?.details ? `${json?.error || 'Failed'}: ${json.details}` : json?.error
      throw new Error(msg || 'Failed to load classes')
    }
    if (Array.isArray(json)) {
      setClasses(json)
    }
  }

  const loadStudents = async () => {
    const classIdParam = selectedClassId === '' ? '' : `?classId=${String(selectedClassId)}`
    const res = await fetch(`http://localhost:5000/api/admin/students${classIdParam}`)
    const json = await res.json().catch(() => null)
    if (!res.ok) {
      const msg = json?.details ? `${json?.error || 'Failed'}: ${json.details}` : json?.error
      throw new Error(msg || 'Failed to load students')
    }
    if (Array.isArray(json)) {
      setStudents(json)
    }
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
        await loadClasses()
        await loadStudents()
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    })()

    tickRef.current = window.setInterval(() => setPulse((p) => p + 1), 15000)
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        await loadStudents()
      } catch {}
    })()
  }, [pulse])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        await loadStudents()
      } catch (e: any) {
        setError(e?.message || 'Failed to load students')
      } finally {
        setLoading(false)
      }
    })()
  }, [selectedClassId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter((s) => {
      const n = (s.name || '').toLowerCase()
      const r = (s.rollNo || '').toLowerCase()
      const cls = `${s.className || ''} ${s.section || ''}`.trim().toLowerCase()
      return n.includes(q) || r.includes(q) || cls.includes(q)
    })
  }, [students, query])

  const getLocalPhotoFallback = (userId: number | null) => {
    if (!userId) return 'profile_boy.png'
    return localStorage.getItem(`selectedProfilePhoto:${String(userId)}`) || 'profile_boy.png'
  }

  const getPhoto = (s: StudentSummary) => {
    const p = s.profilePhoto || getLocalPhotoFallback(s.userId)
    return `/profile_illus/${p}`
  }

  const openDetails = async (studentId: number) => {
    setDetailsOpen(true)
    setSelectedStudentId(studentId)
    setDetails(null)
    setDetailsError(null)

    setDetailsLoading(true)
    try {
      const res = await fetch(`http://localhost:5000/api/admin/students/${studentId}`)
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = json?.details ? `${json?.error || 'Failed'}: ${json.details}` : json?.error
        throw new Error(msg || 'Failed to load details')
      }
      setDetails(json)
    } catch (e: any) {
      setDetailsError(e?.message || 'Failed to load details')
    } finally {
      setDetailsLoading(false)
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
          <a href="#" className="nav-item active" onClick={(e) => e.preventDefault()}>
            <span className="nav-icon">👥</span>
            <span className="nav-text">Students</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">📄</span>
            <span className="nav-text">Tests</span>
          </a>
          <a href="#" className="nav-item">
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
            <h1 className="header-title">👥 Students</h1>
          </div>
          <div className="header-right">
            <div className="user-profile">
              <div className="user-avatar">{userName ? userName.charAt(0).toUpperCase() : 'U'}</div>
              <span className="user-name">{userName}</span>
            </div>
          </div>
        </header>

        <div className="admin-dashboard-content">
          <div className="classmates-hero">
            <div>
              <h2 className="classmates-hero-title">List of Students</h2>
              <p className="classmates-hero-subtitle">Filter by class and click a student to view full details.</p>
            </div>
            <div className="classmates-hero-actions">
              <div className="classmates-search">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, roll no, class..." />
              </div>
              <select
                className="admin-students-class-filter"
                value={selectedClassId === '' ? '' : String(selectedClassId)}
                onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : '')}
                disabled={loading}
              >
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.className} {c.section}
                  </option>
                ))}
              </select>
              <button className="classmates-refresh" onClick={() => setPulse((p) => p + 1)} disabled={loading}>
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
                <div className="classmates-empty-title">No students found</div>
                <div className="classmates-empty-subtitle">Try changing class filter or clearing the search.</div>
              </div>
            ) : (
              filtered.map((s, idx) => (
                <button
                  key={s.studentId}
                  type="button"
                  className="classmate-card admin-student-card"
                  style={{ ['--delay' as any]: `${idx * 0.04}s` }}
                  onClick={() => openDetails(s.studentId)}
                >
                  <div className="classmate-avatar">
                    <img src={getPhoto(s)} alt={s.name || 'Student'} />
                  </div>
                  <div className="classmate-info">
                    <div className="classmate-name">{s.name || 'Student'}</div>
                    <div className="classmate-meta">
                      <div>Roll: {s.rollNo || '-'}</div>
                      <div>
                        Class: {s.className || '-'} {s.section || ''}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {detailsOpen && (
          <div
            className="modal-overlay"
            onClick={() => {
              setDetailsOpen(false)
              setSelectedStudentId(null)
            }}
          >
            <div className="admin-student-details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-student-details-header">
                <div>
                  <div className="admin-student-details-title">Student Details</div>
                  <div className="admin-student-details-subtitle">Student Id: {selectedStudentId}</div>
                </div>
                <button
                  className="create-user-close"
                  onClick={() => {
                    setDetailsOpen(false)
                    setSelectedStudentId(null)
                  }}
                >
                  ×
                </button>
              </div>

              {detailsError && <div className="create-user-alert error">{detailsError}</div>}

              {detailsLoading ? (
                <div className="admin-student-details-loading">Loading...</div>
              ) : details ? (
                <div className="admin-student-details-body">
                  <div className="admin-student-details-hero">
                    <div className="admin-student-details-avatar">
                      <img
                        src={`/profile_illus/${details.profilePhoto || getLocalPhotoFallback(details.user?.id || null)}`}
                        alt={details.user?.name || 'Student'}
                      />
                    </div>
                    <div className="admin-student-details-hero-info">
                      <div className="admin-student-details-name">{details.user?.name || '-'}</div>
                      <div className="admin-student-details-meta">{details.user?.email || '-'}</div>
                      <div className="admin-student-details-meta">Phone: {details.user?.phone || '-'}</div>
                    </div>
                  </div>

                  <div className="admin-student-details-grid">
                    <div className="admin-student-details-item">
                      <div className="admin-student-details-label">Class</div>
                      <div className="admin-student-details-value">
                        {details.class ? `${details.class.className} ${details.class.section}` : '-'}
                      </div>
                    </div>
                    <div className="admin-student-details-item">
                      <div className="admin-student-details-label">Roll No</div>
                      <div className="admin-student-details-value">{details.student?.rollNo || '-'}</div>
                    </div>
                    <div className="admin-student-details-item">
                      <div className="admin-student-details-label">Gender</div>
                      <div className="admin-student-details-value">{details.student?.gender || '-'}</div>
                    </div>
                    <div className="admin-student-details-item">
                      <div className="admin-student-details-label">Guardian</div>
                      <div className="admin-student-details-value">{details.student?.guardianName || '-'}</div>
                    </div>
                    <div className="admin-student-details-item">
                      <div className="admin-student-details-label">Admission Date</div>
                      <div className="admin-student-details-value">{details.student?.admissionDate ? String(details.student.admissionDate).slice(0, 10) : '-'}</div>
                    </div>
                    <div className="admin-student-details-item">
                      <div className="admin-student-details-label">Date of Birth</div>
                      <div className="admin-student-details-value">{details.student?.dateOfBirth ? String(details.student.dateOfBirth).slice(0, 10) : '-'}</div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="admin-student-details-loading">No details</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminStudentsPage
