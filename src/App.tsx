import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import LoginPage from './pages/LoginPage'
import WelcomePage from './pages/WelcomePage'
import ChoicePage from './pages/ChoicePage'
import DashboardPage from './pages/DashboardPage'
import SubjectSectionPage from './pages/SubjectSectionPage'
import InstructionsPage from './pages/InstructionsPage'
import TestPage from './pages/TestPage'
import ResultsPage from './pages/ResultsPage'
import SettingsPage from './pages/SettingsPage'
import AdminTeacherDashboardPage from './pages/AdminTeacherDashboardPage'
import AdminOldPapersPage from './pages/AdminOldPapersPage'
import StudentsPage from './pages/StudentsPage'
import AdminStudentsPage from './pages/AdminStudentsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/choice" element={<ChoicePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin-dashboard" element={<AdminTeacherDashboardPage />} />
        <Route path="/admin-students" element={<AdminStudentsPage />} />
        <Route path="/admin-old-papers" element={<AdminOldPapersPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/subject/:subject" element={<SubjectSectionPage />} />
        <Route path="/instructions/:subject/:testType" element={<InstructionsPage />} />
        <Route path="/test/:subject/:testType" element={<TestPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
