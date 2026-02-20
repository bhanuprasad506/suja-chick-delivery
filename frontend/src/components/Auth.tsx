import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthProps {
  onSuccess: () => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let success = false;
      
      if (isLogin) {
        const role = isAdminLogin ? 'admin' : 'customer';
        success = await login(formData.email, formData.password, role);
      } else {
        success = await register(formData.name, formData.email, formData.password);
      }

      if (success) {
        onSuccess();
      } else {
        alert(isLogin ? 'Invalid credentials' : 'Registration failed');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🐣</div>
          <h1 className="text-3xl font-bold text-orange-800">Suja Chick Delivery</h1>
          <p className="text-orange-600">Professional Delivery Management</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-orange-500">
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {setIsLogin(true); setIsAdminLogin(false);}}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  isLogin && !isAdminLogin ? 'bg-orange-600 text-white' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Customer Login
              </button>
              <button
                onClick={() => {setIsLogin(false); setIsAdminLogin(false);}}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  !isLogin ? 'bg-green-600 text-white' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Register
              </button>
              <button
                onClick={() => {setIsLogin(true); setIsAdminLogin(true);}}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  isLogin && isAdminLogin ? 'bg-red-600 text-white' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  👤 Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📧 Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                placeholder={isAdminLogin ? "admin@suja.com" : "Enter your email"}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🔒 Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                placeholder={isAdminLogin ? "admin123" : "Enter your password"}
                required
              />
            </div>

            {isAdminLogin && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  <strong>Admin Demo Credentials:</strong><br/>
                  Email: admin@suja.com<br/>
                  Password: admin123
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                isAdminLogin 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : isLogin 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'bg-green-600 hover:bg-green-700'
              } disabled:bg-gray-400`}
            >
              {loading ? '⏳ Please wait...' : 
               isAdminLogin ? '🔐 Admin Login' :
               isLogin ? '🚪 Login' : '📝 Register'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {isLogin ? (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-orange-600 hover:text-orange-800 font-medium"
                >
                  Register here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-orange-600 hover:text-orange-800 font-medium"
                >
                  Login here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}