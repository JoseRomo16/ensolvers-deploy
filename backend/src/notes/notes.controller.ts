import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AddCategoryDto } from './dto/add-category.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { QueryNotesDto } from './dto/query-notes.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './note.entity';
import { NotesService } from './notes.service';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  list(@Query() query: QueryNotesDto): Promise<Note[]> {
    return this.notesService.list(query);
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number): Promise<Note> {
    return this.notesService.getById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateNoteDto): Promise<Note> {
    return this.notesService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNoteDto,
  ): Promise<Note> {
    return this.notesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.notesService.remove(id);
  }

  // Archiving is a named user action, so it gets its own endpoints
  // instead of hiding behind a generic PATCH on `archived`.
  @Patch(':id/archive')
  archive(@Param('id', ParseIntPipe) id: number): Promise<Note> {
    return this.notesService.setArchived(id, true);
  }

  @Patch(':id/unarchive')
  unarchive(@Param('id', ParseIntPipe) id: number): Promise<Note> {
    return this.notesService.setArchived(id, false);
  }

  @Post(':id/categories')
  @HttpCode(HttpStatus.OK)
  addCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddCategoryDto,
  ): Promise<Note> {
    return this.notesService.addCategory(id, dto.categoryId);
  }

  @Delete(':id/categories/:categoryId')
  removeCategory(
    @Param('id', ParseIntPipe) id: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ): Promise<Note> {
    return this.notesService.removeCategory(id, categoryId);
  }
}
