import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type ApiClass = { id: number; className: string; section: string }

type ApiSubject = { id: number; subjectName: string }

type ApiQuestionSource = { id: number; board: string | null; paperName: string | null; year: number | null }

type QuestionTypeUi = 'MCQ' | 'SUBJECTIVE'

type OptionUi = { text: string; isCorrect: boolean }

function AdminOldPapersPage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [classes, setClasses] = useState<ApiClass[]>([])
  const [subjects, setSubjects] = useState<ApiSubject[]>([])

  const [sources, setSources] = useState<ApiQuestionSource[]>([])

  const [selectedSourceId, setSelectedSourceId] = useState<number | ''>('')

  const [selectedBoard, setSelectedBoard] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedPaperName, setSelectedPaperName] = useState('')

  const [newBoard, setNewBoard] = useState('')
  const [newYear, setNewYear] = useState('')
  const [newPaperName, setNewPaperName] = useState('')

  const [showAddPaper, setShowAddPaper] = useState(false)

  const [classId, setClassId] = useState<number | ''>('')
  const [subjectId, setSubjectId] = useState<number | ''>('')

  const [questionType, setQuestionType] = useState<QuestionTypeUi>('MCQ')
  const [questionText, setQuestionText] = useState('')
  const [marks, setMarks] = useState('1')
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [options, setOptions] = useState<OptionUi[]>([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ])
  const [subjectiveAnswer, setSubjectiveAnswer] = useState('')

  const canSave = useMemo(() => {
    if (selectedSourceId === '') return false
    if (classId === '' || subjectId === '') return false
    if (!questionText.trim()) return false
    const m = Number(marks)
    if (!Number.isFinite(m) || m <= 0) return false

    if (questionType === 'MCQ') {
      const filled = options.every((o) => o.text.trim() !== '')
      const hasCorrect = options.some((o) => o.isCorrect)
      return filled && hasCorrect
    }

    return subjectiveAnswer.trim() !== ''
  }, [selectedSourceId, classId, subjectId, questionText, marks, questionType, options, subjectiveAnswer])

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          fetch('http://localhost:5000/api/classes'),
          fetch('http://localhost:5000/api/subjects'),
        ])

        const cData = await cRes.json()
        const sData = await sRes.json()

        if (cRes.ok && Array.isArray(cData)) setClasses(cData)
        if (sRes.ok && Array.isArray(sData)) setSubjects(sData)
      } catch {
        // ignore
      }
    }

    loadMeta()
  }, [])

  const loadSources = async () => {
    const res = await fetch('http://localhost:5000/api/question-sources')
    const json = await res.json().catch(() => null)
    if (!res.ok) {
      throw new Error(json?.error || 'Failed to fetch sources')
    }
    if (Array.isArray(json)) {
      setSources(json)
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        await loadSources()
      } catch {}
    })()
  }, [])

  const { boards, yearsForBoard, paperNamesForBoardYear } = useMemo(() => {
    const boardNorm = selectedBoard.trim()
    const selectedYearInt = selectedYear.trim() ? Number.parseInt(selectedYear.trim(), 10) : null

    const b = Array.from(
      new Set(
        sources
          .map((s) => (s.board || '').trim())
          .filter((v) => v !== '')
      )
    ).sort((a, c) => a.localeCompare(c))

    const y = Array.from(
      new Set(
        sources
          .filter((s) => (s.board || '').trim() === boardNorm)
          .map((s) => (s.year != null ? Number(s.year) : null))
          .filter((v): v is number => v != null && Number.isFinite(v))
      )
    )
      .sort((a, c) => c - a)
      .map((n) => String(n))

    const p = Array.from(
      new Set(
        sources
          .filter(
            (s) =>
              (s.board || '').trim() === boardNorm &&
              selectedYearInt != null &&
              s.year != null &&
              Number(s.year) === selectedYearInt
          )
          .map((s) => (s.paperName || '').trim())
          .filter((v) => v !== '')
      )
    ).sort((a, c) => a.localeCompare(c))

    return { boards: b, yearsForBoard: y, paperNamesForBoardYear: p }
  }, [sources, selectedBoard, selectedYear])

  useEffect(() => {
    setSelectedYear('')
    setSelectedPaperName('')
    setSelectedSourceId('')
    setSuccess(null)
  }, [selectedBoard])

  useEffect(() => {
    setSelectedPaperName('')
    setSelectedSourceId('')
    setSuccess(null)
  }, [selectedYear])

  useEffect(() => {
    if (!selectedBoard || !selectedYear || !selectedPaperName) {
      setSelectedSourceId('')
      return
    }

    const yearInt = Number.parseInt(selectedYear.trim(), 10)
    if (!Number.isFinite(yearInt)) {
      setSelectedSourceId('')
      return
    }

    const found = sources.find(
      (s) =>
        (s.board || '').trim() === selectedBoard.trim() &&
        s.year != null &&
        Number(s.year) === yearInt &&
        (s.paperName || '').trim() === selectedPaperName
    )
    setSelectedSourceId(found?.id ? Number(found.id) : '')
    setSuccess(null)
  }, [selectedBoard, selectedYear, selectedPaperName, sources])

  const handleToggleCorrect = (idx: number) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, isCorrect: !o.isCorrect } : o)))
  }

  const handleOptionText = (idx: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, text: value } : o)))
  }

  const uploadImageIfAny = async (): Promise<string | null> => {
    if (!imageFile) return null

    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Failed to read image'))
      reader.readAsDataURL(imageFile)
    })

    const res = await fetch('http://localhost:5000/api/uploads/question-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, filename: imageFile.name }),
    })

    if (!res.ok) {
      const j = await res.json().catch(() => null)
      throw new Error(j?.error || 'Failed to upload image')
    }

    const j = await res.json()
    return j?.imageUrl ? String(j.imageUrl) : null
  }

  const clearQuestionForm = () => {
    setQuestionText('')
    setMarks('1')
    setImageFile(null)
    setOptions([
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ])
    setSubjectiveAnswer('')
  }

  const createNewPaperSource = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const board = newBoard.trim()
      const paperName = newPaperName.trim()
      const year = newYear.trim()
      const sourceRes = await fetch('http://localhost:5000/api/question-sources/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board, paperName, year }),
      })
      const sourceJson = await sourceRes.json().catch(() => null)
      if (!sourceRes.ok) {
        const msg = sourceJson?.details ? `${sourceJson?.error || 'Failed to create paper source'}: ${sourceJson.details}` : sourceJson?.error
        throw new Error(msg || 'Failed to create paper source')
      }
      const newId = sourceJson?.id
      if (newId) {
        await loadSources()
        setSelectedBoard(board)
        setSelectedYear(String(sourceJson?.year ?? year))
        setSelectedPaperName(paperName)
        setNewBoard('')
        setNewYear('')
        setNewPaperName('')
        setSuccess('Paper source saved.')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to create source')
    } finally {
      setLoading(false)
    }
  }

  const submitQuestion = async () => {
    if (!canSave) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const sourceId = selectedSourceId
      if (sourceId === '') throw new Error('Please select a paper source')

      let imageUrl: string | null = null
      try {
        imageUrl = await uploadImageIfAny()
      } catch (e: any) {
        throw new Error(e?.message || 'Image upload failed')
      }

      const payload: any = {
        classId,
        subjectId,
        sourceId,
        questionText,
        questionType: questionType === 'MCQ' ? 'MCQ' : 'SUBJECTIVE',
        marks: String(marks),
        difficulty: 'MEDIUM',
      }

      if (imageUrl) payload.imageUrl = imageUrl

      if (questionType === 'MCQ') {
        payload.options = options.map((o) => ({ text: o.text, isCorrect: !!o.isCorrect }))
      } else {
        payload.correctAnswer = subjectiveAnswer
      }

      const qRes = await fetch('http://localhost:5000/api/question-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const qJson = await qRes.json().catch(() => null)
      if (!qRes.ok) {
        const msg = qJson?.details ? `${qJson?.error || 'Failed to save question'}: ${qJson.details}` : qJson?.error
        throw new Error(msg || 'Failed to save question')
      }

      setSuccess('Question saved.')
      return qJson
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
      return null
    } finally {
      setLoading(false)
    }
  }

  const handleSaveOnly = async () => {
    const ok = await submitQuestion()
    if (ok) {
    }
  }

  const handleNextQuestion = async () => {
    const ok = await submitQuestion()
    if (ok) {
      clearQuestionForm()
    }
  }

  return (
    <div className="admin-dashboard-page">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <img className="sidebar-brand-logo" src="/exam_setu.png" alt="ExamSetu" />
          <span className="sidebar-brand-name">ExamSetu</span>
        </div>
        <nav className="sidebar-nav">
          <a
            href="#"
            className="nav-item"
            onClick={(e) => {
              e.preventDefault()
              navigate('/admin-dashboard')
            }}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Dashboard</span>
          </a>
          <a href="#" className="nav-item active" onClick={(e) => e.preventDefault()}>
            <span className="nav-icon">📚</span>
            <span className="nav-text">Old Papers</span>
          </a>
        </nav>
      </aside>

      <main className="admin-dashboard-main">
        <header className="admin-dashboard-header">
          <div className="header-left">
            <h1 className="header-title">Old Papers</h1>
          </div>
          <div className="header-right">
            <div className="user-profile">
              <div className="user-avatar">SN</div>
              <span className="user-name">School Name</span>
            </div>
          </div>
        </header>

        <div className="admin-old-papers-content">
          <div className="admin-old-papers-card">
            <div className="responses-page-header">
              <div>
                <h2 className="responses-page-title">Upload Questions</h2>
                <p className="responses-page-subtitle">Add questions directly into database for a specific paper and year.</p>
              </div>
              <button className="responses-page-close" onClick={() => navigate('/admin-dashboard')}>
                Back
              </button>
            </div>

            <div className="admin-old-papers-status-row">
              <div className="admin-old-papers-selected">
                {selectedBoard && selectedYear && selectedPaperName ? (
                  <span className="admin-old-papers-badge">
                    {selectedBoard} • {selectedYear} • {selectedPaperName}
                  </span>
                ) : (
                  <span className="admin-old-papers-badge muted">Select a paper source to start adding questions</span>
                )}
              </div>
            </div>

            {error && (
              <div className="responses-error" style={{ marginBottom: 12 }}>
                {error}
              </div>
            )}

            {success && (
              <div className="responses-success" style={{ marginBottom: 12 }}>
                {success}
              </div>
            )}

            <div className="admin-old-papers-card" style={{ marginBottom: 14 }}>
              <div className="responses-page-header" style={{ marginBottom: 10 }}>
                <div>
                  <h3 className="responses-page-title" style={{ fontSize: 16 }}>Paper Source</h3>
                  <p className="responses-page-subtitle">Select existing paper source or add a new old paper.</p>
                </div>
              </div>

              <div className="admin-old-papers-form">
                <div>
                  <label>Board</label>
                  <select value={selectedBoard} onChange={(e) => setSelectedBoard(e.target.value)} disabled={loading}>
                    <option value="">Select Board</option>
                    {boards.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Year</label>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} disabled={loading || !selectedBoard}>
                    <option value="">Select Year</option>
                    {yearsForBoard.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="full">
                  <label>Paper Name</label>
                  <select
                    value={selectedPaperName}
                    onChange={(e) => setSelectedPaperName(e.target.value)}
                    disabled={loading || !selectedBoard || !selectedYear}
                  >
                    <option value="">Select Paper Name</option>
                    {paperNamesForBoardYear.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="full admin-old-papers-actions">
                  <button
                    className="admin-old-papers-secondary"
                    onClick={() => {
                      setSelectedBoard('')
                      setSelectedYear('')
                      setSelectedPaperName('')
                    }}
                    disabled={loading}
                  >
                    Clear Selection
                  </button>
                  <button
                    className="admin-old-papers-secondary"
                    onClick={() => setShowAddPaper((v) => !v)}
                    disabled={loading}
                  >
                    {showAddPaper ? 'Hide Add Paper' : 'Add Another Old Paper'}
                  </button>
                </div>

                {showAddPaper && (
                  <>
                    <div className="full" style={{ marginTop: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Add another old paper</div>
                    </div>

                    <div>
                      <label>Board</label>
                      <input
                        value={newBoard}
                        onChange={(e) => setNewBoard(e.target.value)}
                        placeholder="CBSE / UP / ..."
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label>Year</label>
                      <input
                        value={newYear}
                        onChange={(e) => setNewYear(e.target.value)}
                        placeholder="e.g. 2023"
                        disabled={loading}
                      />
                    </div>

                    <div className="full">
                      <label>Paper Name</label>
                      <input
                        value={newPaperName}
                        onChange={(e) => setNewPaperName(e.target.value)}
                        placeholder="Enter paper name"
                        disabled={loading}
                      />
                    </div>

                    <div className="full admin-old-papers-actions">
                      <button
                        className="admin-old-papers-secondary"
                        onClick={() => {
                          setNewBoard('')
                          setNewYear('')
                          setNewPaperName('')
                        }}
                        disabled={loading}
                      >
                        Clear
                      </button>
                      <button
                        className="admin-old-papers-primary"
                        onClick={createNewPaperSource}
                        disabled={loading || !newBoard.trim() || !newYear.trim() || !newPaperName.trim()}
                      >
                        {loading ? 'Saving...' : 'Save Paper'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="admin-old-papers-form">
              <div>
                <label>Class</label>
                <select value={classId} onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.className} {c.section}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Subject</label>
                <select value={subjectId} onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subjectName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Question Type</label>
                <select value={questionType} onChange={(e) => setQuestionType(e.target.value as QuestionTypeUi)}>
                  <option value="MCQ">MCQ</option>
                  <option value="SUBJECTIVE">Subjective</option>
                </select>
              </div>

              <div>
                <label>Marks</label>
                <input value={marks} onChange={(e) => setMarks(e.target.value)} type="number" min={1} step={1} />
              </div>

              <div className="full">
                <label>Question Text</label>
                <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Enter question" />
              </div>

              <div className="full">
                <label>Question Image (optional)</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </div>

              {questionType === 'MCQ' ? (
                <div className="full">
                  <label>Options (tick correct)</label>
                  <div className="admin-old-papers-options">
                    {options.map((opt, idx) => (
                      <div key={idx} className="admin-old-papers-option">
                        <input
                          type="checkbox"
                          checked={opt.isCorrect}
                          onChange={() => handleToggleCorrect(idx)}
                          title="Correct"
                        />
                        <input
                          value={opt.text}
                          onChange={(e) => handleOptionText(idx, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="full">
                  <label>Answer</label>
                  <textarea
                    value={subjectiveAnswer}
                    onChange={(e) => setSubjectiveAnswer(e.target.value)}
                    placeholder="Enter answer text"
                  />
                </div>
              )}

              <div className="full admin-old-papers-actions">
                <button
                  className="admin-old-papers-secondary"
                  onClick={() => {
                    clearQuestionForm()
                  }}
                  disabled={loading}
                >
                  Clear
                </button>
                <button
                  className="admin-old-papers-secondary"
                  onClick={handleSaveOnly}
                  disabled={loading || !canSave}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  className="admin-old-papers-primary"
                  onClick={handleNextQuestion}
                  disabled={loading || !canSave}
                >
                  {loading ? 'Saving...' : 'Next Question'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminOldPapersPage
