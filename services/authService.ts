
import { User } from '../types';
import { apiService } from './api.service';

const TOKEN_KEY = 'orcafacil_jwt_token';
const USER_KEY = 'orcafacil_user';

export const authService = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    // Agora faz a chamada real para o backend
    const result = await apiService.post<{ token: string; user: User }>('/auth/login', { 
      email, 
      password 
    });

    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    
    return result;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  }
};
