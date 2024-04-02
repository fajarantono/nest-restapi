import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { IsExist } from '@/utils/validators/is-exists.validator';
import { IsNotExist } from '@/utils/validators/is-not-exists.validator';
import { FilesModule } from '@/files/files.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category]), FilesModule],
  controllers: [CategoryController],
  providers: [IsExist, IsNotExist, CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
