import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '../api/client';
import { notesApi } from '../api/notes.api';
import type { CreateNotePayload, Note, UpdateNotePayload } from '../types';

/**
 * Owns the note list for the current filters. Every mutation re-reads from the
 * API so the UI never drifts from what is actually persisted.
 */
export function useNotes(archived: boolean, categoryId: number | null) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setNotes(await notesApi.list({ archived, categoryId }));
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [archived, categoryId]);

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
    notes,
    loading,
    error,
    refresh,
    createNote: (payload: CreateNotePayload) =>
      mutate(() => notesApi.create(payload)),
    updateNote: (id: number, payload: UpdateNotePayload) =>
      mutate(() => notesApi.update(id, payload)),
    deleteNote: (id: number) => mutate(() => notesApi.remove(id)),
    archiveNote: (id: number) => mutate(() => notesApi.archive(id)),
    unarchiveNote: (id: number) => mutate(() => notesApi.unarchive(id)),
  };
}
