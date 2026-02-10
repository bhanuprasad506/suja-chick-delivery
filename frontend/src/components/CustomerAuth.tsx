import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

type CustomerAuthProps = {
  onLogin: (phone: string, name: string) => void;
};

export default function CustomerAuth({ onLogin }: CustomerAuthProps) {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone) {
      alert('Please enter your phone number');
      return;
    }

    if (!isLogin && !name) {
      alert('Please enter your name');
      return;
    }

    setIsLoading(true);
    
    if (isLogin) {
      // Login - check if account exists
      setTimeout(() => {
        // Try to login - if account doesn't exist, show error
        onLogin(phone, name || '');
        setIsLoading(false);
      }, 500);
    } else {
      // Register - create new account
      setTimeout(() => {
        onLogin(phone, name);
        setIsLoading(false);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative animated elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
      <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <div className="max-w-md w-full relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="h-32 mb-6 flex justify-center">
            <img 
              src="https://res.cloudinary.com/dyobufbnk/image/upload/v1770722646/suja_ani_-_Copy_ylshob.png" 
              alt="Suja Chicken & Eggs" 
              className="h-full object-contain drop-shadow-lg hover:drop-shadow-xl transition-all"
            />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Suja Chick Delivery
          </h1>
          <p className="text-gray-600 font-medium">{t('customer.title')}</p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-shadow">
          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent text-center">
              {isLogin ? '🔓 Login' : '📝 Create Account'}
            </h2>
            <p className="text-center text-gray-500 text-sm mt-2">
              {isLogin ? 'Access your delivery information' : 'Join Suja Chick Delivery'}
            </p>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone Number Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                📱 Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base transition-all bg-gray-50 focus:bg-white hover:border-gray-300"
                placeholder="Enter your phone number"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-2">We'll use this to track your orders</p>
            </div>

            {/* Name Field (Register Only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  👤 Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base transition-all bg-gray-50 focus:bg-white hover:border-gray-300"
                  placeholder="Enter your full name"
                  required={!isLogin}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-2">This helps us personalize your experience</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all font-bold text-base shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  {isLogin ? '🔓 Login' : '📝 Create Account'}
                </>
              )}
            </button>

            {/* Admin Portal Button */}
            <a 
              href="/admin" 
              className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:from-red-700 hover:to-orange-700 transition-all font-bold text-base shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 mt-3"
            >
              <span className="text-xl">🔐</span>
              <span>Admin Portal</span>
              <span>→</span>
            </a>
          </form>

          {/* Toggle Auth Mode */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setPhone('');
                setName('');
              }}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold text-base shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLogin ? '📝 Create Account' : '🔓 Login'}
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
            <p className="text-sm text-green-700 font-medium text-center">
              ✅ {isLogin ? 'Enter your phone number to login to your existing account' : 'Create a new account with your phone number and name'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
