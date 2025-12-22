
const API_BASE_URL = 'https://orcamentopro-backend.onrender.com/api'; // Alterar se o backend estiver em outra porta/url

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

class ApiService {
    private getToken(): string | null {
        return localStorage.getItem('authToken');
    }

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const token = this.getToken();
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config: RequestInit = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

            // Tratamento para 401 (Token expirado ou inválido)
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                window.location.href = '#/login';
                throw new Error('Sessão expirada');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erro na requisição: ${response.status}`);
            }

            // Se não tiver conteúdo (ex: 204 No Content), retorna null
            if (response.status === 204) return null as T;

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    get<T>(endpoint: string) {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    post<T>(endpoint: string, body: any) {
        return this.request<T>(endpoint, { 
            method: 'POST', 
            body: JSON.stringify(body) 
        });
    }

    put<T>(endpoint: string, body: any) {
        return this.request<T>(endpoint, { 
            method: 'PUT', 
            body: JSON.stringify(body) 
        });
    }

    delete<T>(endpoint: string) {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

export const api = new ApiService();