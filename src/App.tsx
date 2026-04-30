/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CategoryList = lazy(() => import('./pages/CategoryList'));
const ChallengeList = lazy(() => import('./pages/ChallengeList'));
const ChallengeDetail = lazy(() => import('./pages/ChallengeDetail'));
const PromptLab = lazy(() => import('./pages/PromptLab'));
const Profile = lazy(() => import('./pages/Profile'));
const AuthPage = lazy(() => import('./pages/AuthPage'));

import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-[#020617] text-brand-primary">Loading VibeCode...</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/find-bug" element={<CategoryList />} />
            <Route path="/find-bug/:category" element={<ChallengeList />} />
            <Route path="/find-bug/:category/:challengeId" element={<ChallengeDetail />} />
            <Route path="/prompt-lab" element={<PromptLab />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
