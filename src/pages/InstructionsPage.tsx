import api from "../config/api";
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

function InstructionsPage() {
  const { subject, testType } = useParams<{ subject: string; testType: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [instructionsRead, setInstructionsRead] = useState(false)

  const attemptId = new URLSearchParams(location.search).get('attemptId')
  const userId = localStorage.getItem('userId')

  const [testInfo, setTestInfo] = useState({
    subject: subject || 'Physics',
    totalQuestions: 30,
    durationMin: 60,
    negativeMarking: false,
  })

  useEffect(() => {
    const load = async () => {
      if (!attemptId || !userId) return
      try {
        const response = await api.get(
          '/api/mock-tests/attempt/${attemptId}',
          {
            params: { userId }
          }
        )
        const data = response.data
        if (!response.ok) return
        setTestInfo({
          subject: data.subject,
          totalQuestions: data.totalQuestions,
          durationMin: data.durationMin,
          negativeMarking: false,
        })
      } catch (error) {
        console.error('Failed to load attempt', error)
      }
    }
    load()
  }, [attemptId, userId])

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hrs = Math.floor(minutes / 60)
      return `${hrs} Hours`
    }
    return `${minutes} Minutes`
  }

  const handleStart = () => {
    if (instructionsRead) {
      // Store start time
      const startTime = new Date().toISOString()
      localStorage.setItem('testStartTime', startTime)

      if (attemptId) {
        navigate(`/test/${subject}/${testType}?attemptId=${attemptId}`)
      } else {
        navigate(`/test/${subject}/${testType}`)
      }
    }
  }

  return (
    <div className="instructions-page">
      <div className="instructions-container">
        <div className="instructions-card">
          <div className="instructions-header">
            <div className="header-gradient"></div>
          </div>
          
          <div className="instructions-content">
            <h1 className="instructions-title">Instructions</h1>
            <p className="instructions-subtitle">Read all instructions carefully</p>
            
            <ul className="instructions-list">
              <li>This {testInfo.subject} Test has total {testInfo.totalQuestions} Questions.</li>
              <li>Total Time for Exam is {formatDuration(testInfo.durationMin)}.</li>
              <li>No Negative Marking is there.</li>
              <li>Attempt all questions compulsorily.</li>
              <li>Don&apos;t try to open another window while giving test.</li>
            </ul>
            
            <div className="instructions-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={instructionsRead}
                  onChange={(e) => setInstructionsRead(e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-text">
                  I have read and understood the instructions
                </span>
              </label>
            </div>
            
            <button
              className={`instructions-start-button ${instructionsRead ? 'enabled' : 'disabled'}`}
              onClick={handleStart}
              disabled={!instructionsRead}
            >
              <span>Start</span>
              <span className="button-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstructionsPage




