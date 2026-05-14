import { create } from 'axios';

let authToken: string | null = null;
let unauthorizedHandler: (() => void | Promise<void>) | null = null;

export const setApiToken = (token: string | null) => {
  authToken = token;
};

export const setUnauthorizedHandler = (
  handler: (() => void | Promise<void>) | null,
) => {
  unauthorizedHandler = handler;
};

export const api = create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  } else if (config.headers.Authorization) {
    delete config.headers.Authorization;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401 && unauthorizedHandler) {
      await unauthorizedHandler();
    }
    return Promise.reject(error);
  },
);
