import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Pool } from 'pg';
import { AppModule } from '../../src/app.module';
import { PG_POOL } from '../../src/database/database.provider';
import { MetricsService } from '../../src/metrics/metrics.service';
import { NotificationsService } from '../../src/notifications/notifications.service';

describe('Products E2E', () => {
  let app: INestApplication;
  let pool: Pool;
  let metricsService: MetricsService;
  let notificationsService: NotificationsService;
  let publishSpy: jest.SpyInstance;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: true,
      }),
    );

    pool = moduleFixture.get<Pool>(PG_POOL);
    metricsService = moduleFixture.get<MetricsService>(MetricsService);
    notificationsService = moduleFixture.get<NotificationsService>(
      NotificationsService,
    );

    // Spy on SQS publish
    publishSpy = jest.spyOn(notificationsService, 'publish');

    // Clean up database before tests
    await pool.query('TRUNCATE TABLE products RESTART IDENTITY CASCADE');

    await app.init();
  });

  afterAll(async () => {
    await pool.query('TRUNCATE TABLE products RESTART IDENTITY CASCADE');
    await pool.end();
    await app.close();
  });

  beforeEach(async () => {
    // Reset metrics and spies
    publishSpy.mockClear();
    await pool.query('TRUNCATE TABLE products RESTART IDENTITY CASCADE');
  });

  describe('POST /products', () => {
    it('should create a product and emit PRODUCT_CREATED event', async () => {
      const createDto = {
        name: 'Test Product',
        price: 99.99,
      };

      const response = await request(app.getHttpServer())
        .post('/products')
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: 'Test Product',
        price: '99.99',
        created_at: expect.any(String),
      });

      // Verify SQS event was published
      expect(publishSpy).toHaveBeenCalledTimes(1);
      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PRODUCT_CREATED',
          productId: response.body.id,
          payload: {
            name: 'Test Product',
            price: '99.99',
          },
        }),
      );

      // Verify metrics
      const metrics = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(metrics.text).toContain('products_created_total');
    });

    it('should reject invalid product data', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .send({
          name: '', // empty name
          price: -10, // negative price
        })
        .expect(400);

      expect(publishSpy).not.toHaveBeenCalled();
    });
  });

  describe('GET /products', () => {
    beforeEach(async () => {
      // Insert test data
      await pool.query(
        `INSERT INTO products (name, price) VALUES 
         ('Product 1', 10.50),
         ('Product 2', 20.75),
         ('Product 3', 30.00)`,
      );
    });

    it('should return paginated products', async () => {
      const response = await request(app.getHttpServer())
        .get('/products?page=1&limit=2')
        .expect(200);

      expect(response.body).toMatchObject({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            price: expect.any(String),
            created_at: expect.any(String),
          }),
        ]),
        total: 3,
        page: 1,
        limit: 2,
      });

      expect(response.body.items).toHaveLength(2);
    });

    it('should use default pagination when not provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(response.body).toMatchObject({
        total: 3,
        page: 1,
        limit: 10,
      });
    });

    it('should handle empty results', async () => {
      await pool.query('TRUNCATE TABLE products RESTART IDENTITY CASCADE');

      const response = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(response.body).toMatchObject({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('DELETE /products/:id', () => {
    let productId: number;

    beforeEach(async () => {
      const result = await pool.query(
        `INSERT INTO products (name, price) VALUES ('To Delete', 50.00) RETURNING id`,
      );
      productId = result.rows[0].id;
    });

    it('should delete a product and emit PRODUCT_DELETED event', async () => {
      await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .expect(200);

      // Verify product is deleted
      const checkResult = await pool.query(
        'SELECT * FROM products WHERE id = $1',
        [productId],
      );
      expect(checkResult.rows).toHaveLength(0);

      // Verify SQS event was published
      expect(publishSpy).toHaveBeenCalledTimes(1);
      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PRODUCT_DELETED',
          productId: productId,
        }),
      );

      // Verify metrics
      const metrics = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(metrics.text).toContain('products_deleted_total');
    });

    it('should return 404 for non-existent product', async () => {
      await request(app.getHttpServer())
        .delete('/products/99999')
        .expect(404);

      expect(publishSpy).not.toHaveBeenCalled();
    });
  });

  describe('Full flow: Create -> List -> Delete', () => {
    it('should handle complete product lifecycle', async () => {
      // 1. Create product
      const createResponse = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Lifecycle Product', price: 42.00 })
        .expect(201);

      const productId = createResponse.body.id;

      // 2. Verify it appears in list
      const listResponse = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(listResponse.body.items).toContainEqual(
        expect.objectContaining({
          id: productId,
          name: 'Lifecycle Product',
        }),
      );

      // 3. Delete product
      await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .expect(200);

      // 4. Verify it's gone from list
      const listAfterDelete = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(
        listAfterDelete.body.items.find((p: any) => p.id === productId),
      ).toBeUndefined();

      // Verify both events were published
      expect(publishSpy).toHaveBeenCalledTimes(2);
      expect(publishSpy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ type: 'PRODUCT_CREATED' }),
      );
      expect(publishSpy).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ type: 'PRODUCT_DELETED' }),
      );
    });
  });

  describe('GET /metrics', () => {
    beforeEach(async () => {
      // Create and delete products to generate metrics
      const createResult = await pool.query(
        `INSERT INTO products (name, price) VALUES ('Metric Test', 100) RETURNING id`,
      );
      const productId = createResult.rows[0].id;
      await pool.query('DELETE FROM products WHERE id = $1', [productId]);
    });

    it('should expose Prometheus metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('products_created_total');
      expect(response.text).toContain('products_deleted_total');
      expect(response.text).toMatch(/products_created_total \d+/);
    });
  });
});

