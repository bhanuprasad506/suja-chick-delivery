import React from 'react';

export default function AdminPortal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-teal-600 mb-4">Admin Portal</h1>
        <p className="text-gray-600 mb-8">
          The admin portal is currently being migrated. Please use the main application.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Go to Customer Portal
        </a>
      </div>
    </div>
  );
}
