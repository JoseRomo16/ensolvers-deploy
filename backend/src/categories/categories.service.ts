import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  list(): Promise<Category[]> {
    return this.categoriesRepository.findAll();
  }

  async getById(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoriesRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException(`Category "${dto.name}" already exists`);
    }
    return this.categoriesRepository.create(dto.name);
  }

  async remove(id: number): Promise<void> {
    const category = await this.getById(id);
    await this.categoriesRepository.remove(category);
  }

  /**
   * Resolves ids to entities, failing loudly when any of them is unknown.
   * Used by the notes module when a note is created with categories attached.
   */
  async resolveByIds(ids: number[]): Promise<Category[]> {
    const unique = [...new Set(ids)];
    const found = await this.categoriesRepository.findByIds(unique);

    if (found.length !== unique.length) {
      const foundIds = new Set(found.map((category) => category.id));
      const missing = unique.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Category not found: ${missing.join(', ')}`,
      );
    }

    return found;
  }
}
