import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      alert('Please enter both email and password')
      return
    }

    setLoading(true)

    try {
      // Call backend authentication API
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        // Store user info and role in localStorage
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('userRole', data.user.role)
        localStorage.setItem('userName', data.user.name)
        localStorage.setItem('userId', String(data.user.id))
        localStorage.setItem('studentName', data.user.name)
        
        // Navigate based on role
        if (data.user.role === 'ADMIN' || data.user.role === 'TEACHER') {
          navigate('/admin-dashboard')
        } else if (data.user.role === 'STUDENT') {
          navigate('/dashboard')
        }
      } else {
        // Show error message
        alert(data.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-inner">
        <div className="card">
          <div className="card-header">
            <div className="login-brand">
              <img className="login-brand-logo" src="/exam_setu.png" alt="ExamSetu" />
            </div>
            <h1 className="title">Welcome</h1>
            <p className="subtitle">
              Enter your credentials to access your account
            </p>
          </div>

          <form className="form" onSubmit={handleSignIn}>
            <label className="field">
              <span className="field-label">Email</span>
              <div className="field-input-wrapper">
                <span className="field-icon" aria-hidden="true">
                  👤
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Email"
                  className="field-input"
                  required
                />
              </div>
            </label>

            <label className="field">
              <span className="field-label">Password</span>
              <div className="field-input-wrapper">
                <span className="field-icon" aria-hidden="true">
                  🔒
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="field-input"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </label>

            <div className="form-row">
              <label className="checkbox">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <button type="button" className="link-button">
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="divider">
              <span className="divider-line" />
              <span className="divider-text">or</span>
              <span className="divider-line" />
            </div>

            <button
              type="button"
              className="google-button"
              onClick={() => {
                window.location.href =
                  'https://accounts.google.com/AccountChooser?continue=https%3A%2F%2Fwww.google.com%2F&flowName=GlifWebSignIn'
              }}
            >
              <span className="google-logo" aria-hidden="true">
                <img src="/google-icon.png" alt="Google" />
              </span>
              <span>Continue with Google</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

