import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Category } from './category.entity';

/**
 * The only place in the categories module allowed to touch TypeORM.
 * Services depend on this class, never on `Repository<Category>`.
 */
@Injectable()
export class CategoriesRepository {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  findAll(): Promise<Category[]> {
    return this.categories.find({ order: { name: 'ASC' } });
  }

  findById(id: number): Promise<Category | null> {
    return this.categories.findOne({ where: { id } });
  }

  findByName(name: string): Promise<Category | null> {
    return this.categories.findOne({ where: { name } });
  }

  findByIds(ids: number[]): Promise<Category[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.categories.find({ where: { id: In(ids) } });
  }

  create(name: string): Promise<Category> {
    return this.categories.save(this.categories.create({ name }));
  }

  async remove(category: Category): Promise<void> {
    await this.categories.remove(category);
  }
}
