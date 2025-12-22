
import { User } from '../types';

const TOKEN_KEY = 'orcafacil_jwt_token';
const USER_KEY = 'orcafacil_user';

export const authService = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    // Simulando uma chamada de API e geração de JWT
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password.length >= 4) {
          const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ sub: email, iat: Date.now() }))}.fake-signature`;
          const user: User = {
            id: crypto.randomUUID(),
            email: email,
            name: email.split('@')[0]
          };
          
          localStorage.setItem(TOKEN_KEY, fakeToken);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          
          resolve({ token: fakeToken, user });
        } else {
          reject(new Error('Credenciais inválidas ou senha muito curta.'));
        }
      }, 800);
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
