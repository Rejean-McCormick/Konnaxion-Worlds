// FILE: frontend/shared/api.ts
// shared/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE ?? '/api',
  withCredentials: true,
});
