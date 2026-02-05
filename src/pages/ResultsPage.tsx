import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface TestResult {
  id: string
  attemptId?: number
  subject: string
  testType: string
  date: string
  status: 'in-progress' | 'completed'
  statusLabel?: string
  score?: number
  totalMarks?: number
  percentage?: number
  timeTaken?: string
  questionsAttempted?: number
  totalQuestions?: number
}

interface AttemptResponseItem {
  orderNo: number
  questionId: number
  questionType: string
  questionText: string
  marks: number
  correctAnswer: string | null
  studentAnswer: string | null
  marksObtained: number | null
  similarityScore: number | null
  evaluationType: string | null
}

interface SuggestionCard {
  id: string
  title: string
  description: string
  icon: string
  color: string
}

type UiNotification = {
  type: 'test' | 'result' | 'teacher'
  title: string
  message: string
  createdAt?: string
}

function ResultsPage() {
  const navigate = useNavigate()
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [showResponsesModal, setShowResponsesModal] = useState(false)
  const [responsesLoading, setResponsesLoading] = useState(false)
  const [responsesError, setResponsesError] = useState<string | null>(null)
  const [attemptResponses, setAttemptResponses] = useState<AttemptResponseItem[]>([])
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<UiNotification[]>([])
  const [notificationsTick, setNotificationsTick] = useState(0)
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedProfilePhoto, setSelectedProfilePhoto] = useState(() => {
    const uid = localStorage.getItem('userId') || 'anonymous'
    return localStorage.getItem(`selectedProfilePhoto:${uid}`) || 'profile_boy.png'
  })
  const [profileMeta, setProfileMeta] = useState<{ className?: string; section?: string; rollNo?: string | null }>({})
  const [studentInfo, setStudentInfo] = useState<{ admissionDate?: string | null; dateOfBirth?: string | null; gender?: string | null; guardianName?: string | null }>({})
  const [showPhotoOptions, setShowPhotoOptions] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const studentName = localStorage.getItem('studentName') || 'Samarth'

  const formatNotificationTime = (createdAt: string, _tick?: number) => {
    const dt = new Date(createdAt)
    const diffMs = Date.now() - dt.getTime()
    const min = Math.max(0, Math.floor(diffMs / 60000))
    if (min < 60) return `${min} min ago`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr} hours ago`
    const d = Math.floor(hr / 24)
    return `${d} days ago`
  }

  const formatMark = (n: number | null | undefined) => {
    if (n == null || !Number.isFinite(Number(n))) return '0'
    const v = Number(n)
    if (Number.isInteger(v)) return String(v)
    return v.toFixed(2)
  }

  const normalizeSubjectName = (subject: string) => {
    const s = String(subject || '').trim().toLowerCase()
    // Use stricter matching to avoid collisions like "geograPHY" matching "phy"
    if (s.includes('geography') || s === 'geo' || s.startsWith('geo ' ) || s.startsWith('geo-') || s.startsWith('geo')) return 'Geography'
    if (s.includes('physics') || s === 'phy' || s.startsWith('phy') || s.startsWith('phys')) return 'Physics'
    if (s.includes('chemistry') || s === 'chem' || s.startsWith('chem')) return 'Chemistry'
    if (s.includes('biology') || s === 'bio' || s.startsWith('bio')) return 'Biology'
    if (s.includes('mathematics') || s.includes('maths') || s === 'math' || s.startsWith('math')) return 'Maths'
    if (s.includes('english') || s === 'eng' || s.startsWith('eng')) return 'English'
    if (s.includes('history') || s === 'hist' || s.startsWith('hist')) return 'History'
    if (s.includes('polity') || s.includes('civics')) return 'Polity'
    return subject
  }

  const formatTimeTaken = (timeTakenSec?: number | null, fallbackDurationMin?: number | null) => {
    if (timeTakenSec != null && Number.isFinite(timeTakenSec)) {
      const totalSec = Math.max(0, Math.floor(timeTakenSec))
      const m = Math.floor(totalSec / 60)
      const s = totalSec % 60
      if (m > 0 && s > 0) return `${m} min ${s} sec`
      if (m > 0) return `${m} min`
      return `${s} sec`
    }
    if (fallbackDurationMin != null && Number.isFinite(fallbackDurationMin)) return `${fallbackDurationMin} min`
    return undefined
  }

  useEffect(() => {
    const load = async () => {
      const userId = localStorage.getItem('userId')
      const role = localStorage.getItem('userRole')
      if (!userId || role !== 'STUDENT') return
      try {
        const response = await fetch(`http://localhost:5000/api/results?userId=${userId}`)
        const data = await response.json()
        if (!response.ok) return

        const mapped: TestResult[] = (data || []).map((r: any) => {
          const dt = new Date(r.date)
          const testTypeLabel = r.testType === 'MOCK' ? 'Mock Test' : String(r.testType)
          const subjectName = normalizeSubjectName(r.subject)
          const statusLabel = r.published ? 'Published' : 'In Progress'
          return {
            id: String(r.id),
            attemptId: r.attemptId != null ? Number(r.attemptId) : undefined,
            subject: subjectName,
            testType: testTypeLabel,
            date: dt.toISOString().slice(0, 10),
            status: 'completed',
            statusLabel,
            score: Math.round(r.obtainedMarks),
            totalMarks: Math.round(r.totalMarks),
            percentage: Math.round(r.percentage),
            timeTaken: formatTimeTaken(r.timeTakenSec, r.durationMin),
            questionsAttempted: r.totalQuestions,
            totalQuestions: r.totalQuestions,
          }
        })

        setTestResults(mapped)
      } catch (error) {
        console.error('Failed to load results', error)
      }
    }
    load()
  }, [])

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false)
      }
    }

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [notificationsOpen])

  const loadNotifications = async () => {
    const userId = localStorage.getItem('userId')
    const role = localStorage.getItem('userRole')
    if (!userId || role !== 'STUDENT') return

    try {
      const res = await fetch(`http://localhost:5000/api/notifications?userId=${userId}`)
      const data = await res.json()
      if (!res.ok) return

      const mapped: UiNotification[] = (Array.isArray(data) ? data : []).map((n: any) => ({
        type: 'test',
        title: String(n.title || 'Notification'),
        message: String(n.message || ''),
        createdAt: n.createdAt ? String(n.createdAt) : undefined
      }))

      setNotifications(mapped)
    } catch (e) {
      // Keep UI working even if backend isn't available
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    if (!notificationsOpen) return
    loadNotifications()
  }, [notificationsOpen])

  useEffect(() => {
    if (!notificationsOpen) return
    const id = window.setInterval(() => setNotificationsTick((t) => t + 1), 30000)
    return () => window.clearInterval(id)
  }, [notificationsOpen])

  useEffect(() => {
    const loadProfileMeta = async () => {
      const userId = localStorage.getItem('userId')
      const role = localStorage.getItem('userRole')
      if (!userId || role !== 'STUDENT') return

      try {
        const res = await fetch(`http://localhost:5000/api/students/profile?userId=${userId}`)
        const data = await res.json()
        if (!res.ok) return
        setProfileMeta({
          className: data?.className != null ? String(data.className) : undefined,
          section: data?.section != null ? String(data.section) : undefined,
          rollNo: data?.rollNo != null ? String(data.rollNo) : null
        })
        setStudentInfo({
          admissionDate: data?.admissionDate != null ? String(data.admissionDate) : null,
          dateOfBirth: data?.dateOfBirth != null ? String(data.dateOfBirth) : null,
          gender: data?.gender != null ? String(data.gender) : null,
          guardianName: data?.guardianName != null ? String(data.guardianName) : null
        })
      } catch (e) {
        // Keep UI working even if backend isn't available
      }
    }

    loadProfileMeta()
  }, [])

  const suggestions: SuggestionCard[] = [
    {
      id: '1',
      title: 'More Practice',
      description: 'Practice more numerical problems to improve your score',
      icon: '⚛️',
      color: '#a855f7'
    },
    {
      id: '2',
      title: 'Great Progress!',
      description: 'Your Biology scores are excellent. Keep it up!',
      icon: '🧬',
      color: '#34d399'
    },
    {
      id: '3',
      title: 'Time Management',
      description: 'Try to complete tests within the time limit',
      icon: '⏰',
      color: '#f472b6'
    }
  ]

  const getSubjectGradient = (subject: string) => {
    const key = normalizeSubjectName(subject)
    // Match dashboard subject card gradients exactly: from light to main color
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

  const handleSeeResult = (result: TestResult) => {
    setSelectedResult(result)
    setShowResultModal(true)
  }

  const handleSeeResponses = async () => {
    const userId = localStorage.getItem('userId')
    if (!selectedResult?.attemptId || !userId) return

    setResponsesLoading(true)
    setResponsesError(null)
    setAttemptResponses([])
    try {
      const res = await fetch(
        `http://localhost:5000/api/mock-tests/attempt/${selectedResult.attemptId}/responses?userId=${userId}`
      )
      const data = await res.json()
      if (!res.ok) {
        setResponsesError(data?.error || 'Failed to load responses')
        setShowResponsesModal(true)
        return
      }

      setAttemptResponses(Array.isArray(data?.responses) ? data.responses : [])
      setShowResponsesModal(true)
    } catch (e: any) {
      setResponsesError(e?.message || 'Failed to load responses')
      setShowResponsesModal(true)
    } finally {
      setResponsesLoading(false)
    }
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  const recentTest = testResults.length > 0 ? testResults[0] : null // Most recent test

  return (
    <div className="results-page">
      {/* Left Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <img className="sidebar-brand-logo" src="/exam_setu.png" alt="ExamSetu" />
          <span className="sidebar-brand-name">ExamSetu</span>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/dashboard') }}>
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Dashboard</span>
          </a>
          <a
            href="#"
            className="nav-item"
            onClick={(e) => {
              e.preventDefault()
              navigate('/students')
            }}
          >
            <span className="nav-icon">👨🏻‍🎓</span>
            <span className="nav-text">Students</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">📄</span>
            <span className="nav-text">Exams</span>
          </a>
          <a href="#" className="nav-item active">
            <span className="nav-icon">📊</span>
            <span className="nav-text">Results</span>
          </a>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/settings') }}>
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="results-main">
        {/* Header */}
        <header className="results-header">
          <div className="header-left">
            <button className="back-button" onClick={handleBackToDashboard}>
              <span>&lt;</span>
            </button>
            <div className="header-info">
              <span className="header-icon">📊</span>
              <h1 className="header-title">Results</h1>
            </div>
          </div>
          <div className="header-right">
            <div className="notifications-wrapper" ref={notificationsRef}>
              <button
                className="header-icon-button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <span>🔔</span>
                {notifications.length > 0 && (
                  <span className="notification-badge">{notifications.length}</span>
                )}
              </button>
              {notificationsOpen && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h3>Notifications</h3>
                    <button
                      className="close-notifications"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="notifications-list">
                    {notifications.map((notification, index) => (
                      <div
                        key={index}
                        className={`notification-item notification-${notification.type}`}
                      >
                        <div className="notification-icon">
                          {notification.type === 'test' && '📝'}
                          {notification.type === 'result' && '📊'}
                          {notification.type === 'teacher' && '👨‍🏫'}
                        </div>
                        <div className="notification-content">
                          <div className="notification-title">{notification.title}</div>
                          <div className="notification-message">{notification.message}</div>
                          <div className="notification-time">
                            {notification.createdAt ? formatNotificationTime(notification.createdAt, notificationsTick) : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="no-notifications">No notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="user-profile" onClick={() => setProfileOpen(!profileOpen)}>
              <div className="user-avatar">{studentName ? studentName.charAt(0).toUpperCase() : 'S'}</div>
              <span className="user-name">{studentName}</span>
              <span className="user-chevron">‹</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="results-content">
          {showResponsesModal && selectedResult ? (
            <div className="responses-page">
              <div className="responses-page-header">
                <div>
                  <h2 className="responses-page-title">Responses</h2>
                  <p className="responses-page-subtitle">
                    {selectedResult.subject} - {selectedResult.testType}
                  </p>
                </div>
                <button className="responses-page-close" onClick={() => setShowResponsesModal(false)}>
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
                            {formatMark(r.marksObtained)}/{formatMark(r.marks)}
                          </span>
                        </div>
                        <div className="response-answers">
                          <div className="response-answer-block">
                            <div className="response-answer-label">Your Answer</div>
                            <div className="response-answer-value">{r.studentAnswer || '-'}</div>
                            {r.questionType !== 'MCQ' && r.similarityScore != null && (
                              <div className="response-similarity">Similarity Score: {formatMark(r.similarityScore)}</div>
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
            <div className="results-grid">
            {/* Left Column - Test Results */}
            <div className="test-results-section">
              <h2 className="section-title">Test Results</h2>
              <div className="test-results-list">
                {testResults.map((result, index) => {
                  const gradient = getSubjectGradient(result.subject)
                  return (
                    <div
                      key={result.id}
                      className="test-result-card"
                      style={{
                        '--delay': `${index * 0.1}s`,
                        '--gradient-from': gradient.from,
                        '--gradient-to': gradient.to,
                      } as React.CSSProperties}
                    >
                      <div className="result-card-header">
                        <div className="subject-info">
                          <span className="subject-icon">
                            {result.subject === 'Physics' && '⚛️'}
                            {result.subject === 'Chemistry' && '🧪'}
                            {result.subject === 'Maths' && 'π'}
                            {result.subject === 'Biology' && '🧬'}
                            {result.subject === 'English' && 'En'}
                            {result.subject === 'History' && '📚'}
                            {result.subject === 'Geography' && '🌍'}
                            {result.subject === 'Polity' && '⚖️'}
                          </span>
                          <div>
                            <h3 className="subject-name">{result.subject}</h3>
                            <p className="test-type">{result.testType}</p>
                          </div>
                        </div>
                        <div className="test-date">{result.date}</div>
                      </div>
                      
                      <div className="result-card-content">
                        {result.status === 'in-progress' ? (
                          <div className="in-progress-content">
                            <div className="progress-info">
                              <div className="progress-item">
                                <span className="progress-label">Status:</span>
                                <span className="progress-value in-progress">In Progress</span>
                              </div>
                              <div className="progress-item">
                                <span className="progress-label">Attempted:</span>
                                <span className="progress-value">{result.questionsAttempted}/{result.totalQuestions}</span>
                              </div>
                              <div className="progress-item">
                                <span className="progress-label">Time:</span>
                                <span className="progress-value">{result.timeTaken}</span>
                              </div>
                            </div>
                            <div className="progress-bar-container">
                              <div 
                                className="progress-bar-fill" 
                                style={{ width: `${(result.questionsAttempted! / result.totalQuestions!) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <div className="completed-content">
                            <div className="score-display">
                              <div className="score-circle">
                                <span className="score-number">{result.score}</span>
                                <span className="score-total">/ {result.totalMarks}</span>
                              </div>
                              <div className="percentage-display">{result.percentage}%</div>
                            </div>
                            <button 
                              className="see-result-button"
                              onClick={() => handleSeeResult(result)}
                            >
                              See Result
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right Column - Suggestions and Recent Test Details */}
            <div className="right-column">
              {/* Recent Test Details */}
              <div className="recent-test-details">
                <h3 className="section-title">Recent Test Details</h3>
                {recentTest ? (
                <div className="recent-test-card">
                  <div className="recent-test-header">
                    <span className="recent-test-icon">
                      {recentTest.subject === 'Physics' && '⚛️'}
                      {recentTest.subject === 'Chemistry' && '🧪'}
                      {recentTest.subject === 'Maths' && 'π'}
                      {recentTest.subject === 'Biology' && '🧬'}
                    </span>
                    <div>
                      <h4 className="recent-test-subject">{recentTest.subject}</h4>
                      <p className="recent-test-type">{recentTest.testType}</p>
                    </div>
                  </div>
                  <div className="recent-test-stats">
                    <div className="stat-item">
                      <span className="stat-label">Time Taken</span>
                      <span className="stat-value">{recentTest.timeTaken}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Questions</span>
                      <span className="stat-value">{recentTest.questionsAttempted}/{recentTest.totalQuestions}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Status</span>
                      <span className="stat-value">{recentTest.statusLabel || (recentTest.status === 'completed' ? 'Published' : 'In Progress')}</span>
                    </div>
                  </div>
                  <div className="circular-progress">
                    <svg className="progress-svg" viewBox="0 0 100 100">
                      <circle
                        className="progress-bg"
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                      />
                      <circle
                        className="progress-fill"
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={getSubjectGradient(recentTest.subject).from}
                        strokeWidth="8"
                        strokeDasharray={`${(recentTest.questionsAttempted! / recentTest.totalQuestions!) * 283} 283`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="progress-text">
                      <span className="progress-percentage">
                        {Math.round((recentTest.questionsAttempted! / recentTest.totalQuestions!) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
                ) : (
                  <div className="recent-test-card">
                    <div className="no-test-message">No results yet</div>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              <div className="suggestions-section">
                <h3 className="section-title">Suggestions</h3>
                <div className="suggestions-list">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.id}
                      className="suggestion-card"
                      style={{
                        '--delay': `${index * 0.15}s`,
                        '--suggestion-color': suggestion.color,
                      } as React.CSSProperties}
                    >
                      <div className="suggestion-icon" style={{ background: suggestion.color }}>
                        {suggestion.icon}
                      </div>
                      <div className="suggestion-content">
                        <h4 className="suggestion-title">{suggestion.title}</h4>
                        <p className="suggestion-description">{suggestion.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </main>

      {/* Result Modal */}
      {showResultModal && selectedResult && (
        <div className="modal-overlay" onClick={() => setShowResultModal(false)}>
          <div className="result-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowResultModal(false)}>
              ×
            </button>
            <div className="result-modal-header">
              <div className="result-modal-subject">
                <span className="subject-icon-large">
                  {selectedResult.subject === 'Physics' && '⚛️'}
                  {selectedResult.subject === 'Chemistry' && '🧪'}
                  {selectedResult.subject === 'Maths' && 'π'}
                  {selectedResult.subject === 'Biology' && '🧬'}
                </span>
                <div>
                  <h2 className="result-modal-title">{selectedResult.subject}</h2>
                  <p className="result-modal-type">{selectedResult.testType}</p>
                </div>
              </div>
            </div>
            
            <div className="result-modal-content">
              <div className="score-display-large">
                <div className="score-circle-large">
                  <span className="score-number-large">{selectedResult.score}</span>
                  <span className="score-total-large">/ {selectedResult.totalMarks}</span>
                </div>
                <div className="percentage-display-large">{selectedResult.percentage}%</div>
              </div>
              
              <div className="result-details">
                <div className="detail-item">
                  <span className="detail-label">Total Questions:</span>
                  <span className="detail-value">{selectedResult.totalQuestions}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Questions Attempted:</span>
                  <span className="detail-value">{selectedResult.questionsAttempted}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Time Taken:</span>
                  <span className="detail-value">{selectedResult.timeTaken}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Test Date:</span>
                  <span className="detail-value">{selectedResult.date}</span>
                </div>
              </div>

              <div className="result-modal-actions">
                <button
                  className="see-responses-button"
                  onClick={handleSeeResponses}
                  disabled={!selectedResult.attemptId}
                >
                  See responses
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Sidebar */}
      {profileOpen && (
        <div className="profile-overlay" onClick={() => setProfileOpen(false)}>
          <div className="profile-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="profile-header-gradient"></div>
            <div className="profile-content">
              <button className="profile-close" onClick={() => setProfileOpen(false)}>
                →
              </button>
              
              <div className="profile-avatar-section">
                <div className="profile-avatar-large">
                  <img src={`/profile_illus/${selectedProfilePhoto}`} alt="Profile" />
                </div>
                <button
                  className="profile-edit-icon"
                  onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                  title="Edit Profile Photo"
                >
                  ✎
                </button>
                {showPhotoOptions && (
                  <div className="profile-photo-options-popup" onClick={(e) => e.stopPropagation()}>
                    <div className="photo-options-grid">
                      {['profile_boy.png', 'profile_boy2.png', 'profile_girl.png', 'profile_girl2.png'].map((photo) => (
                        <button
                          key={photo}
                          className={`photo-option-button ${selectedProfilePhoto === photo ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedProfilePhoto(photo)
                            const uid = localStorage.getItem('userId') || 'anonymous'
                            localStorage.setItem(`selectedProfilePhoto:${uid}`, photo)
                            setShowPhotoOptions(false)

                            const userId = localStorage.getItem('userId')
                            const role = localStorage.getItem('userRole')
                            if (userId && role === 'STUDENT') {
                              fetch('http://localhost:5000/api/users/profile-photo', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId, profilePhoto: photo }),
                              }).catch(() => {})
                            }
                          }}
                        >
                          <img src={`/profile_illus/${photo}`} alt="Profile option" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <h2 className="profile-name">{studentName}</h2>
                <div className="profile-academic-info">
                  <div>Class : {profileMeta.className || '9th'}</div>
                  <div>Section : {profileMeta.section || 'A1'}</div>
                  <div>Roll No. : {profileMeta.rollNo || '45'}</div>
                </div>
              </div>

              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <span className="profile-info-label">Admission Date</span>
                  <span className="profile-info-value">
                    {studentInfo.admissionDate ? new Date(studentInfo.admissionDate).toLocaleDateString('en-GB') : '-'}
                  </span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Date Of Birth</span>
                  <span className="profile-info-value">
                    {studentInfo.dateOfBirth ? new Date(studentInfo.dateOfBirth).toLocaleDateString('en-GB') : '-'}
                  </span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Gender</span>
                  <span className="profile-info-value">{studentInfo.gender || '-'}</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Guardian Name</span>
                  <span className="profile-info-value">{studentInfo.guardianName || '-'}</span>
                </div>
              </div>

              <div className="profile-illustration-bottom">
                <img src="/profile_illus/profile_down_illus.png" alt="Student illustration" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResultsPage
