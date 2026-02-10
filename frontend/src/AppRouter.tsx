import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminPortal from './components/AdminPortal';
import CustomerPortal from './components/CustomerPortal';
import SplashScreen from './components/SplashScreen';

export default function AppRouter() {
  // Temporarily disable splash screen
  const [showSplash] = useState(false);

  if (showSplash) {
    return <SplashScreen onComplete={() => {}} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<CustomerPortal />} />
        <Route path="/customer" element={<CustomerPortal />} />
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}