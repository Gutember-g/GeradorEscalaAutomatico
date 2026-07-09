import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import api from '../services/api';

export interface User {
  nome: string;
  email: string;
  role: 'USER' | 'SUPER_ADMIN';
  nomeOrganizacao: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (nomeResponsavel: string, email: string, senha: string, nomeParoquia: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session
    const savedToken = sessionStorage.getItem('token');
    const savedUser = sessionStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Configure initial axios header
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (email: string, senha: string) => {
    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', { email, senha });
      const { token: jwtToken, nome, role, nomeOrganizacao } = response.data;
      
      setToken(jwtToken);
      const userData: User = { nome, email, role, nomeOrganizacao };
      setUser(userData);

      sessionStorage.setItem('token', jwtToken);
      sessionStorage.setItem('user', JSON.stringify(userData));

      api.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao realizar login');
    }
  };

  const register = async (nomeResponsavel: string, email: string, senha: string, nomeParoquia: string) => {
    try {
      const response = await axios.post('http://localhost:8080/api/auth/register', {
        nomeResponsavel,
        email,
        senha,
        nomeParoquia
      });
      const { token: jwtToken, nome, role, nomeOrganizacao } = response.data;

      setToken(jwtToken);
      const userData: User = { nome, email, role, nomeOrganizacao };
      setUser(userData);

      sessionStorage.setItem('token', jwtToken);
      sessionStorage.setItem('user', JSON.stringify(userData));

      api.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao cadastrar organização');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
