import type {
  CreateNotePayload,
  ListNotesParams,
  Note,
  UpdateNotePayload,
} from '../types';
import { http } from './client';

export const notesApi = {
  list({ archived, categoryId }: ListNotesParams): Promise<Note[]> {
    const params = new URLSearchParams({ archived: String(archived) });
    if (categoryId != null) {
      params.set('categoryId', String(categoryId));
    }
    return http.get<Note[]>(`/notes?${params.toString()}`);
  },

  create(payload: CreateNotePayload): Promise<Note> {
    return http.post<Note>('/notes', payload);
  },

  update(id: number, payload: UpdateNotePayload): Promise<Note> {
    return http.patch<Note>(`/notes/${id}`, payload);
  },

  remove(id: number): Promise<void> {
    return http.delete<void>(`/notes/${id}`);
  },

  archive(id: number): Promise<Note> {
    return http.patch<Note>(`/notes/${id}/archive`);
  },

  unarchive(id: number): Promise<Note> {
    return http.patch<Note>(`/notes/${id}/unarchive`);
  },

  addCategory(noteId: number, categoryId: number): Promise<Note> {
    return http.post<Note>(`/notes/${noteId}/categories`, { categoryId });
  },

  removeCategory(noteId: number, categoryId: number): Promise<Note> {
    return http.delete<Note>(`/notes/${noteId}/categories/${categoryId}`);
  },
};
