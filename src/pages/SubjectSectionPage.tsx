import api from "../config/api"
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

type UiNotification = {
  type: 'test' | 'result' | 'teacher'
  title: string
  message: string
  createdAt?: string
}

function SubjectSectionPage() {
  const { subject } = useParams<{ subject: string }>()
  const navigate = useNavigate()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<UiNotification[]>([])
  const [notificationsTick, setNotificationsTick] = useState(0)
  const [showNoTestPopup, setShowNoTestPopup] = useState(false)
  const [showMockConfig, setShowMockConfig] = useState(false)
  const [mockQuestionCount, setMockQuestionCount] = useState(10)
  const [startingMock, setStartingMock] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedProfilePhoto, setSelectedProfilePhoto] = useState(() => {
    const uid = localStorage.getItem('userId') || 'anonymous'
    return localStorage.getItem(`selectedProfilePhoto:${uid}`) || 'profile_boy.png'
  })
  const [profileMeta, setProfileMeta] = useState<{ className?: string; section?: string; rollNo?: string | null }>({})
  const [studentInfo, setStudentInfo] = useState<{ admissionDate?: string | null; dateOfBirth?: string | null; gender?: string | null; guardianName?: string | null }>({})
  const [showPhotoOptions, setShowPhotoOptions] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const studentName = localStorage.getItem('studentName') || 'Samarth' // Will come from backend later

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

  // Map subjects to their illustration folders, icons, and colors (matching dashboard)
  const subjectConfig: Record<string, { 
    name: string
    icon: string
    folder: string
    color: string
    colorLight: string
    buttonGradient: { from: string; to: string }
  }> = {
    physics: {
      name: 'Physics',
      icon: '⚛️',
      folder: 'physics_sec_illus',
      color: '#a855f7',
      colorLight: '#f3e8ff',
      buttonGradient: { from: '#a855f7', to: '#9333ea' },
    },
    chemistry: {
      name: 'Chemistry',
      icon: '🧪',
      folder: 'chem_sec_illus',
      color: '#60a5fa',
      colorLight: '#dbeafe',
      buttonGradient: { from: '#60a5fa', to: '#3b82f6' },
    },
    maths: {
      name: 'Maths',
      icon: 'π',
      folder: 'maths_sec_illus',
      color: '#f472b6',
      colorLight: '#fce7f3',
      buttonGradient: { from: '#f472b6', to: '#ec4899' },
    },
    biology: {
      name: 'Biology',
      icon: '🧬',
      folder: 'bio_sec_illus',
      color: '#34d399',
      colorLight: '#d1fae5',
      buttonGradient: { from: '#34d399', to: '#10b981' },
    },
    english: {
      name: 'English',
      icon: 'En',
      folder: 'eng_sec_illus',
      color: '#fb923c',
      colorLight: '#fed7aa',
      buttonGradient: { from: '#fb923c', to: '#f97316' },
    },
    history: {
      name: 'History',
      icon: '📚',
      folder: 'his_sec_illus',
      color: '#d97706',
      colorLight: '#fef3c7',
      buttonGradient: { from: '#d97706', to: '#b45309' },
    },
    geography: {
      name: 'Geography',
      icon: '🌍',
      folder: 'geo_sec_illus',
      color: '#22c55e',
      colorLight: '#dcfce7',
      buttonGradient: { from: '#22c55e', to: '#16a34a' },
    },
    polity: {
      name: 'Polity',
      icon: '⚖️',
      folder: 'polity_sec_illus',
      color: '#facc15',
      colorLight: '#fef9c3',
      buttonGradient: { from: '#facc15', to: '#eab308' },
    },
  }

  // Illustration mapping: Full Syllabus = illus1, Chapter Wise = illus2, Mock = illus3, Customise = illus4
  // All subjects use illus1.png, illus2.png, illus3.png, illus4.png
  const getIllustrationFile = (index: number) => {
    const illustrations = ['illus1.png', 'illus2.png', 'illus3.png', 'illus4.png']
    return illustrations[index]
  }

  const testTypes = [
    { id: 'full-syllabus', name: 'Full Syllabus Test', illustrationIndex: 0 },
    { id: 'chapter-wise', name: 'Chapter Wise Test', illustrationIndex: 1 },
    { id: 'mock', name: 'Mock Test', illustrationIndex: 2 },
    { id: 'customise', name: 'Customise Test', illustrationIndex: 3 },
  ]

  const loadNotifications = async () => {
    const userId = localStorage.getItem('userId')
    const role = localStorage.getItem('userRole')
    if (!userId || role !== 'STUDENT') return

    try {
      const res = await api.get("/api/notifications", {
        params: { userId }
      })
      const data = res.data

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
        const res = await api.get("/api/students/profile", {
          params: { userId }
        })
        const data = res.data

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

  const currentSubject = subject ? subjectConfig[subject.toLowerCase()] : null

  if (!currentSubject) {
    return <div>Subject not found</div>
  }

  const handleStartTest = (testType: string) => {
    if (testType === 'mock') {
      setMockQuestionCount(10)
      setShowMockConfig(true)
      return
    }

    // For now, assume teacher has uploaded test in first test card (full-syllabus) of Physics
    // If clicking on other test cards, show "no test is there" popup
    if (subject?.toLowerCase() === 'physics' && testType === 'full-syllabus') {
      // Navigate to instructions page
      navigate(`/instructions/${subject}/${testType}`)
    } else {
      // Show animated popup "no test is there"
      setShowNoTestPopup(true)
      setTimeout(() => {
        setShowNoTestPopup(false)
      }, 3000)
    }
  }

  const handleStartMock = async () => {
    try {
      const userId = localStorage.getItem('userId')
      const userRole = localStorage.getItem('userRole')
      if (!userId || userRole !== 'STUDENT') {
        alert('Only students can start mock tests')
        return
      }

      setStartingMock(true)
      const res = await api.post("/api/mock-tests/start", {
        userId: Number(userId),
        subject: currentSubject.name,
        numberOfQuestions: mockQuestionCount
      }) 
      const data = res.data

      setShowMockConfig(false)
      navigate(`/instructions/${subject}/mock?attemptId=${data.attemptId}`)
    } catch (error) {
      console.error('Failed to start mock test', error)
      alert('Failed to start mock test')
    } finally {
      setStartingMock(false)
    }
  }

  const handleBack = () => {
    navigate('/dashboard')
  }

  return (
    <div className="subject-section-page">
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
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/settings') }}>
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="subject-section-main">
        {/* Header */}
        <header className="subject-section-header">
          <div className="header-left">
            <button className="back-button" onClick={handleBack}>
              <span>&lt;</span>
            </button>
            <div className="subject-header-info">
              <span className="subject-icon-header">{currentSubject.icon}</span>
              <h1 className="subject-title">{currentSubject.name}</h1>
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
                          <div className="notification-title">
                            {notification.title}
                          </div>
                          <div className="notification-message">
                            {notification.message}
                          </div>
                          <div className="notification-time">
                            {notification.createdAt ? formatNotificationTime(notification.createdAt, notificationsTick) : ''}
                          </div>
                        </div>
                      </div>
                    ))}
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
        <div className="subject-section-content">
          <div className="test-cards-grid">
            {testTypes.map((testType, index) => {
              const illustrationFile = getIllustrationFile(testType.illustrationIndex)
              const illustrationPath = `/${currentSubject.folder}/${illustrationFile}`
              console.log('Loading illustration:', illustrationPath) // Debug log
              
              return (
                <div
                  key={testType.id}
                  className="test-card"
                  style={{
                    '--delay': `${index * 0.15}s`,
                    '--subject-color': currentSubject.color,
                    '--subject-color-light': currentSubject.colorLight,
                    '--button-gradient-from': currentSubject.buttonGradient.from,
                    '--button-gradient-to': currentSubject.buttonGradient.to,
                  } as React.CSSProperties}
                  onClick={() => handleStartTest(testType.id)}
                >
                  <div className="test-card-illustration">
                    <img
                      src={illustrationPath}
                      alt={testType.name}
                      onError={(e) => {
                        console.error(`Failed to load image: ${illustrationPath}`)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                  <div className="test-card-content">
                    <h3 className="test-card-title">{testType.name}</h3>
                    <button 
                      className="test-start-button"
                      style={{
                        background: `linear-gradient(135deg, ${currentSubject.buttonGradient.from} 0%, ${currentSubject.buttonGradient.to} 100%)`,
                      }}
                    >
                      <span>START</span>
                      <span className="button-arrow">→</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* No Test Popup */}
      {showNoTestPopup && (
        <div className="no-test-popup">
          <div className="no-test-popup-content">
            <span className="no-test-icon">⚠️</span>
            <p className="no-test-message">No test is there</p>
          </div>
        </div>
      )}

      {showMockConfig && (
        <div className="modal-overlay" onClick={() => !startingMock && setShowMockConfig(false)}>
          <div className="mock-config-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="close-dialog" onClick={() => !startingMock && setShowMockConfig(false)}>
              ×
            </button>
            <h2 className="mock-config-title">Choose number of questions</h2>
            <div className="mock-config-body">
              <div className="mock-quick-select">
                {[5, 10, 15, 20, 25, 30].map((n) => (
                  <button
                    key={n}
                    className={`mock-quick-btn ${mockQuestionCount === n ? 'active' : ''}`}
                    onClick={() => setMockQuestionCount(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="mock-custom-input">
                <label htmlFor="mockCount" className="mock-input-label">Custom</label>
                <input
                  id="mockCount"
                  type="number"
                  min={1}
                  max={50}
                  value={mockQuestionCount}
                  onChange={(e) => setMockQuestionCount(parseInt(e.target.value || '1'))}
                  className="mock-number-input"
                />
              </div>
              <p className="mock-note">1 min for MCQ, 2 min for subjective</p>
            </div>
            <div className="mock-config-actions">
              <button className="mock-btn mock-btn-cancel" onClick={() => !startingMock && setShowMockConfig(false)}>
                Cancel
              </button>
              <button className="mock-btn mock-btn-start" onClick={handleStartMock} disabled={startingMock}>
                {startingMock ? 'Starting...' : 'Start'}
              </button>
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
                              api.post("/api/users/profile-photo", {
                                userId,
                                profilePhoto: photo
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

export default SubjectSectionPage


