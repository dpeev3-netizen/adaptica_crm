import { useAuth } from '../store/useAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const fetchWithToken = async (endpoint: string, options: RequestInit = {}) => {
  const token = useAuth.getState().token;
  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
  
  if (res.status === 401) {
    useAuth.getState().logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
  
  return res;
};
