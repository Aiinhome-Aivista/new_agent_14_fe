import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

const getPersonaFallbackName = (role, email) => {
  if (role === 'Project Manager' || email === 'pm@example.com') return 'Sanjib Sau';
  if (role === 'PMO' || email === 'pmo@example.com') return 'Dipak Saha';
  if (role === 'Program Director' || email === 'director@example.com') return 'Pabitra Sarkar';
  if (role === 'Investor' || email === 'investor@example.com') return 'Ayan Manna';
  return 'User';
};

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
          const userEmail = decoded.email || decoded.sub || 'user';
          const userName = decoded.name || getPersonaFallbackName(decoded.role, userEmail);
          setUser({ 
            role: decoded.role, 
            email: userEmail,
            name: userName
          });
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
      const userEmail = decoded.email || decoded.sub || email;
      const userName = response.name || decoded.name || getPersonaFallbackName(decoded.role, userEmail);
      setUser({ 
        role: decoded.role, 
        email: userEmail,
        name: userName
      });
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
