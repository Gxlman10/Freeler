import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/public/HomePage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import CampaignDetailPage from '../pages/public/CampaignDetailPage';
import DashboardPage from '../pages/user/DashboardPage';
import ReferralPage from '../pages/user/ReferralPage';
import ProtectedRoute from './ProtectedRoute';

const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/campaign/:id" element={<CampaignDetailPage />} />
      
      {/* Rutas protegidas */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/campaign/:id/refer" element={
        <ProtectedRoute>
          <ReferralPage />
        </ProtectedRoute>
      } />
      
      {/* CRM routes - implementar después */}
      <Route path="/crm/*" element={<div>CRM Module</div>} />
    </Routes>
  );
};

export default AppRouter;