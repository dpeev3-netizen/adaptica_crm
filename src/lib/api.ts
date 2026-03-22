import { useAuth } from '../store/useAuth';

const API_BASE_URL = 'https://adaptica-crm.onrender.com/api';

export const fetchWithToken = async (endpoint: string, options: RequestInit = {}) => {
  const token = useAuth.getState().token;
  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout boundary
  
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (res.status === 401) {
      useAuth.getState().logout();
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};
