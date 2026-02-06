export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
    data?: any;
}

async function request(endpoint: string, options: RequestOptions = {}) {
    const token = localStorage.getItem('evara_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const config: RequestInit = {
        ...options,
        headers,
    };

    if (options.data) {
        config.body = JSON.stringify(options.data);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    // Handle 304 Not Modified as success - browser returns cached response
    if (!response.ok && response.status !== 304) {
        throw new Error(data.message || 'API request failed');
    }

    return data;
}

export const api = {
    get: (endpoint: string, options?: RequestOptions) => request(endpoint, { ...options, method: 'GET' }),
    post: (endpoint: string, data: any, options?: RequestOptions) => request(endpoint, { ...options, method: 'POST', data }),
    put: (endpoint: string, data: any, options?: RequestOptions) => request(endpoint, { ...options, method: 'PUT', data }),
    delete: (endpoint: string, options?: RequestOptions) => request(endpoint, { ...options, method: 'DELETE' }),
};
