import axios from 'axios';

//localhost
//const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// enable to above line for loaclhost 
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
//enable the above line and change the address as given in port forward 5000 to access remotely
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
