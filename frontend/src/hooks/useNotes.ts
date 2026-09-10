'use client';

import useSWR from 'swr';
import { toast } from 'sonner';
import { errorMessage } from '../api/client';
import { notesApi } from '../api/notes.api';
import type { CreateNotePayload, Note, UpdateNotePayload } from '../types';

/**
 * Owns the note list for the current filters.
 *
 * SWR rather than a fetch-in-useEffect: it is what the Next.js static export
 * guide recommends for client-side data, it dedupes concurrent requests, and it
 * keeps the fetch out of an effect. Every mutation revalidates from the API, so
 * the UI never shows state that was not actually persisted, and every failure
 * surfaces as a toast — components do not handle errors themselves.
 */
export function useNotes(archived: boolean, categoryId: number | null) {
  const {
    data,
    error,
    isLoading,
    mutate: revalidate,
  } = useSWR<Note[]>(
    ['notes', archived, categoryId],
    () => notesApi.list({ archived, categoryId }),
    {
      onError: (cause) =>
        toast.error('No se pudieron cargar las notas', {
          description: errorMessage(cause),
        }),
    },
  );

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
    notes: data ?? [],
    loading: isLoading,
    failed: Boolean(error),
    refresh: () => revalidate(),
    createNote: (payload: CreateNotePayload) =>
      run(() => notesApi.create(payload), 'Nota creada'),
    updateNote: (id: number, payload: UpdateNotePayload) =>
      run(() => notesApi.update(id, payload), 'Nota actualizada'),
    deleteNote: (id: number) => run(() => notesApi.remove(id), 'Nota eliminada'),
    archiveNote: (id: number) =>
      run(() => notesApi.archive(id), 'Nota archivada'),
    unarchiveNote: (id: number) =>
      run(() => notesApi.unarchive(id), 'Nota desarchivada'),
  };
}
