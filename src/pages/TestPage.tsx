import api from "../config/api"
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

interface Question {
  id: number
  type: 'objective' | 'subjective'
  question: string
  options?: Array<string | { id: number; text: string }>
  answer?: string
  markedForReview?: boolean
  characterLimit?: number
}

function TestPage() {
  const { subject, testType: _testType } = useParams<{ subject: string; testType: string }>()
  // testType will be used later for different test configurations
  const navigate = useNavigate()
  const location = useLocation()
  const attemptId = new URLSearchParams(location.search).get('attemptId')
  const userId = localStorage.getItem('userId')
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [answers, setAnswers] = useState<Record<number, { selectedOptionId?: number; answerText?: string }>>({})
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState(1 * 60 * 60) // 1 hour in seconds
  const [showCannotGoBack, setShowCannotGoBack] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [loadingAttempt, setLoadingAttempt] = useState(false)
  const [attemptMeta, setAttemptMeta] = useState<{ totalQuestions: number; durationMin: number; subjectName: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const studentName = localStorage.getItem('studentName') || 'Samarth'

  // Mock questions - 30 questions (legacy fallback)
  const legacyQuestions: Question[] = [
    // Objective questions (1-20)
    { id: 1, type: 'objective', question: 'What is the formula of Kinetic Energy?', options: ['KE = 1/2 mV³', 'KE = 1/2 mV²', 'KE = 1/2 ma', 'KE = 1/2 mgh'] },
    { id: 2, type: 'objective', question: 'What is the SI unit of Force?', options: ['Newton', 'Joule', 'Watt', 'Pascal'] },
    { id: 3, type: 'objective', question: 'What is the acceleration due to gravity on Earth?', options: ['9.8 m/s²', '10 m/s²', '8.9 m/s²', '11 m/s²'] },
    { id: 4, type: 'objective', question: 'What is the formula for momentum?', options: ['p = mv', 'p = ma', 'p = F/a', 'p = mgh'] },
    { id: 5, type: 'objective', question: 'What is the unit of Power?', options: ['Watt', 'Joule', 'Newton', 'Volt'] },
    { id: 6, type: 'objective', question: 'What is the speed of light in vacuum?', options: ['3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10¹⁰ m/s', '3 × 10⁵ m/s'] },
    { id: 7, type: 'objective', question: 'What is the formula for work done?', options: ['W = Fd', 'W = ma', 'W = mv', 'W = mgh'] },
    { id: 8, type: 'objective', question: 'What is the unit of Energy?', options: ['Joule', 'Watt', 'Newton', 'Pascal'] },
    { id: 9, type: 'objective', question: 'What is the formula for Potential Energy?', options: ['PE = mgh', 'PE = mv²', 'PE = ma', 'PE = Fd'] },
    { id: 10, type: 'objective', question: 'What is the first law of motion?', options: ['Law of Inertia', 'F = ma', 'Action-Reaction', 'Conservation of Energy'] },
    { id: 11, type: 'objective', question: 'What is the formula for velocity?', options: ['v = d/t', 'v = ma', 'v = F/m', 'v = mgh'] },
    { id: 12, type: 'objective', question: 'What is the unit of Pressure?', options: ['Pascal', 'Newton', 'Joule', 'Watt'] },
    { id: 13, type: 'objective', question: 'What is the formula for acceleration?', options: ['a = (v-u)/t', 'a = mv', 'a = F/m', 'a = mgh'] },
    { id: 14, type: 'objective', question: 'What is the unit of Force?', options: ['Newton', 'Joule', 'Watt', 'Pascal'] },
    { id: 15, type: 'objective', question: 'What is the second law of motion?', options: ['F = ma', 'Law of Inertia', 'Action-Reaction', 'Conservation'] },
    { id: 16, type: 'objective', question: 'What is the formula for density?', options: ['ρ = m/V', 'ρ = F/A', 'ρ = P/V', 'ρ = E/m'] },
    { id: 17, type: 'objective', question: 'What is the unit of Mass?', options: ['Kilogram', 'Newton', 'Joule', 'Watt'] },
    { id: 18, type: 'objective', question: 'What is the third law of motion?', options: ['Action-Reaction', 'F = ma', 'Law of Inertia', 'Conservation'] },
    { id: 19, type: 'objective', question: 'What is the formula for pressure?', options: ['P = F/A', 'P = mv', 'P = ma', 'P = mgh'] },
    { id: 20, type: 'objective', question: 'What is the unit of Distance?', options: ['Meter', 'Newton', 'Joule', 'Watt'] },
    // Subjective questions (21-30)
    { id: 21, type: 'subjective', question: 'State all the 3 laws of Newton.', characterLimit: 200 },
    { id: 22, type: 'subjective', question: 'Explain the concept of work and energy with examples.', characterLimit: 200 },
    { id: 23, type: 'subjective', question: 'Describe the difference between speed and velocity.', characterLimit: 200 },
    { id: 24, type: 'subjective', question: 'What is momentum? Explain the law of conservation of momentum.', characterLimit: 200 },
    { id: 25, type: 'subjective', question: 'Explain the concept of friction and its types.', characterLimit: 200 },
    { id: 26, type: 'subjective', question: 'Describe the motion of a freely falling body.', characterLimit: 200 },
    { id: 27, type: 'subjective', question: 'What is force? Explain different types of forces.', characterLimit: 200 },
    { id: 28, type: 'subjective', question: 'Explain the concept of pressure and its applications.', characterLimit: 200 },
    { id: 29, type: 'subjective', question: 'Describe the relationship between force, mass, and acceleration.', characterLimit: 200 },
    { id: 30, type: 'subjective', question: 'Explain the concept of energy and its different forms.', characterLimit: 200 },
  ]

  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    const loadAttempt = async () => {
      if (!attemptId || !userId) return
      try {
        setLoadingAttempt(true)
        const response = await api.get(
          `/api/mock-tests/attempt/${attemptId}`,
          { params: { userId } }
        )
        const data = response.data
        setAttemptMeta({
          totalQuestions: data.totalQuestions,
          durationMin: data.durationMin,
          subjectName: data.subject,
        })
        setTimeRemaining(Number(data.durationMin) * 60)

        const mapped: Question[] = (data.questions || []).map((q: any, idx: number) => ({
          id: idx + 1,
          type: q.type,
          question: q.questionText,
          options: (q.options || []).map((o: any) => ({ id: Number(o.id), text: String(o.text) })),
          characterLimit: q.type === 'subjective' ? 200 : undefined,
        }))

        setQuestions(mapped)
        setCurrentQuestion(1)
        setAnswers({})
        setMarkedQuestions(new Set())
      } catch (error) {
        console.error('Failed to load attempt', error)
        alert('Failed to load mock test')
      } finally {
        setLoadingAttempt(false)
      }
    }
    loadAttempt()
  }, [attemptId, userId])

  const totalQuestions = questions.length
  const answeredCount = useMemo(() => {
    return Object.values(answers).filter((a) => {
      if (a.selectedOptionId) return true
      if (a.answerText && a.answerText.trim() !== '') return true
      return false
    }).length
  }, [answers])
  const progress = Math.round((answeredCount / totalQuestions) * 100)

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleSelectOption = (optionId: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: { selectedOptionId: optionId },
    }))
  }

  const handleSubjectiveChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: { answerText: value },
    }))
  }

  const handleMarkForReview = () => {
    setMarkedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(currentQuestion)) {
        newSet.delete(currentQuestion)
      } else {
        newSet.add(currentQuestion)
      }
      return newSet
    })
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handleSaveAndNext = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  // Prevent navigation during test
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
      setShowCannotGoBack(true)
      setTimeout(() => setShowCannotGoBack(false), 3000)
    }

    const handlePopState = () => {
      setShowCannotGoBack(true)
      setTimeout(() => setShowCannotGoBack(false), 3000)
      window.history.pushState(null, '', window.location.href)
    }

    window.history.pushState(null, '', window.location.href)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const handlePrevious = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleQuestionClick = (questionNum: number) => {
    setCurrentQuestion(questionNum)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // In real implementation, this would use OCR to extract text
      // For now, just show a message
      alert('Image uploaded. OCR text extraction will be implemented with backend integration.')
    }
  }

  const handleSubmit = () => {
    setShowSubmitConfirm(true)
  }

  const handleConfirmSubmit = () => {
    // Store end time
    const endTime = new Date().toISOString()
    localStorage.setItem('testEndTime', endTime)
    
    const submit = async () => {
      if (!attemptId || !userId) {
        setShowSubmitConfirm(false)
        setShowThankYou(true)
        return
      }
      try {
        // We need backend questionId, so re-fetch attempt details for mapping orderNo->questionId
        const detailResp = await api.get(
          `/api/mock-tests/attempt/${attemptId}`,
          { params: { userId } }
        )
        const detail = detailResp.data

        const mappedAnswers = (detail.questions || []).map((q: any) => {
          const a = answers[Number(q.orderNo)] || {}
          return {
            questionId: Number(q.questionId),
            selectedOptionId: a.selectedOptionId,
            answerText: a.answerText,
          }
        })

        const response = await api.post(
          `/api/mock-tests/attempt/${attemptId}/submit`,
          {
            userId: Number(userId),
            answers: mappedAnswers,
          }
        )
        const result = response.data
        
        setShowSubmitConfirm(false)
        setShowThankYou(true)
      } catch (error) {
        console.error('Submit failed', error)
        alert('Failed to submit test')
      }
    }

    submit()
  }

  const handleAutoSubmit = () => {
    // Auto submit when time runs out
    handleConfirmSubmit()
  }

  const handleBackToHome = () => {
    navigate('/results')
  }

  const currentQ = questions.find((q) => q.id === currentQuestion)!
  const canSaveAndNext = (() => {
    const a = answers[currentQuestion]
    if (!a) return false
    if (a.selectedOptionId) return true
    if (a.answerText && a.answerText.trim() !== '') return true
    return false
  })()

  const getQuestionStatus = (questionNum: number) => {
    if (markedQuestions.has(questionNum)) return 'marked'
    const a = answers[questionNum]
    if (a?.selectedOptionId || (a?.answerText && a.answerText.trim() !== '')) return 'answered'
    return 'not-attempted'
  }

  return (
    <div className="test-page">
      {/* Header */}
      <header className="test-header">
        <div className="test-header-left">
          <h1 className="test-title">{attemptMeta?.subjectName || subject} Test</h1>
        </div>
        <div className="test-header-center">
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            <span className="progress-text">{progress}%</span>
          </div>
        </div>
        <div className="test-header-right">
          <span className="timer-icon">🕐</span>
          <span className="timer-text">{formatTime(timeRemaining)}</span>
        </div>
      </header>

      <div className="test-main-container">
        {/* Left Panel - Question */}
        <div className="test-question-panel">
          {loadingAttempt && (
            <div style={{ padding: 16, color: '#6b7280' }}>Loading test...</div>
          )}
          <div className="question-header">
            <span className="question-number">Question : {currentQuestion}/{totalQuestions}</span>
          </div>
          
          <div className="question-content">
            <h2 className="question-text">Q{currentQuestion}. {currentQ.question}</h2>
            
            {currentQ.type === 'objective' ? (
              <div className="options-container">
                {currentQ.options?.map((option, index) => {
                  const optionId = typeof option === 'string' ? index + 1 : option.id
                  const optionText = typeof option === 'string' ? option : option.text
                  return (
                    <label key={optionId} className="option-label">
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      value={optionId}
                      checked={answers[currentQuestion]?.selectedOptionId === optionId}
                      onChange={() => handleSelectOption(optionId)}
                      className="option-radio"
                    />
                    <span className="option-text">{optionText}</span>
                  </label>
                  )
                })}
              </div>
            ) : (
              <div className="subjective-container">
                <textarea
                  className="subjective-input"
                  placeholder="........."
                  value={answers[currentQuestion]?.answerText || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    if (!currentQ.characterLimit || value.length <= currentQ.characterLimit) {
                      handleSubjectiveChange(value)
                    }
                  }}
                  rows={8}
                />
                <div className="subjective-actions">
                  <button
                    className="upload-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="upload-icon">☁️</span>
                    <span>Upload</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <span className="character-count">
                    {answers[currentQuestion]?.answerText?.length || 0}/{currentQ.characterLimit || 200} characters
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="question-navigation">
            <button
              className="nav-button previous-button"
              onClick={handlePrevious}
              disabled={currentQuestion === 1}
            >
              Previous
            </button>
            <button
              className="nav-button mark-review-button"
              onClick={handleMarkForReview}
            >
              Mark for Review
            </button>
            <button
              className="nav-button save-next-button"
              onClick={handleSaveAndNext}
              disabled={!canSaveAndNext}
            >
              {currentQuestion === totalQuestions ? 'Save' : 'Save & Next'}
            </button>
          </div>
        </div>

        {/* Right Panel - Sidebar */}
        <div className="test-sidebar">
          <div className="sidebar-user-info">
            <div className="user-avatar-sidebar">{studentName ? studentName.charAt(0).toUpperCase() : 'S'}</div>
            <div className="user-info-text">
              <div className="user-name-sidebar">{studentName}</div>
              <div className="user-stats">
                <div>Attempted : {answeredCount}/{totalQuestions}</div>
                <div>Remaining : {totalQuestions - answeredCount}</div>
              </div>
            </div>
          </div>
          
          <div className="question-palette">
            <div className="question-grid">
              {questions.map((q) => {
                const status = getQuestionStatus(q.id)
                return (
                  <button
                    key={q.id}
                    className={`question-number-button ${status} ${currentQuestion === q.id ? 'current' : ''}`}
                    onClick={() => handleQuestionClick(q.id)}
                  >
                    {q.id}
                  </button>
                )
              })}
            </div>
            
            <div className="question-legend">
              <div className="legend-item">
                <span className="legend-dot answered"></span>
                <span>Answered</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot marked"></span>
                <span>Marked for review</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot not-attempted"></span>
                <span>Not Attempted</span>
              </div>
            </div>
          </div>
          
          <button className="submit-test-button" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>

      {/* Cannot Go Back Popup */}
      {showCannotGoBack && (
        <div className="cannot-go-back-popup">
          <div className="cannot-go-back-content">
            <span className="cannot-go-back-icon">⚠️</span>
            <p className="cannot-go-back-message">You cannot go back till test is going on</p>
          </div>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      {showSubmitConfirm && (
        <div className="modal-overlay" onClick={() => setShowSubmitConfirm(false)}>
          <div className="submit-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="close-dialog" onClick={() => setShowSubmitConfirm(false)}>
              ×
            </button>
            <h2 className="submit-confirm-title">Are you sure you want to submit the test?</h2>
            <p className="submit-confirm-subtitle">You won’t be able to change your answers after submission.</p>
            <div className="submit-confirm-buttons">
              <button className="submit-confirm-btn submit-confirm-btn-cancel" onClick={() => setShowSubmitConfirm(false)}>
                Cancel
              </button>
              <button className="submit-confirm-btn submit-confirm-btn-submit" onClick={handleConfirmSubmit}>
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thank You Dialog */}
      {showThankYou && (
        <div className="modal-overlay">
          <div className="thank-you-dialog">
            <div className="success-icon">✓</div>
            <h2 className="thank-you-title">THANK YOU</h2>
            <p className="thank-you-message">Test has been submitted successfully</p>
            <p className="result-time">
              Expected Result time : <span className="time-highlight">Within 1-2 minutes</span>
            </p>
            <button className="back-to-home-button" onClick={handleBackToHome}>
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestPage


