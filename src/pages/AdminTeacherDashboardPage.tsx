import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

type ApiClass = { id: number; className: string; section: string }

interface TestAnalytics {
  totalTests: number
  passed: number
  failed: number
}

interface SubjectPerformance {
  subject: string
  passed: number
  failed: number
  totalTests: number
  [key: string]: any // Add index signature for recharts compatibility
}

interface SectionPerformance {
  name: string
  value: number
  color: string
  [key: string]: any // Add index signature for recharts compatibility
}

interface TopScorer {
  name: string
  score: string
  rank: number
}

interface OldPaper {
  id: string
  board: string
  paperName: string
  year: string
  class: string
  subject: string
  questionType: string
  questionText: string
  answer: string
  marks: number
  noOfQuestions: number
}

interface QuestionData {
  questionText: string
  questionType: string
  marks: number
  difficulty: string
  options?: { text: string; isCorrect: boolean }[]
  correctAnswer?: string
}

function AdminTeacherDashboardPage() {
  const navigate = useNavigate()
  const currentRole = localStorage.getItem('userRole') || ''
  const [selectedClass, setSelectedClass] = useState('All')
  const [selectedSection, setSelectedSection] = useState('All')
  const [selectedSubject, setSelectedSubject] = useState('All')
  const [showOldPapersModal, setShowOldPapersModal] = useState(false)
  const [oldPapers, setOldPapers] = useState<OldPaper[]>([])
  const [showAddPaperForm, setShowAddPaperForm] = useState(false)

  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [createRole, setCreateRole] = useState<'STUDENT' | 'TEACHER' | ''>('')
  const [createName, setCreateName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createPhone, setCreatePhone] = useState('')
  const [createDepartment, setCreateDepartment] = useState('')
  const [createClassId, setCreateClassId] = useState<number | ''>('')
  const [createRollNo, setCreateRollNo] = useState('')
  const [createGuardianName, setCreateGuardianName] = useState('')
  const [createAdmissionDate, setCreateAdmissionDate] = useState('')
  const [createDateOfBirth, setCreateDateOfBirth] = useState('')
  const [createGender, setCreateGender] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)
  const [createUserError, setCreateUserError] = useState<string | null>(null)
  const [createUserSuccess, setCreateUserSuccess] = useState<string | null>(null)
  const [classOptions, setClassOptions] = useState<ApiClass[]>([])
  const [newPaper, setNewPaper] = useState<Partial<OldPaper>>({
    board: '',
    paperName: '',
    year: '',
    class: '',
    subject: '',
    questionType: 'objective',
    questionText: '',
    answer: '',
    marks: 1,
    noOfQuestions: 1
  })

  // State for analytics data - will come from backend
  const [testAnalytics, setTestAnalytics] = useState<TestAnalytics>({
    totalTests: 0,
    passed: 0,
    failed: 0
  })

  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([
    { subject: 'Biology Test', passed: 10, failed: 2, totalTests: 12 },
    { subject: 'Chemistry Test', passed: 8, failed: 2, totalTests: 10 },
    { subject: 'English Test', passed: 14, failed: 1, totalTests: 15 },
    { subject: 'Physics Test', passed: 11, failed: 2, totalTests: 13 }
  ])

  const [topScorers, setTopScorers] = useState<TopScorer[]>([
    { name: 'Rahul Sharma', score: '48/50', rank: 1 },
    { name: 'Priya Patel', score: '46/50', rank: 2 },
    { name: 'Amit Kumar', score: '47/50', rank: 3 }
  ])

  const sectionPerformance: SectionPerformance[] = [
    { name: 'Strong Section', value: 65, color: '#22c55e' },
    { name: 'Weak Section', value: 15, color: '#ef4444' },
    { name: 'Neutral Section', value: 20, color: '#f59e0b' }
  ]

  const classes = ['All', '6th', '7th', '8th', '9th', '10th', '11th', '12th']
  const sections = ['All', 'A', 'B']
  const subjects = ['All', 'Physics', 'Chemistry', 'Maths', 'Biology', 'English', 'History', 'Geography', 'Polity']
  const boards = ['CBSE', 'UP']
  const questionTypes = ['objective', 'subjective',]

  useEffect(() => {
    // Fetch data based on filters
    fetchAnalyticsData()
    fetchClasses()
    fetchSubjects()
    fetchQuestionBank()
  }, [selectedClass, selectedSection, selectedSubject])

  useEffect(() => {
    if (!showCreateUserModal) return
    fetchClasses()
  }, [showCreateUserModal])

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/analytics?class=${selectedClass}&section=${selectedSection}&subject=${selectedSubject}`)
      const data = await response.json()
      
      // Update state with real data
      if (data.testAnalytics) {
        setTestAnalytics({
          totalTests: data.testAnalytics.totalTests || 0,
          passed: data.testAnalytics.passed || 0,
          failed: data.testAnalytics.failed || 0
        })
      }
      
      if (data.subjectPerformance) {
        setSubjectPerformance(data.subjectPerformance.map((item: any) => ({
          subject: item.subject,
          passed: item.passed || 0,
          failed: item.failed || 0
        })))
      }
      
      if (data.topScorers) {
        setTopScorers(data.topScorers)
      }
      
      console.log('Analytics data:', data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/classes')
      const classesData = await response.json()
      console.log('Classes:', classesData)

      if (response.ok && Array.isArray(classesData)) {
        setClassOptions(classesData)
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const resetCreateUserForm = () => {
    setCreateRole('')
    setCreateName('')
    setCreateEmail('')
    setCreatePassword('')
    setCreatePhone('')
    setCreateDepartment('')
    setCreateClassId('')
    setCreateRollNo('')
    setCreateGuardianName('')
    setCreateAdmissionDate('')
    setCreateDateOfBirth('')
    setCreateGender('')
    setCreateUserError(null)
    setCreateUserSuccess(null)
  }

  const handleOpenCreateUser = () => {
    resetCreateUserForm()
    setShowCreateUserModal(true)
  }

  const handleCreateUser = async () => {
    if (!createRole) return
    if (!createName.trim() || !createEmail.trim() || !createPassword.trim() || !createPhone.trim()) {
      setCreateUserError('Name, email, password and phone are required.')
      return
    }
    if (createRole === 'STUDENT' && createClassId === '') {
      setCreateUserError('Class is required for student.')
      return
    }

    setCreatingUser(true)
    setCreateUserError(null)
    setCreateUserSuccess(null)

    try {
      const payload: any = {
        role: createRole,
        name: createName.trim(),
        email: createEmail.trim(),
        password: createPassword,
        phone: createPhone.trim(),
      }

      if (createRole === 'TEACHER') {
        payload.teacher = {
          department: createDepartment.trim() || null,
        }
      }

      if (createRole === 'STUDENT') {
        payload.student = {
          classId: createClassId,
          rollNo: createRollNo.trim() || null,
          guardianName: createGuardianName.trim() || null,
          admissionDate: createAdmissionDate || null,
          dateOfBirth: createDateOfBirth || null,
          gender: createGender.trim() || null,
        }
      }

      const res = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = json?.details ? `${json?.error || 'Failed to create user'}: ${json.details}` : json?.error
        throw new Error(msg || 'Failed to create user')
      }

      setCreateUserSuccess('User created successfully.')
    } catch (e: any) {
      setCreateUserError(e?.message || 'Failed to create user')
    } finally {
      setCreatingUser(false)
    }
  }

  const fetchSubjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/subjects')
      const subjectsData = await response.json()
      console.log('Subjects:', subjectsData)
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
    }
  }

  const handleSeeResults = () => {
    navigate('/admin-results', { 
      state: { 
        class: selectedClass, 
        section: selectedSection, 
        subject: selectedSubject 
      } 
    })
  }

  const handleUploadTest = () => {
    navigate('/upload-test')
  }

  const handleAnnouncements = () => {
    navigate('/announcements')
  }

  const handleOldPapers = () => {
    navigate('/admin-old-papers')
  }

  const handleAddOldPaper = async () => {
    try {
      // Prepare questions array
      const questions: QuestionData[] = []
      
      for (let i = 0; i < (newPaper.noOfQuestions || 1); i++) {
        const questionData: QuestionData = {
          questionText: newPaper.questionText || '',
          questionType: newPaper.questionType === 'objective' ? 'MCQ' : 'SUBJECTIVE',
          marks: newPaper.marks || 1,
          difficulty: 'MEDIUM'
        }

        // If MCQ, add options
        if (newPaper.questionType === 'objective') {
          questionData.options = [
            { text: 'Option A', isCorrect: true },
            { text: 'Option B', isCorrect: false },
            { text: 'Option C', isCorrect: false },
            { text: 'Option D', isCorrect: false }
          ]
        } else {
          questionData.correctAnswer = newPaper.answer || ''
        }

        questions.push(questionData)
      }

      const response = await fetch('http://localhost:5000/api/question-bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: 1, // Will be dynamic based on selected class
          subjectId: 1, // Will be dynamic based on selected subject
          sourceId: null,
          ...questions[0] // Send first question as example
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Question added successfully:', result)
        
        // Reset form
        setNewPaper({
          board: '',
          paperName: '',
          year: '',
          class: '',
          subject: '',
          questionType: 'objective',
          questionText: '',
          answer: '',
          marks: 1,
          noOfQuestions: 1
        })
        setShowAddPaperForm(false)
        
        // Refresh papers list
        fetchQuestionBank()
      } else {
        console.error('Failed to add question')
      }
    } catch (error) {
      console.error('Error adding question:', error)
    }
  }

  const fetchQuestionBank = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/question-bank')
      const questions = await response.json()
      console.log('Question bank:', questions)
      // Update oldPapers state with real data
      setOldPapers(questions)
    } catch (error) {
      console.error('Failed to fetch question bank:', error)
    }
  }

  const handleDeletePaper = async (paperId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/question-bank/${paperId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setOldPapers(oldPapers.filter(paper => paper.id !== paperId))
        console.log('Paper deleted successfully:', paperId)
      } else {
        console.error('Failed to delete paper')
      }
    } catch (error) {
      console.error('Error deleting paper:', error)
    }
  }

  const passedPercentage = testAnalytics.totalTests > 0 ? (testAnalytics.passed / testAnalytics.totalTests) * 100 : 0
  const failedPercentage = testAnalytics.totalTests > 0 ? (testAnalytics.failed / testAnalytics.totalTests) * 100 : 0

  return (
    <div className="admin-dashboard-page">
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
          <a href="#" className="nav-item">
            <span className="nav-icon">📊</span>
            <span className="nav-text">Results</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-dashboard-main">
        {/* Header */}
        <header className="admin-dashboard-header">
          <div className="header-left">
            <h1 className="header-title">🏠   Dashboard</h1>
          </div>
          <div className="header-right">
            <div className="user-profile">
              <div className="user-avatar">SN</div>
              <span className="user-name">School Name</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="admin-dashboard-content">
          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div className="welcome-content">
              <h2 className="welcome-title">Welcome 
                Back!</h2>
            </div>
            <div className="welcome-illustration">
              <img src="/school_illus.png" alt="School" />
            </div>
          </div>

          {/* Filters Section */}
          <div className="filters-section">
            <div className="filter-group">
              <label className="filter-label">Class:</label>
              <select 
                className="filter-select" 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                {classes.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Section:</label>
              <select 
                className="filter-select" 
                value={selectedSection} 
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                {sections.map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Subject:</label>
              <select 
                className="filter-select" 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Test Analytics Section */}
          <div className="analytics-section">
            <h3 className="section-title">Test Analytics</h3>
            <div className="analytics-cards">
              <div className="analytics-card total-tests">
                <div className="circular-progress">
                  <div className="progress-circle">
                    <span className="progress-text">{testAnalytics.totalTests}</span>
                  </div>
                </div>
                <div className="analytics-info">
                  <h4>Total Test Given</h4>
                  <p className="analytics-subtitle">Overall tests conducted</p>
                </div>
              </div>

              <div className="analytics-card passed">
                <div className="circular-progress">
                  <div className="progress-circle passed-circle">
                    <span className="progress-text">{testAnalytics.passed}</span>
                  </div>
                </div>
                <div className="analytics-info">
                  <h4>Passed</h4>
                  <p className="analytics-subtitle">{passedPercentage.toFixed(1)}% success rate</p>
                </div>
              </div>

              <div className="analytics-card failed">
                <div className="circular-progress">
                  <div className="progress-circle failed-circle">
                    <span className="progress-text">{testAnalytics.failed}</span>
                  </div>
                </div>
                <div className="analytics-info">
                  <h4>Failed</h4>
                  <p className="analytics-subtitle">{failedPercentage.toFixed(1)}% failure rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Actions Row */}
          <div className="charts-actions-row">
            {/* Subject Performance Chart */}
            <div className="chart-container">
              <h3 className="section-title">Subject Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="passed" fill="#22c55e" />
                  <Bar dataKey="failed" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Action Buttons */}
            <div className="actions-container">
              <button className="action-button see-results" onClick={handleSeeResults}>
                <span className="button-icon">📊</span>
                <span>See Results</span>
              </button>
              <button className="action-button upload-test" onClick={handleUploadTest}>
                <span className="button-icon">📤</span>
                <span>Upload Test</span>
              </button>
              <button className="action-button old-papers" onClick={handleOldPapers}>
                <span className="button-icon">📚</span>
                <span>Old Papers</span>
                <div className="action-button-bg"></div>
              </button>
              <button className="action-button announcements" onClick={handleAnnouncements}>
                <span className="button-icon">📢</span>
                <span>Announcements</span>
              </button>
              {currentRole === 'ADMIN' && (
                <button className="action-button add-user" onClick={handleOpenCreateUser}>
                  <span className="button-icon">➕</span>
                  <span>Add Student/Teacher</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row */}
          <div className="bottom-row">
            {/* Section Performance */}
            <div className="section-performance-container">
              <h3 className="section-title">Section Performance</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sectionPerformance}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sectionPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top Scorers */}
            <div className="top-scorers-container">
              <div className="top-scorers-header">
                <h3 className="section-title">Top Scorers</h3>
                <a href="#" className="view-full-link">View Full List</a>
              </div>
              <div className="top-scorers-list">
                {topScorers.map((scorer) => (
                  <div key={scorer.rank} className="scorer-item">
                    <div className="scorer-rank">#{scorer.rank}</div>
                    <div className="scorer-info">
                      <div className="scorer-name">{scorer.name}</div>
                      <div className="scorer-score">{scorer.score}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Old Papers Modal */}
      {showOldPapersModal && (
        <div className="modal-overlay" onClick={() => setShowOldPapersModal(false)}>
          <div className="modal-content old-papers-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Question Papers Management</h2>
              <button className="modal-close" onClick={() => setShowOldPapersModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="papers-header">
                <h3>Existing Papers</h3>
                <button 
                  className="add-paper-btn" 
                  onClick={() => setShowAddPaperForm(!showAddPaperForm)}
                >
                  + Add New Paper
                </button>
              </div>

              {showAddPaperForm && (
                <div className="add-paper-form">
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Board:</label>
                      <select 
                        value={newPaper.board} 
                        onChange={(e) => setNewPaper({...newPaper, board: e.target.value})}
                      >
                        <option value="">Select Board</option>
                        {boards.map(board => (
                          <option key={board} value={board}>{board}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Paper Name:</label>
                      <input 
                        type="text" 
                        value={newPaper.paperName}
                        onChange={(e) => setNewPaper({...newPaper, paperName: e.target.value})}
                        placeholder="Enter paper name"
                      />
                    </div>
                    <div className="form-field">
                      <label>Year:</label>
                      <input 
                        type="text" 
                        value={newPaper.year}
                        onChange={(e) => setNewPaper({...newPaper, year: e.target.value})}
                        placeholder="e.g., 2023"
                      />
                    </div>
                    <div className="form-field">
                      <label>Class:</label>
                      <select 
                        value={newPaper.class} 
                        onChange={(e) => setNewPaper({...newPaper, class: e.target.value})}
                      >
                        <option value="">Select Class</option>
                        {classes.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Subject:</label>
                      <select 
                        value={newPaper.subject} 
                        onChange={(e) => setNewPaper({...newPaper, subject: e.target.value})}
                      >
                        <option value="">Select Subject</option>
                        {subjects.filter(s => s !== 'All').map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <label>No. of Questions:</label>
                      <input 
                        type="number" 
                        value={newPaper.noOfQuestions}
                        onChange={(e) => {
                          const numQuestions = parseInt(e.target.value) || 1
                          setNewPaper({...newPaper, noOfQuestions: numQuestions})
                        }}
                        placeholder="Enter number of questions"
                        min="1"
                      />
                    </div>
                  </div>
                  
                  {/* Dynamic Questions Section */}
                  <div className="questions-section">
                    <h4>Questions</h4>
                    {Array.from({ length: newPaper.noOfQuestions || 1 }, (_, index) => (
                      <div key={index} className="question-item">
                        <div className="question-header">
                          <h5>Question {index + 1}</h5>
                          <div className="form-field">
                            <label>Question Type:</label>
                            <select 
                              value={newPaper.questionType}
                              onChange={(e) => setNewPaper({...newPaper, questionType: e.target.value})}
                            >
                              {questionTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="form-field full-width">
                          <label>Question Text:</label>
                          <textarea 
                            value={newPaper.questionText}
                            onChange={(e) => setNewPaper({...newPaper, questionText: e.target.value})}
                            placeholder="Enter the question text"
                            rows={3}
                          />
                        </div>
                        
                        {newPaper.questionType === 'objective' ? (
                          <div className="mcq-options">
                            <div className="form-field full-width">
                              <label>Options:</label>
                              <div className="options-grid">
                                {['A', 'B', 'C', 'D'].map((option) => (
                                  <div key={option} className="option-field">
                                    <label>Option {option}:</label>
                                    <input 
                                      type="text" 
                                      placeholder={`Enter option ${option}`}
                                      className="option-input"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="form-field full-width">
                              <label>Correct Answer:</label>
                              <select className="correct-answer-select">
                                <option value="">Select correct answer</option>
                                {['A', 'B', 'C', 'D'].map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ) : (
                          <div className="form-field full-width">
                            <label>Answer:</label>
                            <textarea 
                              value={newPaper.answer}
                              onChange={(e) => setNewPaper({...newPaper, answer: e.target.value})}
                              placeholder="Enter the answer"
                              rows={2}
                            />
                          </div>
                        )}
                        
                        <div className="form-field">
                          <label>Marks:</label>
                          <input 
                            type="number" 
                            value={newPaper.marks}
                            onChange={(e) => setNewPaper({...newPaper, marks: parseInt(e.target.value) || 1})}
                            placeholder="Enter marks"
                            min="1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="form-actions">
                    <button className="save-btn" onClick={handleAddOldPaper}>Save Paper</button>
                    <button className="cancel-btn" onClick={() => setShowAddPaperForm(false)}>Cancel</button>
                  </div>
                </div>
              )}

              <div className="papers-list">
                {oldPapers.length === 0 ? (
                  <p className="no-papers">No papers added yet. Click "Add New Paper" to get started.</p>
                ) : (
                  oldPapers.map((paper) => (
                    <div key={paper.id} className="paper-item">
                      <div className="paper-info">
                        <h4>{paper.paperName}</h4>
                        <p>{paper.board} • {paper.class} • {paper.subject} • {paper.year}</p>
                        <p><strong>Question:</strong> {paper.questionText.substring(0, 100)}...</p>
                        <p><strong>Type:</strong> {paper.questionType} • <strong>Marks:</strong> {paper.marks} • <strong>Questions:</strong> {paper.noOfQuestions || 1}</p>
                      </div>
                      <div className="paper-actions">
                        <button className="edit-btn">Edit</button>
                        <button className="delete-btn" onClick={() => handleDeletePaper(paper.id)}>Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateUserModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowCreateUserModal(false)
          }}
        >
          <div className="create-user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="create-user-modal-header">
              <div>
                <h2 className="create-user-title">Add New User</h2>
                <p className="create-user-subtitle">Create a student or teacher account. User fields are mandatory.</p>
              </div>
              <button
                className="create-user-close"
                onClick={() => {
                  setShowCreateUserModal(false)
                }}
              >
                ×
              </button>
            </div>

            {createUserError && <div className="create-user-alert error">{createUserError}</div>}
            {createUserSuccess && <div className="create-user-alert success">{createUserSuccess}</div>}

            <div className="create-user-form">
              <div className="create-user-field full">
                <label>Role</label>
                <select value={createRole} onChange={(e) => setCreateRole(e.target.value as any)} disabled={creatingUser}>
                  <option value="">Select Role</option>
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                </select>
              </div>

              {createRole && (
                <>
                  <div className="create-user-section full">
                    <div className="create-user-section-title">User</div>
                    <div className="create-user-section-subtitle">These fields will be saved in the users table.</div>
                  </div>

                  <div className="create-user-field">
                    <label>Name</label>
                    <input value={createName} onChange={(e) => setCreateName(e.target.value)} disabled={creatingUser} />
                  </div>
                  <div className="create-user-field">
                    <label>Email</label>
                    <input value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} disabled={creatingUser} />
                  </div>
                  <div className="create-user-field">
                    <label>Password</label>
                    <input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} disabled={creatingUser} />
                  </div>
                  <div className="create-user-field">
                    <label>Phone</label>
                    <input value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} disabled={creatingUser} />
                  </div>

                  {createRole === 'STUDENT' ? (
                    <>
                      <div className="create-user-section full">
                        <div className="create-user-section-title">Student</div>
                        <div className="create-user-section-subtitle">These fields will be saved in the students table.</div>
                      </div>

                      <div className="create-user-field full">
                        <label>Class</label>
                        <select
                          value={createClassId === '' ? '' : String(createClassId)}
                          onChange={(e) => setCreateClassId(e.target.value ? Number(e.target.value) : '')}
                          disabled={creatingUser}
                        >
                          <option value="">Select Class</option>
                          {classOptions.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.className} {c.section}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="create-user-field">
                        <label>Roll No</label>
                        <input value={createRollNo} onChange={(e) => setCreateRollNo(e.target.value)} disabled={creatingUser} />
                      </div>
                      <div className="create-user-field">
                        <label>Guardian Name</label>
                        <input value={createGuardianName} onChange={(e) => setCreateGuardianName(e.target.value)} disabled={creatingUser} />
                      </div>
                      <div className="create-user-field">
                        <label>Admission Date</label>
                        <input type="date" value={createAdmissionDate} onChange={(e) => setCreateAdmissionDate(e.target.value)} disabled={creatingUser} />
                      </div>
                      <div className="create-user-field">
                        <label>Date of Birth</label>
                        <input type="date" value={createDateOfBirth} onChange={(e) => setCreateDateOfBirth(e.target.value)} disabled={creatingUser} />
                      </div>
                      <div className="create-user-field full">
                        <label>Gender</label>
                        <select value={createGender} onChange={(e) => setCreateGender(e.target.value)} disabled={creatingUser}>
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="create-user-section full">
                        <div className="create-user-section-title">Teacher</div>
                        <div className="create-user-section-subtitle">These fields will be saved in the teachers table.</div>
                      </div>
                      <div className="create-user-field full">
                        <label>Department</label>
                        <input value={createDepartment} onChange={(e) => setCreateDepartment(e.target.value)} disabled={creatingUser} />
                      </div>
                    </>
                  )}

                  <div className="create-user-actions full">
                    <button
                      className="create-user-secondary"
                      onClick={() => {
                        resetCreateUserForm()
                      }}
                      disabled={creatingUser}
                    >
                      Clear
                    </button>
                    <button className="create-user-primary" onClick={handleCreateUser} disabled={creatingUser}>
                      {creatingUser ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTeacherDashboardPage
