import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { QueryNotesDto } from './dto/query-notes.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './note.entity';
import { NotesRepository } from './notes.repository';

@Injectable()
export class NotesService {
  constructor(
    private readonly notesRepository: NotesRepository,
    private readonly categoriesService: CategoriesService,
  ) {}

  list(query: QueryNotesDto): Promise<Note[]> {
    return this.notesRepository.findAll({
      archived: query.archived ?? false,
      categoryId: query.categoryId,
    });
  }

  async getById(id: number): Promise<Note> {
    const note = await this.notesRepository.findById(id);
    if (!note) {
      throw new NotFoundException(`Note ${id} not found`);
    }
    return note;
  }

  async create(dto: CreateNoteDto): Promise<Note> {
    const note = this.notesRepository.create({
      title: dto.title,
      content: dto.content ?? '',
      archived: false,
      categories: dto.categoryIds?.length
        ? await this.categoriesService.resolveByIds(dto.categoryIds)
        : [],
    });

    return this.notesRepository.save(note);
  }

  async update(id: number, dto: UpdateNoteDto): Promise<Note> {
    const note = await this.getById(id);

    if (dto.title !== undefined) {
      note.title = dto.title;
    }
    if (dto.content !== undefined) {
      note.content = dto.content;
    }
    if (dto.categoryIds !== undefined) {
      note.categories = await this.categoriesService.resolveByIds(
        dto.categoryIds,
      );
    }

    return this.notesRepository.save(note);
  }

  async remove(id: number): Promise<void> {
    const note = await this.getById(id);
    await this.notesRepository.remove(note);
  }

  async setArchived(id: number, archived: boolean): Promise<Note> {
    const note = await this.getById(id);
    note.archived = archived;
    return this.notesRepository.save(note);
  }

  async addCategory(noteId: number, categoryId: number): Promise<Note> {
    const note = await this.getById(noteId);
    const category = await this.categoriesService.getById(categoryId);

    const alreadyAttached = note.categories.some(
      (existing) => existing.id === category.id,
    );
    if (alreadyAttached) {
      return note;
    }

    note.categories = [...note.categories, category];
    return this.notesRepository.save(note);
  }

  async removeCategory(noteId: number, categoryId: number): Promise<Note> {
    const note = await this.getById(noteId);
    note.categories = note.categories.filter(
      (category) => category.id !== categoryId,
    );
    return this.notesRepository.save(note);
  }
}
