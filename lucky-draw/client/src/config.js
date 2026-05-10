export const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' && window.location.port !== '3001' ? 'http://localhost:3001' : '');
