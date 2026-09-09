import { useState } from 'react';
import './App.css';
import { CategoryFilter } from './components/CategoryFilter';
import { CategoryManager } from './components/CategoryManager';
import { NoteForm, type NoteFormValues } from './components/NoteForm';
import { NoteList } from './components/NoteList';
import { TabSwitcher } from './components/TabSwitcher';
import { useCategories } from './hooks/useCategories';
import { useNotes } from './hooks/useNotes';
import type { Note } from './types';

export default function App() {
  const [archived, setArchived] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const {
    categories,
    error: categoriesError,
    createCategory,
    deleteCategory,
  } = useCategories();

  const {
    notes,
    loading,
    error: notesError,
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

  const emptyMessage =
    categoryId !== null
      ? 'No hay notas con esta categoría.'
      : archived
        ? 'No hay notas archivadas.'
        : 'No hay notas activas. Creá la primera arriba.';

  const error = notesError ?? categoriesError;

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Notas</h1>
        <p className="app__subtitle">Creá, etiquetá y archivá tus notas.</p>
      </header>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      <div className="layout">
        <CategoryManager
          categories={categories}
          onCreate={createCategory}
          onDelete={handleDeleteCategory}
        />

        <main className="content">
          <NoteForm
            categories={categories}
            note={editingNote}
            onSubmit={handleSubmit}
            onCancel={() => setEditingNote(null)}
          />

          <div className="toolbar">
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
