import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from './entities/category.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NullableType } from '@/utils/types/nullable.type';
import { UpdateCategoryDto } from './dto/update-category.dto';

@UseGuards(AuthGuard('jwt')) // Make AuthGuard in here
@Controller({
  path: 'categories',
  version: '1',
})
@ApiTags('Categories')
@ApiBearerAuth()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ): Promise<{
    data: Category[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.categoryService.findAll({ page, limit }, search);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: Category['id']): Promise<NullableType<Category>> {
    return this.categoryService.findOne({ id });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: Category['id'], @Body() updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    return this.categoryService.update(id, updateCategoryDto);
  }

  //SoftDelete
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: Category['id']): Promise<void> {
    return this.categoryService.softDelete(id);
  }
}
