import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './components/layout/Layout';

import Login    from './pages/Login';
import Register from './pages/Register';

// Caretaker pages
import CaretakerDashboard from './pages/caretaker/CaretakerDashboard';
import EnterVitals        from './pages/caretaker/EnterVitals';
import AssignedPatients   from './pages/caretaker/AssignedPatients';
import AddObservation     from './pages/caretaker/AddObservation';
import CaretakerAlerts    from './pages/caretaker/CaretakerAlerts';
import CaretakerPatientAnalytics from './pages/caretaker/CaretakerPatientAnalytics';

// Doctor pages
import DoctorDashboard  from './pages/doctor/DoctorDashboard';
import PatientList      from './pages/doctor/PatientList';
import PatientAnalytics from './pages/doctor/PatientAnalytics';          // MAIN REVIEW PAGE
import CarePlanManager  from './pages/doctor/CarePlanManager';
import AlertManager     from './pages/doctor/AlertManager';

// Patient pages
import PatientDashboard from './pages/patient/PatientDashboard';
import MyVitals         from './pages/patient/MyVitals';
import MyCarePlan       from './pages/patient/MyCarePlan';

// Admin pages
import AdminDashboard    from './pages/admin/AdminDashboard';
import UserManagement    from './pages/admin/UserManagement';
import PatientAssignment from './pages/admin/PatientAssignment';
import SystemAnalytics   from './pages/admin/SystemAnalytics';

function Guard({ roles, children }) {
  return (
    <ProtectedRoute roles={roles}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* CARETAKER ROUTES */}
          <Route path="/caretaker"                                    element={<Guard roles={['caretaker']}><CaretakerDashboard /></Guard>} />
          <Route path="/caretaker/vitals"                            element={<Guard roles={['caretaker']}><EnterVitals /></Guard>} />
          <Route path="/caretaker/patients"                          element={<Guard roles={['caretaker']}><AssignedPatients /></Guard>} />
          <Route path="/caretaker/patients/:patientId/analytics"     element={<Guard roles={['caretaker']}><CaretakerPatientAnalytics /></Guard>} />
          <Route path="/caretaker/alerts"                            element={<Guard roles={['caretaker']}><CaretakerAlerts /></Guard>} />
          <Route path="/caretaker/observations"                      element={<Guard roles={['caretaker']}><AddObservation /></Guard>} />

          {/* DOCTOR ROUTES */}
          <Route path="/doctor"                              element={<Guard roles={['doctor']}><DoctorDashboard /></Guard>} />
          <Route path="/doctor/patients"                    element={<Guard roles={['doctor']}><PatientList /></Guard>} />
          <Route path="/doctor/patients/:patientId/analytics" element={<Guard roles={['doctor']}><PatientAnalytics /></Guard>} />
          <Route path="/doctor/careplans"                   element={<Guard roles={['doctor']}><CarePlanManager /></Guard>} />
          <Route path="/doctor/alerts"                      element={<Guard roles={['doctor']}><AlertManager /></Guard>} />

          {/* PATIENT ROUTES */}
          <Route path="/patient"          element={<Guard roles={['patient']}><PatientDashboard /></Guard>} />
          <Route path="/patient/vitals"   element={<Guard roles={['patient']}><MyVitals /></Guard>} />
          <Route path="/patient/careplan" element={<Guard roles={['patient']}><MyCarePlan /></Guard>} />

          {/* ADMIN ROUTES */}
          <Route path="/admin"             element={<Guard roles={['admin']}><AdminDashboard /></Guard>} />
          <Route path="/admin/users"       element={<Guard roles={['admin']}><UserManagement /></Guard>} />
          <Route path="/admin/assignments" element={<Guard roles={['admin']}><PatientAssignment /></Guard>} />
          <Route path="/admin/analytics"   element={<Guard roles={['admin']}><SystemAnalytics /></Guard>} />

          <Route path="/unauthorized" element={<div className="flex items-center justify-center h-screen text-[#94a3b8]">403 — Unauthorized</div>} />
          <Route path="/"  element={<Navigate to="/login" replace />} />
          <Route path="*"  element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
