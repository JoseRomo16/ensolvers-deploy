import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CategoriesService } from '../categories/categories.service';
import { Category } from '../categories/category.entity';
import { Note } from './note.entity';
import { NotesRepository } from './notes.repository';
import { NotesService } from './notes.service';

const category = (id: number, name: string): Category =>
  ({ id, name }) as Category;

const note = (overrides: Partial<Note> = {}): Note =>
  ({
    id: 1,
    title: 'A note',
    content: '',
    archived: false,
    categories: [],
    ...overrides,
  }) as Note;

describe('NotesService', () => {
  let service: NotesService;
  let repository: jest.Mocked<NotesRepository>;
  let categories: jest.Mocked<CategoriesService>;

  beforeEach(async () => {
    const repositoryMock = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn((data) => data as Note),
      save: jest.fn((entity: Note) => Promise.resolve(entity)),
      remove: jest.fn(),
    };
    const categoriesMock = {
      getById: jest.fn(),
      resolveByIds: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: NotesRepository, useValue: repositoryMock },
        { provide: CategoriesService, useValue: categoriesMock },
      ],
    }).compile();

    service = moduleRef.get(NotesService);
    repository = moduleRef.get(NotesRepository);
    categories = moduleRef.get(CategoriesService);
  });

  describe('list', () => {
    it('defaults to the active notes when no filter is given', async () => {
      repository.findAll.mockResolvedValue([]);

      await service.list({});

      expect(repository.findAll).toHaveBeenCalledWith({
        archived: false,
        categoryId: undefined,
      });
    });

    it('forwards the archived and category filters', async () => {
      repository.findAll.mockResolvedValue([]);

      await service.list({ archived: true, categoryId: 7 });

      expect(repository.findAll).toHaveBeenCalledWith({
        archived: true,
        categoryId: 7,
      });
    });
  });

  describe('getById', () => {
    it('throws when the note does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getById(42)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates an active note with no categories by default', async () => {
      await service.create({ title: 'Groceries' });

      expect(categories.resolveByIds).not.toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith({
        title: 'Groceries',
        content: '',
        archived: false,
        categories: [],
      });
    });

    it('resolves the given category ids before saving', async () => {
      categories.resolveByIds.mockResolvedValue([category(3, 'Work')]);

      await service.create({ title: 'Report', categoryIds: [3] });

      expect(categories.resolveByIds).toHaveBeenCalledWith([3]);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ categories: [category(3, 'Work')] }),
      );
    });
  });

  describe('setArchived', () => {
    it('archives and unarchives the note', async () => {
      repository.findById.mockResolvedValue(note({ archived: false }));
      expect((await service.setArchived(1, true)).archived).toBe(true);

      repository.findById.mockResolvedValue(note({ archived: true }));
      expect((await service.setArchived(1, false)).archived).toBe(false);
    });
  });

  describe('categories on a note', () => {
    it('does not attach the same category twice', async () => {
      const existing = category(2, 'Personal');
      repository.findById.mockResolvedValue(note({ categories: [existing] }));
      categories.getById.mockResolvedValue(existing);

      const result = await service.addCategory(1, 2);

      expect(result.categories).toEqual([existing]);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('attaches a new category', async () => {
      const added = category(3, 'Work');
      repository.findById.mockResolvedValue(note({ categories: [] }));
      categories.getById.mockResolvedValue(added);

      const result = await service.addCategory(1, 3);

      expect(result.categories).toEqual([added]);
      expect(repository.save).toHaveBeenCalled();
    });

    it('detaches a category and leaves the others alone', async () => {
      const work = category(3, 'Work');
      const personal = category(2, 'Personal');
      repository.findById.mockResolvedValue(
        note({ categories: [work, personal] }),
      );

      const result = await service.removeCategory(1, 3);

      expect(result.categories).toEqual([personal]);
    });
  });

  describe('update', () => {
    it('only touches the fields that were sent', async () => {
      repository.findById.mockResolvedValue(
        note({ title: 'Original', content: 'Body' }),
      );

      const result = await service.update(1, { title: 'Renamed' });

      expect(result.title).toBe('Renamed');
      expect(result.content).toBe('Body');
    });

    it('replaces the whole category set when categoryIds is sent', async () => {
      repository.findById.mockResolvedValue(
        note({ categories: [category(1, 'Old')] }),
      );
      categories.resolveByIds.mockResolvedValue([category(2, 'New')]);

      const result = await service.update(1, { categoryIds: [2] });

      expect(result.categories).toEqual([category(2, 'New')]);
    });
  });
});
