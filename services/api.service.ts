
const BASE_URL = 'https://orcamentopro-backend.onrender.com/api';

export const apiService = {
  getHeaders: () => {
    const token = localStorage.getItem('orcafacil_jwt_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  },

  handleResponse: async (response: Response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Erro ${response.status}`;

      if (response.status === 401) {
        // Apenas limpa se o token for explicitamente inválido/expirado
        localStorage.removeItem('orcafacil_jwt_token');
        localStorage.removeItem('orcafacil_user');
      }
      
      throw new Error(errorMessage);
    }
    
    return response.json();
  },

  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: apiService.getHeaders(),
    });
    return apiService.handleResponse(response);
  },

  post: async <T>(endpoint: string, data: any): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: apiService.getHeaders(),
      body: JSON.stringify(data),
    });
    return apiService.handleResponse(response);
  },

  put: async <T>(endpoint: string, data: any): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: apiService.getHeaders(),
      body: JSON.stringify(data),
    });
    return apiService.handleResponse(response);
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: apiService.getHeaders(),
    });
    return apiService.handleResponse(response);
  },
};
