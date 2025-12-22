
import { User } from '../types';
import { api } from './api.service';

const TOKEN_KEY = 'orcafacil_jwt_token';
const USER_KEY = 'orcafacil_user';

export const authService = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    // Simulando uma chamada de API e geração de JWT
    return new Promise((resolve, reject) => {
      try {
        setTimeout(async () => {
          const response = await api.post<{ access_token: string, user: User }>('/auth/login', {
            email,
            password
          });

          const { access_token, user } = response;

          localStorage.setItem(TOKEN_KEY, access_token);
          localStorage.setItem(USER_KEY, JSON.stringify(user));

          resolve({ token: access_token, user });
        }, 800);
      } catch (error) {
        console.error(error);
        throw new Error('Credenciais inválidas ou erro no servidor.');
      }
    });
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
