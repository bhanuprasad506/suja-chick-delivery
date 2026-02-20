import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: 'admin' | 'customer') => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('suja_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string, role: 'admin' | 'customer' = 'customer'): Promise<boolean> => {
    try {
      // Admin login (hardcoded for simplicity)
      if (email === 'admin@suja.com' && password === 'admin123' && role === 'admin') {
        const adminUser: User = {
          id: 'admin',
          name: 'Suja Admin',
          email: 'admin@suja.com',
          role: 'admin'
        };
        setUser(adminUser);
        localStorage.setItem('suja_user', JSON.stringify(adminUser));
        return true;
      }

      // Customer login (simple validation for demo)
      if (email && password && role === 'customer') {
        const customerUser: User = {
          id: email,
          name: email.split('@')[0],
          email: email,
          role: 'customer'
        };
        setUser(customerUser);
        localStorage.setItem('suja_user', JSON.stringify(customerUser));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // Simple registration (in real app, this would call an API)
      const newUser: User = {
        id: email,
        name: name,
        email: email,
        role: 'customer'
      };
      setUser(newUser);
      localStorage.setItem('suja_user', JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('suja_user');
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}