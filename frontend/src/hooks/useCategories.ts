'use client';

import useSWR from 'swr';
import { toast } from 'sonner';
import { categoriesApi } from '../api/categories.api';
import { errorMessage } from '../api/client';
import type { Category } from '../types';

export function useCategories() {
  const {
    data,
    isLoading,
    mutate: revalidate,
  } = useSWR<Category[]>(['categories'], () => categoriesApi.list(), {
    // Same as useNotes: a stable id keeps SWR's retries from stacking toasts.
    onError: (cause) =>
      toast.error('No se pudieron cargar las categorías', {
        id: 'categories-load-error',
        description: errorMessage(cause),
        duration: 8000,
      }),
    errorRetryCount: 3,
  });

  const run = async (
    action: () => Promise<unknown>,
    success: string,
  ): Promise<boolean> => {
    try {
      await action();
      await revalidate();
      toast.success(success);
      return true;
    } catch (cause) {
      toast.error(errorMessage(cause));
      return false;
    }
  };

  return {
    categories: data ?? [],
    loading: isLoading,
    refresh: () => revalidate(),
    createCategory: (name: string) =>
      run(() => categoriesApi.create(name), 'Categoría creada'),
    deleteCategory: (id: number) =>
      run(() => categoriesApi.remove(id), 'Categoría eliminada'),
  };
}
