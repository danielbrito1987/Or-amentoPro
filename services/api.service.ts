
const BASE_URL = 'https://orcamentopro-backend.onrender.com/api';
const DEFAULT_TIMEOUT_MS = 2500;

const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return response;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Tempo de conexão esgotado ao contatar o servidor.');
    }
    throw err;
  }
};

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
    const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: apiService.getHeaders(),
    });
    return apiService.handleResponse(response);
  },

  post: async <T>(endpoint: string, data: any): Promise<T> => {
    const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: apiService.getHeaders(),
      body: JSON.stringify(data),
    });
    return apiService.handleResponse(response);
  },

  put: async <T>(endpoint: string, data: any): Promise<T> => {
    const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: apiService.getHeaders(),
      body: JSON.stringify(data),
    });
    return apiService.handleResponse(response);
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: apiService.getHeaders(),
    });
    return apiService.handleResponse(response);
  },
};
