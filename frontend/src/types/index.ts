export interface Category {
  id: number;
  name: string;
  createdAt: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  archived: boolean;
  categories: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  title: string;
  content?: string;
  categoryIds?: number[];
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
  categoryIds?: number[];
}

export interface ListNotesParams {
  archived: boolean;
  categoryId?: number | null;
}
