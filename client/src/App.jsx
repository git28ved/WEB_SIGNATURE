import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DocumentViewPage from './pages/DocumentViewPage';
import EditorPage from './pages/EditorPage';
import ProfilePage from './pages/ProfilePage';
import SharedDocPage from './pages/SharedDocPage';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public auth pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/shared/:token" element={<SharedDocPage />} />

        {/* Protected app routes inside AppLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/document/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DocumentViewPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/document/:id/edit"
          element={
            <ProtectedRoute>
              <AppLayout>
                <EditorPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
