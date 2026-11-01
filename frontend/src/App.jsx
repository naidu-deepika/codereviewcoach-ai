import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import { HistoryDetail, HistoryList } from './pages/History.jsx'
import Home from './pages/Home.jsx'
import NewReview from './pages/NewReview.jsx'
import Practice from './pages/Practice.jsx'
import Profile from './pages/Profile.jsx'
import Progress from './pages/Progress.jsx'
import SignIn from './pages/SignIn.jsx'
import SignUp from './pages/SignUp.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/review/new" element={<NewReview />} />
          <Route path="/history" element={<HistoryList />} />
          <Route path="/history/:id" element={<HistoryDetail />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
