import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function ChoicePage() {
  const [board, setBoard] = useState('')
  const [classLevel, setClassLevel] = useState('')
  const [studentName, setStudentName] = useState('')
  const [boardOpen, setBoardOpen] = useState(false)
  const [classOpen, setClassOpen] = useState(false)
  const navigate = useNavigate()

  const boards = ['CBSE', 'UP']
  const classes = ['6th', '7th', '8th', '9th', '10th', '11th', '12th']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (board && classLevel && studentName) {
      // Store student name in localStorage
      localStorage.setItem('studentName', studentName)
      // Navigate to dashboard
      navigate('/dashboard')
    }
  }

  return (
    <div className="choice-page">
      <div className="choice-container">
        {/* Left Section - Form */}
        <div className="choice-form-section">
          <form className="choice-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="name-input"
                placeholder="Enter your name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Board</label>
              <div className="dropdown-wrapper">
                <button
                  type="button"
                  className={`dropdown-button ${boardOpen ? 'open' : ''}`}
                  onClick={() => {
                    setBoardOpen(!boardOpen)
                    setClassOpen(false)
                  }}
                >
                  <span className={board ? 'selected' : 'placeholder'}>
                    {board || 'Select'}
                  </span>
                  <span className={`chevron ${boardOpen ? 'up' : 'down'}`}>▼</span>
                </button>
                {boardOpen && (
                  <div className="dropdown-menu">
                    {boards.map((b) => (
                      <button
                        key={b}
                        type="button"
                        className="dropdown-item"
                        onClick={() => {
                          setBoard(b)
                          setBoardOpen(false)
                        }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Class</label>
              <div className="dropdown-wrapper">
                <button
                  type="button"
                  className={`dropdown-button ${classOpen ? 'open' : ''}`}
                  onClick={() => {
                    setClassOpen(!classOpen)
                    setBoardOpen(false)
                  }}
                >
                  <span className={classLevel ? 'selected' : 'placeholder'}>
                    {classLevel || 'Select'}
                  </span>
                  <span className={`chevron ${classOpen ? 'up' : 'down'}`}>▼</span>
                </button>
                {classOpen && (
                  <div className="dropdown-menu">
                    {classes.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="dropdown-item"
                        onClick={() => {
                          setClassLevel(c)
                          setClassOpen(false)
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="submit-button">
              Submit
            </button>
          </form>
        </div>

        {/* Right Section - Illustration */}
        <div className="choice-illustration-section">
          <div className="illustration-wrapper">
            <img
              src="/choice page illus.png"
              alt="Student taking online test"
              className="choice-illustration"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChoicePage
