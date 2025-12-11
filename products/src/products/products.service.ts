import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { MetricsService } from '../metrics/metrics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { PG_POOL } from '../database/database.provider';
import { PaginatedProducts, Product } from './products.contracts';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly notifications: NotificationsService,
    private readonly metrics: MetricsService,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const result = await this.pool.query<Product>(
      `INSERT INTO products (name, price) VALUES ($1, $2) RETURNING id, name, price, created_at`,
      [dto.name, dto.price],
    );
    const product = result.rows[0];
    this.metrics.productsCreated.inc();
    await this.notifications.publish({
      type: 'PRODUCT_CREATED',
      productId: product.id,
      payload: { name: product.name, price: product.price },
      occurredAt: new Date().toISOString(),
    });
    return product;
  }

  async delete(id: number): Promise<void> {
    const result = await this.pool.query(
      `DELETE FROM products WHERE id = $1 RETURNING id`,
      [id],
    );
    if (result.rowCount === 0) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    this.metrics.productsDeleted.inc();
    await this.notifications.publish({
      type: 'PRODUCT_DELETED',
      productId: id,
      occurredAt: new Date().toISOString(),
    });
  }

  async list(query: PaginationQueryDto): Promise<PaginatedProducts> {
    const limit = query.limit ?? 10;
    const page = query.page ?? 1;
    const offset = (page - 1) * limit;

    type QueryRow = Product & { total_count: string };

    const result = await this.pool.query<QueryRow>(
      `
      SELECT id, name, price, created_at, COUNT(*) OVER() AS total_count
      FROM products
      ORDER BY id DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset],
    );

    const total = result.rows.length ? Number(result.rows[0].total_count) : 0;
    const items = result.rows.map(({ total_count, ...rest }: QueryRow) => rest);

    return { items, total, page, limit };
  }
}

