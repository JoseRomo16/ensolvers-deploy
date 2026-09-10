import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from './categories/categories.module';
import { dataSourceOptions } from './config/typeorm.config';
import { HealthModule } from './health/health.module';
import { NotesModule } from './notes/notes.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    NotesModule,
    CategoriesModule,
    HealthModule,
  ],
})
export class AppModule {}
