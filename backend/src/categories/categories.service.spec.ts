import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';
import { Category } from './category.entity';

const category = (id: number, name: string): Category =>
  ({ id, name }) as Category;

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: jest.Mocked<CategoriesRepository>;

  beforeEach(async () => {
    const repositoryMock = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findByIds: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: CategoriesRepository, useValue: repositoryMock },
      ],
    }).compile();

    service = moduleRef.get(CategoriesService);
    repository = moduleRef.get(CategoriesRepository);
  });

  describe('create', () => {
    it('rejects a name that already exists', async () => {
      repository.findByName.mockResolvedValue(category(1, 'Work'));

      await expect(service.create({ name: 'Work' })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('creates the category when the name is free', async () => {
      repository.findByName.mockResolvedValue(null);
      repository.create.mockResolvedValue(category(1, 'Work'));

      await expect(service.create({ name: 'Work' })).resolves.toEqual(
        category(1, 'Work'),
      );
    });
  });

  describe('getById', () => {
    it('throws when the category does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getById(9)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('resolveByIds', () => {
    it('reports the ids that could not be found', async () => {
      repository.findByIds.mockResolvedValue([category(1, 'Work')]);

      await expect(service.resolveByIds([1, 2])).rejects.toThrow(/2/);
    });

    it('deduplicates the requested ids', async () => {
      repository.findByIds.mockResolvedValue([category(1, 'Work')]);

      await service.resolveByIds([1, 1, 1]);

      expect(repository.findByIds).toHaveBeenCalledWith([1]);
    });
  });
});
