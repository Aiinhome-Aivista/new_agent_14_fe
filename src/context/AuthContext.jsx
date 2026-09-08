import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

// Mock roles: 'Investor', 'Program Director', 'Project Manager', 'PMO'
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check expiry
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
        } else {
          setUser({ role: decoded.role, email: decoded.sub || 'user' });
        }
      } catch (err) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authApi.login(email, password);
      localStorage.setItem('token', response.token);
      const decoded = jwtDecode(response.token);
      setUser({ role: decoded.role, email: decoded.sub || email });
      return true;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
