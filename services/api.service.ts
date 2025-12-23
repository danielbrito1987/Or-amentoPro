
const BASE_URL = 'https://orcamentopro-backend.onrender.com/api';

export const apiService = {
  getHeaders: () => {
    const token = localStorage.getItem('orcafacil_jwt_token');
    // Valida se o token é uma string válida antes de enviar
    const isValidToken = token && token !== 'undefined' && token !== 'null';
    
    return {
      'Content-Type': 'application/json',
      ...(isValidToken ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  },

  handleResponse: async (response: Response) => {
    if (!response.ok) {
      // Tenta extrair mensagem de erro do JSON
      let errorMessage = `Erro ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Se não for JSON, usa o statusText
        errorMessage = response.statusText || errorMessage;
      }

      if (response.status === 401) {
        // Apenas limpa se o token for explicitamente inválido ou expirado
        localStorage.removeItem('orcafacil_jwt_token');
        localStorage.removeItem('orcafacil_user');
      }
      
      throw new Error(errorMessage);
    }
    
    // Suporte para respostas vazias (204 No Content)
    if (response.status === 204) return {} as any;
    
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
