import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import CustomerPortal from './components/CustomerPortal';
import SplashScreen from './components/SplashScreen';

export default function AppRouter() {
  // Temporarily disable splash screen
  const [showSplash, setShowSplash] = useState(false);

  // useEffect(() => {
  //   if (showSplash) {
  //     console.log('Splash screen showing, will hide in 1 second');
  //     // Show splash for 1 second
  //     const timer = setTimeout(() => {
  //       console.log('Hiding splash screen now');
  //       setShowSplash(false);
  //       localStorage.setItem('hasSeenSplash', 'true');
  //     }, 1000);

  //     return () => {
  //       console.log('Cleaning up timer');
  //       clearTimeout(timer);
  //     };
  //   }
  // }, [showSplash]);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<CustomerPortal />} />
        <Route path="/customer" element={<CustomerPortal />} />
        <Route path="/admin" element={<App />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}