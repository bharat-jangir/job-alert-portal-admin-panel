import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL}/api` 
    : (() => { throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables"); })(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Response error interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('[API Error]', error.response.status, error.config?.url);
    } else {
      console.error('[API Error]', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;