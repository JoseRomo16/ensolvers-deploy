'use client';

import { useState } from 'react';
import { CategoryFilter } from '../components/CategoryFilter';
import { CategoryManager } from '../components/CategoryManager';
import { NoteForm, type NoteFormValues } from '../components/NoteForm';
import { NoteList } from '../components/NoteList';
import { TabSwitcher } from '../components/TabSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';
import { useCategories } from '../hooks/useCategories';
import { useNotes } from '../hooks/useNotes';
import type { Note } from '../types';

export default function Home() {
  const [archived, setArchived] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const { categories, createCategory, deleteCategory } = useCategories();

  const {
    notes,
    loading,
    failed,
    refresh: refreshNotes,
    createNote,
    updateNote,
    deleteNote,
    archiveNote,
    unarchiveNote,
  } = useNotes(archived, categoryId);

  const handleSubmit = async (values: NoteFormValues): Promise<boolean> => {
    const payload = {
      title: values.title,
      content: values.content,
      categoryIds: values.categoryIds,
    };

    const ok = editingNote
      ? await updateNote(editingNote.id, payload)
      : await createNote(payload);

    if (ok && editingNote) {
      setEditingNote(null);
    }
    return ok;
  };

  const handleToggleArchive = async (note: Note) => {
    if (editingNote?.id === note.id) {
      setEditingNote(null);
    }
    await (note.archived ? unarchiveNote(note.id) : archiveNote(note.id));
  };

  const handleDelete = async (noteId: number) => {
    if (editingNote?.id === noteId) {
      setEditingNote(null);
    }
    await deleteNote(noteId);
  };

  const handleDeleteCategory = async (id: number) => {
    if (!(await deleteCategory(id))) {
      return;
    }
    setEditingNote(null);
    // Both the active filter and the chips on every note go stale after a delete.
    if (categoryId === id) {
      setCategoryId(null);
    } else {
      await refreshNotes();
    }
  };

  const emptyMessage = failed
    ? 'No se pudieron cargar las notas. Revisá que la API esté corriendo.'
    : categoryId !== null
      ? 'No hay notas con esta categoría.'
      : archived
        ? 'No hay notas archivadas.'
        : 'No hay notas activas. Creá la primera arriba.';

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Notas
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Creá, etiquetá y archivá tus notas.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
        <CategoryManager
          categories={categories}
          onCreate={createCategory}
          onDelete={handleDeleteCategory}
        />

        <main className="flex min-w-0 flex-col gap-5">
          {/* The key remounts the form when the selection changes, which is
              what resets its fields. See NoteForm for why. */}
          <NoteForm
            key={editingNote?.id ?? 'new'}
            categories={categories}
            note={editingNote}
            onSubmit={handleSubmit}
            onCancel={() => setEditingNote(null)}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabSwitcher
              archived={archived}
              onChange={(value) => {
                setArchived(value);
                setEditingNote(null);
              }}
            />
            <CategoryFilter
              categories={categories}
              selectedId={categoryId}
              onChange={setCategoryId}
            />
          </div>

          <NoteList
            notes={notes}
            loading={loading}
            emptyMessage={emptyMessage}
            onEdit={setEditingNote}
            onDelete={handleDelete}
            onToggleArchive={handleToggleArchive}
          />
        </main>
      </div>
    </div>
  );
}
