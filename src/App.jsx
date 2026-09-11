import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProjectProvider } from './context/ProjectContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import InvestorDashboard from './pages/InvestorDashboard';
import ProjectDrilldown from './pages/ProjectDrilldown';
import ChatPage from './pages/ChatPage';
import ReportsPage from './pages/ReportsPage';
import IngestionPage from './pages/IngestionPage';
import RiskRegisterPage from './pages/RiskRegisterPage';
import KnowledgePage from './pages/KnowledgePage';
import GuardrailsPage from './pages/GuardrailsPage';
import SettingsPage from './pages/SettingsPage';

const Unauthorized = () => <div className="p-10 text-2xl font-bold text-hover text-center mt-20">Unauthorized Access</div>;

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ProjectProvider>
            <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              <Route element={<ProtectedRoute allowedRoles={['Investor', 'Program Director', 'PMO', 'Project Manager']} />}>
                <Route element={<AppLayout />}>
                  {/* All 4 personas - Projects Hub & Active Project Workspace */}
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/dashboard" element={<InvestorDashboard />} />
                  <Route path="/project/:id" element={<ProjectDrilldown />} />
                  <Route path="/chat" element={<ChatPage />} />
                
                {/* Knowledge & RAG: Investor, Program Director, PMO */}
                <Route element={<ProtectedRoute allowedRoles={['Investor', 'Program Director', 'PMO']} />}>
                  <Route path="/knowledge" element={<KnowledgePage />} />
                </Route>

                {/* Risk Register: Program Director, PMO, Project Manager */}
                <Route element={<ProtectedRoute allowedRoles={['Program Director', 'PMO', 'Project Manager']} />}>
                  <Route path="/risks" element={<RiskRegisterPage />} />
                </Route>

                {/* Reports & Analytics: Investor, Program Director, PMO */}
                <Route element={<ProtectedRoute allowedRoles={['Investor', 'Program Director', 'PMO']} />}>
                  <Route path="/reports" element={<ReportsPage />} />
                </Route>

                {/* Guardrails & Compliance Audits: Program Director, PMO */}
                <Route element={<ProtectedRoute allowedRoles={['Program Director', 'PMO']} />}>
                  <Route path="/guardrails" element={<GuardrailsPage />} />
                </Route>

                {/* Connectors / Settings: PMO and Program Director */}
                <Route element={<ProtectedRoute allowedRoles={['PMO', 'Program Director']} />}>
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* Ingestion: PMO, Project Manager */}
                <Route element={<ProtectedRoute allowedRoles={['PMO', 'Project Manager']} />}>
                  <Route path="/ingestion" element={<IngestionPage />} />
                </Route>
              </Route>
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ProjectProvider>
    </AuthProvider>
  </ToastProvider>
</ThemeProvider>
  );
}

export default App;
