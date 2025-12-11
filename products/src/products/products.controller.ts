import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { PaginatedProducts, Product } from './products.contracts';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create product' })
  @ApiOkResponse({ type: Object })
  create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.productsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List products with pagination' })
  list(@Query() query: PaginationQueryDto): Promise<PaginatedProducts> {
    return this.productsService.list(query);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product by id' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.productsService.delete(id);
  }
}

