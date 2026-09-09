import type { Category } from '../types';
import { http } from './client';

export const categoriesApi = {
  list(): Promise<Category[]> {
    return http.get<Category[]>('/categories');
  },

  create(name: string): Promise<Category> {
    return http.post<Category>('/categories', { name });
  },

  remove(id: number): Promise<void> {
    return http.delete<void>(`/categories/${id}`);
  },
};
