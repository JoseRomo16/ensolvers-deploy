import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AddCategoryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId: number;
}
