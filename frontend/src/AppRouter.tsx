import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import CustomerPortal from './components/CustomerPortal';

export default function AppRouter() {
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