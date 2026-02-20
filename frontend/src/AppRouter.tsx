import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import App from './App';
import CustomerPortal from './components/CustomerPortal';
import SplashScreen from './components/SplashScreen';

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();

  // Show splash screen when route changes
  useEffect(() => {
    setShowSplash(true);
  }, [location.pathname]);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <Routes>
      <Route path="/" element={<CustomerPortal />} />
      <Route path="/customer" element={<CustomerPortal />} />
      <Route path="/admin" element={<App />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function AppRouter() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}