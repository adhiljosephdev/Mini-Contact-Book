import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('accessToken');
    if (username && token) {
      setUser({ username });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/api/token/', { username, password });
    localStorage.setItem('accessToken', res.data.access);
    localStorage.setItem('refreshToken', res.data.refresh);
    localStorage.setItem('username', username);
    setUser({ username });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    setUser(null);
  };

  const register = async (username, email, password) => {
    await api.post('/api/register/', { username, email, password });
    return login(username, password);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
