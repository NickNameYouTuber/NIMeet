import { API_BASE_URL } from '../utils/constants';
import { LoginCredentials, RegisterCredentials, AuthResponse, User } from '../types/user.types';

class AuthService {
  private tokenKey = 'authToken';

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const url = `${API_BASE_URL}/api/auth/register`;
    console.log('Register request:', { url, credentials });
    
    try {
      console.log('Making fetch request to:', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      console.log('Register response:', { 
        url, 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Register error:', { url, error, status: response.status });
        const detailedError = `Ошибка регистрации (${response.status}): ${error.message || 'Неизвестная ошибка'}\n\nДетали:\n- URL: ${url}\n- Метод: POST\n- Статус: ${response.status} ${response.statusText}\n- Отправленные данные: ${JSON.stringify(credentials)}\n- Ответ сервера: ${JSON.stringify(error)}\n- Время: ${new Date().toISOString()}`;
        throw new Error(detailedError);
      }

      const data = await response.json();
      console.log('Register success:', { url, data });
      this.setToken(data.token);
      return data;
    } catch (error) {
      console.error('Register fetch error:', { url, error });
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      
      // Дополнительная диагностика для Tauri
      const tauriInfo = typeof window !== 'undefined' ? {
        isTauri: !!(window as any).__TAURI__,
        userAgent: navigator.userAgent,
        location: window.location.href
      } : {};
      
      const detailedError = `Ошибка подключения к серверу: ${errorMessage}\n\nДетали:\n- URL: ${url}\n- Метод: POST\n- Отправленные данные: ${JSON.stringify(credentials)}\n- Ошибка: ${errorMessage}\n- Tauri: ${JSON.stringify(tauriInfo)}\n- Время: ${new Date().toISOString()}`;
      throw new Error(detailedError);
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const url = `${API_BASE_URL}/api/auth/login`;
    console.log('Login request:', { url, credentials });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      console.log('Login response:', { 
        url, 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok 
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Login error:', { url, error, status: response.status });
        const detailedError = `Ошибка входа (${response.status}): ${error.message || 'Неизвестная ошибка'}\n\nДетали:\n- URL: ${url}\n- Метод: POST\n- Статус: ${response.status} ${response.statusText}\n- Отправленные данные: ${JSON.stringify(credentials)}\n- Ответ сервера: ${JSON.stringify(error)}\n- Время: ${new Date().toISOString()}`;
        throw new Error(detailedError);
      }

      const data = await response.json();
      console.log('Login success:', { url, data });
      this.setToken(data.token);
      return data;
    } catch (error) {
      console.error('Login fetch error:', { url, error });
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      const detailedError = `Ошибка подключения к серверу: ${errorMessage}\n\nДетали:\n- URL: ${url}\n- Метод: POST\n- Отправленные данные: ${JSON.stringify(credentials)}\n- Ошибка: ${errorMessage}\n- Время: ${new Date().toISOString()}`;
      throw new Error(detailedError);
    }
  }

  async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Токен не найден');
    }

    const url = `${API_BASE_URL}/api/auth/me`;
    console.log('GetCurrentUser request:', { url });
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      console.log('GetCurrentUser response:', { 
        url, 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok 
      });

      if (!response.ok) {
        console.error('GetCurrentUser error:', { url, status: response.status });
        const detailedError = `Ошибка получения данных пользователя (${response.status})\n\nДетали:\n- URL: ${url}\n- Метод: GET\n- Статус: ${response.status} ${response.statusText}\n- Токен: ${token ? 'присутствует' : 'отсутствует'}\n- Время: ${new Date().toISOString()}`;
        throw new Error(detailedError);
      }

      const data = await response.json();
      console.log('GetCurrentUser success:', { url, data });
      return data;
    } catch (error) {
      console.error('GetCurrentUser fetch error:', { url, error });
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      const detailedError = `Ошибка подключения к серверу: ${errorMessage}\n\nДетали:\n- URL: ${url}\n- Метод: GET\n- Токен: ${token ? 'присутствует' : 'отсутствует'}\n- Ошибка: ${errorMessage}\n- Время: ${new Date().toISOString()}`;
      throw new Error(detailedError);
    }
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  logout(): void {
    this.removeToken();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

const authService = new AuthService();
export default authService;

