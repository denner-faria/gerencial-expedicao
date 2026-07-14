import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { socket } from '../services/socket';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('@Expedicao:user');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
      socket.connect();
    }
    setLoading(false);
  }, []);

  const login = async (loginParam, password) => {
    const response = await api.post('/auth/login', { login: loginParam, password });
    
    const { user: userData, token } = response.data;
    
    localStorage.setItem('@Expedicao:user', JSON.stringify(userData));
    localStorage.setItem('@Expedicao:token', token);
    
    setUser(userData);
    socket.connect();
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch(err) {}
    localStorage.removeItem('@Expedicao:user');
    localStorage.removeItem('@Expedicao:token');
    setUser(null);
    socket.disconnect();
  };

  const updateUser = (newUserData) => {
    const updated = { ...user, ...newUserData };
    setUser(updated);
    localStorage.setItem('@Expedicao:user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
