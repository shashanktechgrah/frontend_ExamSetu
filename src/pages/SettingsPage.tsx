import api from "../config/api";
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function SettingsPage() {
  const navigate = useNavigate()
  const studentName = localStorage.getItem('studentName') || 'Samarth'
  const [selectedProfilePhoto, setSelectedProfilePhoto] = useState(() => {
    const uid = localStorage.getItem('userId') || 'anonymous'
    return localStorage.getItem(`selectedProfilePhoto:${uid}`) || 'profile_boy.png'
  })
  const [profileMeta, setProfileMeta] = useState<{ className?: string; section?: string; rollNo?: string | null }>({})
  const [studentInfo, setStudentInfo] = useState<{ admissionDate?: string | null; dateOfBirth?: string | null; gender?: string | null; guardianName?: string | null }>({})
  const [showPhotoOptions, setShowPhotoOptions] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const settingsSections = [
    {
      title: 'Preferences',
      icon: '⚙️',
      items: [
        { label: 'Language', value: 'English' },
        { label: 'Time Zone', value: 'IST (UTC+5:30)' },
        { label: 'Email Notifications', value: 'Enabled' },
        { label: 'Dark Mode', value: 'Disabled' }
      ]
    },
    {
      title: 'Privacy & Security',
      icon: '🔒',
      items: [
        { label: 'Two-Factor Authentication', value: 'Enabled' },
        { label: 'Password Last Changed', value: '30 days ago' },
      ]
    }
  ]

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  const handleProfilePhotoChange = (photo: string) => {
    setSelectedProfilePhoto(photo)
    const uid = localStorage.getItem('userId') || 'anonymous'
    localStorage.setItem(`selectedProfilePhoto:${uid}`, photo)
    setShowPhotoOptions(false)

    const userId = localStorage.getItem('userId')
    const role = localStorage.getItem('userRole')
    if (userId && role === 'STUDENT') {
      api.post("/api/users/profile-photo", {
        userId,
        profilePhoto: photo,
      }).catch(() => {})
    }
  }

  useEffect(() => {
    const loadProfileMeta = async () => {
      const userId = localStorage.getItem('userId')
      const role = localStorage.getItem('userRole')
      if (!userId || role !== 'STUDENT') return

      try {
        const res = await api.get(`/api/students/profile`, {
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

  return (
    <div className="settings-page">
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
          <a href="#" className="nav-item active">
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="settings-main">
        {/* Header */}
        <header className="settings-header">
          <div className="header-left">
            <button className="back-button" onClick={handleBackToDashboard}>
              <span>&lt;</span>
            </button>
            <div className="header-info">
              <span className="header-icon">⚙️</span>
              <h1 className="header-title">Settings</h1>
            </div>
          </div>
          <div className="header-right">
            <div className="user-profile" onClick={() => setProfileOpen(!profileOpen)}>
              <div className="user-avatar">{studentName ? studentName.charAt(0).toUpperCase() : 'S'}</div>
              <span className="user-name">{studentName}</span>
              <span className="user-chevron">‹</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="settings-content">
          <div className="settings-grid">
            {settingsSections.map((section, index) => (
              <div
                key={section.title}
                className="settings-section"
                style={{
                  '--delay': `${index * 0.1}s`,
                } as React.CSSProperties}
              >
                <div className="settings-section-header">
                  <span className="settings-section-icon">{section.icon}</span>
                  <h2 className="settings-section-title">{section.title}</h2>
                </div>
                <div className="settings-section-content">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="settings-item">
                      <div className="settings-item-label">{item.label}</div>
                      <div className="settings-item-value">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
                          onClick={() => handleProfilePhotoChange(photo)}
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

export default SettingsPage

