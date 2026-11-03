import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { AdminThemeProvider } from './context/AdminThemeContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ToastProvider from '../context/ToastContext';
import ErrorBoundary from '../components/ErrorBoundary';
import NetworkStatus from '../components/NetworkStatus.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminRegister from './pages/AdminRegister.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MOUList from './pages/MOUList.jsx';
import CreateMOU from './pages/CreateMOU.jsx';
import EditMOU from './pages/EditMOU.jsx';
import ContentManagement from './pages/ContentManagement.jsx';
import CSRManagement from './pages/CSRManagement.jsx';
import CSREdit from './pages/CSREdit.jsx';
import LearningManagement from './pages/LearningManagement.jsx';
import LearningEdit from './pages/LearningEdit.jsx';
import BusinessSolutionManagement from './pages/BusinessSolutionManagement.jsx';
import BusinessSolutionEdit from './pages/BusinessSolutionEdit.jsx';
import CareerManagement from './pages/CareerManagement.jsx';
import CareerEdit from './pages/CareerEdit.jsx';
import Applications from './pages/Applications.jsx';
import Messages from './pages/Messages.jsx';
import AdminManagement from './pages/AdminManagement.jsx';
import ChangePassword from './pages/ChangePassword.jsx';

export default function AdminRoutes() {
  return (
    <AuthProvider>
      <AdminThemeProvider>
        <NotificationProvider>
        <ErrorBoundary>
          <ToastProvider>
            <NetworkStatus />
            <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route path="/admin/verify-email" element={<VerifyEmail />} />
          <Route path="/admin/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin/reset-password" element={<ResetPassword />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="mous" element={<MOUList />} />
            <Route path="mous/create" element={<CreateMOU />} />
            <Route path="mous/:id/edit" element={<EditMOU />} />
            <Route path="content" element={<ContentManagement />} />
            <Route path="csr" element={<CSRManagement />} />
            <Route path="csr/create" element={<CSREdit />} />
            <Route path="csr/:id/edit" element={<CSREdit />} />
            <Route path="learning" element={<LearningManagement />} />
            <Route path="learning/create" element={<LearningEdit />} />
            <Route path="learning/:id/edit" element={<LearningEdit />} />
            <Route path="business-solutions" element={<BusinessSolutionManagement />} />
            <Route path="business-solutions/create" element={<BusinessSolutionEdit />} />
            <Route path="business-solutions/:id/edit" element={<BusinessSolutionEdit />} />
            <Route path="careers" element={<CareerManagement />} />
            <Route path="careers/create" element={<CareerEdit />} />
            <Route path="careers/:id/edit" element={<CareerEdit />} />
            <Route path="applications" element={<Applications />} />
            <Route path="messages" element={<Messages />} />
            <Route path="admins" element={<AdminManagement />} />
            <Route path="change-password" element={<ChangePassword />} />
          </Route>
        </Routes>
          </ToastProvider>
        </ErrorBoundary>
        </NotificationProvider>
      </AdminThemeProvider>
    </AuthProvider>
  );
}
