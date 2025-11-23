import React, { useContext, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MainLayout from './components/MainLayout';
import ContainersPage from './pages/ContainersPage';
import ImagesPage from './pages/ImagesPage';
import NetworksPage from './pages/NetworksPage';
import NetworkDetailsPage from './pages/NetworkDetailsPage';
import VolumesPage from './pages/VolumesPage';
import UserSettingsPage from './pages/UserSettingsPage';
import { useSecureSession } from './hooks/useSecureSession';
import SessionWarningModal from './components/SessionWarningModal';

// Session management wrapper for authenticated routes
function SessionManager({ children }) {
  const { logout, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleWarning = useCallback(() => {
    // Could add notification sound or other alert here
  }, []);

  const {
    showWarning,
    timeRemaining,
    extendSession,
    endSession
  } = useSecureSession({
    inactivityTimeout: 15 * 60 * 1000, // 15 minutes
    warningTime: 2 * 60 * 1000, // 2 minutes before logout
    onLogout: handleLogout,
    onWarning: handleWarning,
    enabled: !!token
  });

  return (
    <>
      {children}
      {showWarning && (
        <SessionWarningModal
          timeRemaining={timeRemaining}
          onExtend={extendSession}
          onLogout={endSession}
        />
      )}
    </>
  );
}

// A wrapper for routes that require authentication.
function PrivateRoute({ children }) {
  const { token } = useContext(AuthContext);
  return token ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" />;
}

function App() {
  const { token, isInitialized } = useContext(AuthContext);

  // Show loading while CSRF is initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <SessionManager>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/containers" element={<PrivateRoute><ContainersPage /></PrivateRoute>} />
        <Route path="/images" element={<PrivateRoute><ImagesPage /></PrivateRoute>} />
        <Route path="/networks" element={<PrivateRoute><NetworksPage /></PrivateRoute>} />
        <Route path="/networks/:id" element={<PrivateRoute><NetworkDetailsPage /></PrivateRoute>} />
        <Route path="/volumes" element={<PrivateRoute><VolumesPage /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><UserSettingsPage /></PrivateRoute>} />
        {/* Default route - redirect authenticated users to dashboard, others to login */}
        <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
      </Routes>
    </SessionManager>
  );
}

export default App;