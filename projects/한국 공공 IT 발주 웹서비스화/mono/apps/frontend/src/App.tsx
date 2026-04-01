import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProjectListPage from './pages/ProjectListPage';
import ProjectCreatePage from './pages/ProjectCreatePage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import DashboardTab from './pages/DashboardTab';
import WbsTab from './pages/WbsTab';
import CompaniesTab from './pages/CompaniesTab';
import MembersTab from './pages/MembersTab';
import CompanyListPage from './pages/CompanyListPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Private (authenticated) */}
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/projects" replace />} />
            <Route path="projects" element={<ProjectListPage />} />
            <Route path="projects/new" element={<ProjectCreatePage />} />
            <Route path="projects/:projectId" element={<ProjectDetailPage />}>
              <Route index element={<DashboardTab />} />
              <Route path="wbs" element={<WbsTab />} />
              <Route path="companies" element={<CompaniesTab />} />
              <Route path="members" element={<MembersTab />} />
            </Route>
            <Route path="companies" element={<CompanyListPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
