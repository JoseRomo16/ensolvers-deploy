import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from './categories/categories.module';
import { dataSourceOptions } from './config/typeorm.config';
import { NotesModule } from './notes/notes.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    NotesModule,
    CategoriesModule,
  ],
})
export class AppModule {}
