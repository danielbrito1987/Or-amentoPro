
import { User } from '../types';
import { apiService } from './api.service';

const TOKEN_KEY = 'orcafacil_jwt_token';
const USER_KEY = 'orcafacil_user';

export const authService = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const response = await apiService.post<any>('/auth/login', { 
      email, 
      password 
    });

    // Extração resiliente do token: busca em campos comuns caso 'token' não exista na raiz
    const token = response.token || response.accessToken || response.jwt || (response.data && (response.data.token || response.data.accessToken));
    const user = response.user || response.data?.user || response;

    if (!token) {
      console.error("Resposta da API de login sem token:", response);
      throw new Error("Falha na autenticação: Token não recebido do servidor.");
    }

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    return { token, user };
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser: (): User | null => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token && token !== 'undefined' && token !== 'null';
  }
};
