import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CandidateList from './pages/CandidateList';
import AddCandidate from './pages/AddCandidate';
import CandidateProfile from './pages/CandidateProfile';
import EditCandidate from './pages/EditCandidate';
import AgentList from './pages/AgentList';
import AgentProfile from './pages/AgentProfile';
import EditAgent from './pages/EditAgent';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFail from './pages/PaymentFail';
import PaymentCancel from './pages/PaymentCancel';
import PaymentError from './pages/PaymentError';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/payment/success/:tranId" element={<PaymentSuccess />} />
          <Route path="/payment/fail" element={<PaymentFail />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          <Route path="/payment-error" element={<PaymentError />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/candidates" element={<CandidateList />} />
            <Route path="/candidates/new" element={<AddCandidate />} />
            <Route path="/candidates/:id" element={<CandidateProfile />} />
            <Route path="/candidates/:id/edit" element={<EditCandidate />} />
            <Route path="/agents" element={<AgentList />} />
            <Route path="/agents/:id" element={<AgentProfile />} />
            <Route path="/agents/:id/edit" element={<EditAgent />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
