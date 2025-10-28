import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import NginxPage from './pages/NginxPage';

// A wrapper for routes that require authentication.
function PrivateRoute({ children }) {
  const { token } = useContext(AuthContext);
  return token ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/containers" element={<PrivateRoute><ContainersPage /></PrivateRoute>} />
      <Route path="/images" element={<PrivateRoute><ImagesPage /></PrivateRoute>} />
      <Route path="/networks" element={<PrivateRoute><NetworksPage /></PrivateRoute>} />
      <Route path="/networks/:id" element={<PrivateRoute><NetworkDetailsPage /></PrivateRoute>} />
      <Route path="/volumes" element={<PrivateRoute><VolumesPage /></PrivateRoute>} />
      <Route path="/nginx" element={<PrivateRoute><NginxPage /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><UserSettingsPage /></PrivateRoute>} />
      {/* Default route */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;