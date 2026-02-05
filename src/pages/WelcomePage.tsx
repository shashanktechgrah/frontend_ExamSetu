import { useNavigate } from 'react-router-dom'

function WelcomePage() {
  const navigate = useNavigate()

  const handleStart = () => {
    navigate('/choice')
  }

  return (
    <div className="welcome-page">
      <div className="welcome-card">
        <div className="welcome-illustration">
          <img
            src="/welcome-illustration.png"
            alt="Student studying at computer"
            className="welcome-illustration-image"
          />
        </div>

        <div className="welcome-content">
          <h1 className="welcome-heading">
            <span>Welcome</span>
            <span>to our</span>
            <span>Portal</span>
            <span>Exam Setu</span>
          </h1>

          <button className="welcome-start-button" onClick={handleStart}>
            <span>Start</span>
            <span className="welcome-start-icon">›</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default WelcomePage

