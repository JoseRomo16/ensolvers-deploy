import { useCallback, useEffect, useState } from 'react';
import { categoriesApi } from '../api/categories.api';
import { errorMessage } from '../api/client';
import type { Category } from '../types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await categoriesApi.list());
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mutate = useCallback(
    async (action: () => Promise<unknown>): Promise<boolean> => {
      try {
        await action();
        setError(null);
        await refresh();
        return true;
      } catch (err) {
        setError(errorMessage(err));
        return false;
      }
    },
    [refresh],
  );

  return {
    categories,
    loading,
    error,
    refresh,
    createCategory: (name: string) => mutate(() => categoriesApi.create(name)),
    deleteCategory: (id: number) => mutate(() => categoriesApi.remove(id)),
  };
}
