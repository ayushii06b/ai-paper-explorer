/**
 * Application API Configuration
 * 
 * In local development: defaults to http://localhost:8000.
 * In production deployment (e.g. Vercel): reads VITE_API_URL environment variable.
 */
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '');
