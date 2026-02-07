import api from "../config/api";
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

type UiNotification = {
  type: 'test' | 'result' | 'teacher'
  title: string
  message: string
  createdAt?: string
}

function DashboardPage() {
  const [leaderboardExpanded, setLeaderboardExpanded] = useState(false)
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
  const navigate = useNavigate()
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

  const getSubjectSlug = (subjectName: string) => {
    const slugMap: Record<string, string> = {
      Physics: 'physics',
      Chemistry: 'chemistry',
      Maths: 'maths',
      Biology: 'biology',
      English: 'english',
      History: 'history',
      Geography: 'geography',
      Polity: 'polity',
    }
    return slugMap[subjectName] || subjectName.toLowerCase()
  }

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
      const res = await api.get("/api/notifications", {
        params: { userId }
      });
      const data = res.data;

      const mapped: UiNotification[] = (Array.isArray(data) ? data : []).map((n: any) => ({
        type: 'test',
        title: String(n.title || 'Notification'),
        message: String(n.message || ''),
        createdAt: n.createdAt ? String(n.createdAt) : undefined
      }))

      setNotifications(mapped)
    } catch (e) {
      // Keep existing UI working even if backend isn't available
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
        });
        const data = res.data;
        
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

  // Sample data - will come from backend later
  const subjects = [
    { name: 'Physics', icon: '⚛️', color: '#a855f7', colorLight: '#f3e8ff', illustration: '/phy illus.png' },
    { name: 'Chemistry', icon: '🧪', color: '#60a5fa', colorLight: '#dbeafe', illustration: '/chem illus.png' },
    { name: 'Maths', icon: 'π', color: '#f472b6', colorLight: '#fce7f3', illustration: '/maths illus.png' },
    { name: 'Biology', icon: '🧬', color: '#34d399', colorLight: '#d1fae5', illustration: '/bio illus.png' },
    { name: 'English', icon: 'En', color: '#fb923c', colorLight: '#fed7aa', illustration: '/eng illus.png' },
    { name: 'History', icon: '📚', color: '#d97706', colorLight: '#fef3c7', illustration: '/his illus.png' },
    { name: 'Geography', icon: '🌍', color: '#22c55e', colorLight: '#dcfce7', illustration: '/geo illus.png' },
    { name: 'Polity', icon: '⚖️', color: '#facc15', colorLight: '#fef9c3', illustration: '/pol illus.png' },
  ]

  const progressData = [
    { name: 'Completed', value: 10, color: '#22c55e' },
    { name: 'Remaining', value: 5, color: '#e5e7eb' },
  ]

  const leaderboardData = [
    { rank: 1, name: 'Rahul Pandey', score: 49, total: 50 },
    { rank: 2, name: 'Asmit Singh', score: 48, total: 50 },
    { rank: 3, name: 'Saurav Joshi', score: 46, total: 50 },
    { rank: 4, name: 'Priya Sharma', score: 45, total: 50 },
    { rank: 5, name: 'Amit Kumar', score: 44, total: 50 },
    { rank: 6, name: 'Neha Patel', score: 43, total: 50 },
    { rank: 7, name: 'Rohan Mehta', score: 42, total: 50 },
    { rank: 8, name: 'Kavya Reddy', score: 41, total: 50 },
    { rank: 9, name: 'Vikram Singh', score: 40, total: 50 },
    { rank: 10, name: 'Ananya Das', score: 39, total: 50 },
    { rank: 11, name: 'Arjun Nair', score: 38, total: 50 },
    { rank: 12, name: 'Isha Gupta', score: 37, total: 50 },
    { rank: 13, name: 'Ravi Kumar', score: 36, total: 50 },
    { rank: 14, name: 'Sneha Iyer', score: 35, total: 50 },
    { rank: 15, name: 'Samarth Pratap', score: 40, total: 50, isCurrentUser: true },
    { rank: 16, name: 'Aditya Rao', score: 34, total: 50 },
    { rank: 17, name: 'Meera Joshi', score: 33, total: 50 },
    { rank: 18, name: 'Karan Malhotra', score: 32, total: 50 },
  ]

  const studentRank = leaderboardData.find((s) => s.isCurrentUser) || {
    rank: 15,
    name: 'Samarth Pratap',
    score: 40,
    total: 50,
  }

  return (
    <div className="dashboard-page">
      {/* Left Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <img className="sidebar-brand-logo" src="/exam_setu.png" alt="ExamSetu" />
          <span className="sidebar-brand-name">ExamSetu</span>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
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
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <span className="header-icon">🏠</span>
            <h1 className="header-title">Dashboard</h1>
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
                          {notification.type === 'teacher' && '👩‍🏫'}
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
        <div className="dashboard-content">
          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div className="banner-content">
              <h2 className="banner-title">Welcome back {studentName} !</h2>
              <p className="banner-subtitle">&ldquo;Prepare your best, Before proceeding to the test&rdquo;</p>
            </div>
            <div className="banner-illustration">
              <img src="/dash illus.png" alt="Student illustration" />
            </div>
          </div>

          {/* Main Grid */}
          <div className="dashboard-grid">
            {/* Left Column - Subjects */}
            <div className="subjects-section">
              <h3 className="section-title">Subjects</h3>
              <div className="subjects-container">
                {subjects.map((subject, index) => (
                  <div
                    key={subject.name}
                    className="subject-card"
                    style={{
                      '--delay': `${index * 0.1}s`,
                      '--subject-color': subject.color,
                      '--subject-color-light': subject.colorLight,
                    } as React.CSSProperties}
                    onClick={() => navigate(`/subject/${getSubjectSlug(subject.name)}`)}
                  >
                    <div
                      className="subject-icon"
                      style={{ background: subject.color }}
                    >
                      {subject.icon}
                    </div>
                    <div className="subject-name">{subject.name}</div>
                    <div className="subject-illustration">
                      <img src={subject.illustration} alt={subject.name} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="right-column">
              {/* Progress Section */}
              <div className="progress-section">
                <h3 className="section-title">Progress</h3>
                <div className="progress-cards">
                  <div className="progress-card">
                    <div className="progress-label">Test Given</div>
                    <div className="progress-value">10</div>
                  </div>
                  <div className="progress-card">
                    <div className="progress-label">Best Score</div>
                    <div className="progress-value">
                      <span className="score-main">40</span>
                      <span className="score-total">/50</span>
                    </div>
                  </div>
                </div>
                <div className="progress-chart-container">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={progressData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1000}
                      >
                        {progressData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <button className="view-results-button" onClick={() => navigate('/results')}>
                  <span>View Results</span>
                  <span className="button-icon">📄</span>
                </button>
              </div>

              {/* Leaderboard Section */}
              <div className="leaderboard-section">
                <div className="leaderboard-header">
                  <h3 className="section-title">Leaderboard</h3>
                  <button
                    className="view-all-button"
                    onClick={() => setLeaderboardExpanded(!leaderboardExpanded)}
                  >
                    View All {leaderboardExpanded ? '‹' : '›'}
                  </button>
                </div>
                <div
                  className={`leaderboard-content ${
                    leaderboardExpanded ? 'expanded' : ''
                  }`}
                >
                  <div className="leaderboard-list">
                    {leaderboardData
                      .slice(0, leaderboardExpanded ? undefined : 3)
                      .map((student, index) => (
                        <div
                          key={student.rank}
                          className={`leaderboard-item ${
                            student.isCurrentUser ? 'current-user' : ''
                          }`}
                          style={{
                            '--delay': `${index * 0.05}s`,
                          } as React.CSSProperties}
                        >
                          <span className="rank">{student.rank}</span>
                          <span className="name">{student.name}</span>
                          <span className="score">
                            <span className="score-main">{student.score}</span>
                            <span className="score-total">/{student.total}</span>
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Your Rank Section */}
              <div className="rank-section">
                <h3 className="section-title">Your Rank</h3>
                <div className="rank-card">
                  <div className="rank-number">{studentRank.rank}</div>
                  <div className="rank-details">
                    <div className="rank-name">{studentRank.name}</div>
                    <div className="rank-score">
                      <span className="score-main">{studentRank.score}</span>
                      <span className="score-total">/{studentRank.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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

export default DashboardPage


