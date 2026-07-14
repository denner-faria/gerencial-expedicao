import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { socket } from '../services/socket';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data && response.data.user) {
          setUser(response.data.user);
          socket.connect();
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (loginParam, password) => {
    const response = await api.post('/auth/login', { login: loginParam, password });
    const { user: userData } = response.data;
    
    setUser(userData);
    socket.connect();
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch(err) {}
    setUser(null);
    socket.disconnect();
  };

  const updateUser = (newUserData) => {
    const updated = { ...user, ...newUserData };
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
