import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './note.entity';

export interface FindNotesFilter {
  archived: boolean;
  categoryId?: number;
}

/**
 * The only place in the notes module allowed to touch TypeORM.
 * Services depend on this class, never on `Repository<Note>`.
 */
@Injectable()
export class NotesRepository {
  constructor(
    @InjectRepository(Note)
    private readonly notes: Repository<Note>,
  ) {}

  findAll({ archived, categoryId }: FindNotesFilter): Promise<Note[]> {
    const query = this.notes
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.categories', 'category')
      .where('note.archived = :archived', { archived })
      .orderBy('note.updatedAt', 'DESC');

    if (categoryId !== undefined) {
      // Filtering on the joined alias would also truncate the categories
      // actually returned for each note, so the filter goes through a
      // subquery and the join stays purely for loading the relation.
      query.andWhere(
        `note.id IN (
          SELECT nc.note_id FROM note_categories nc WHERE nc.category_id = :categoryId
        )`,
        { categoryId },
      );
    }

    return query.getMany();
  }

  findById(id: number): Promise<Note | null> {
    return this.notes.findOne({
      where: { id },
      relations: { categories: true },
    });
  }

  save(note: Note): Promise<Note> {
    return this.notes.save(note);
  }

  create(data: Partial<Note>): Note {
    return this.notes.create(data);
  }

  async remove(note: Note): Promise<void> {
    await this.notes.remove(note);
  }
}
