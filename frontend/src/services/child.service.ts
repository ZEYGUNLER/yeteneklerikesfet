import { api } from './api';

export type Child = {
  id: string;
  name?: string;
  firstName: string;
  lastName: string;
  age?: number;
  birthDate: string;
  gender: string;
  avatar: string;
  notes?: string;
  createdAt: string;
};

export type CreateChildPayload = {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  avatar: string;
  notes?: string;
};

export const childService = {
  async list() {
    const { data } = await api.get<Child[]>('/children');
    return data;
  },
  async create(payload: CreateChildPayload) {
    const { data } = await api.post<Child>('/children', payload);
    return data;
  },
};
