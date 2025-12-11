import { NotFoundException } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';
import { MetricsService } from '../src/metrics/metrics.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { ProductsService } from '../src/products/products.service';

const mockPool = (): Pool =>
  ({
    query: jest.fn(),
  } as unknown as Pool);

const mockNotifications = () =>
  ({
    publish: jest.fn().mockResolvedValue(undefined),
  } as unknown as NotificationsService);

describe('ProductsService', () => {
  let service: ProductsService;
  let pool: Pool;
  let notifications: NotificationsService;
  let metrics: MetricsService;

  beforeEach(() => {
    pool = mockPool();
    notifications = mockNotifications();
    metrics = new MetricsService();
    service = new ProductsService(pool, notifications, metrics);
  });

  describe('create', () => {
    it('inserts and returns product, emits event and increments metric', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Desk', price: 10, created_at: 'now' }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      } as QueryResult);

      const product = await service.create({ name: 'Desk', price: 10 });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO products'),
        ['Desk', 10],
      );
      expect(notifications.publish).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'PRODUCT_CREATED', productId: 1 }),
      );
      expect(product.name).toBe('Desk');
      
      // Check metrics using the registry
      const metricsText = await metrics['register'].metrics();
      expect(metricsText).toContain('products_created_total 1');
    });
  });

  describe('delete', () => {
    it('deletes product and emits event', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 1 }],
        command: 'DELETE',
        oid: 0,
        fields: [],
      } as QueryResult);

      await service.delete(1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM products'),
        [1],
      );
      expect(notifications.publish).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'PRODUCT_DELETED', productId: 1 }),
      );
      
      // Check metrics using the registry
      const metricsText = await metrics['register'].metrics();
      expect(metricsText).toContain('products_deleted_total 1');
    });

    it('throws NotFound when nothing removed', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rowCount: 0,
        rows: [],
        command: 'DELETE',
        oid: 0,
        fields: [],
      } as QueryResult);

      await expect(service.delete(999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('list', () => {
    it('returns paginated rows', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { id: 2, name: 'B', price: 2, created_at: 'now', total_count: '2' },
          { id: 1, name: 'A', price: 1, created_at: 'now', total_count: '2' },
        ],
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await service.list({ page: 1, limit: 2 });

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [2, 0]);
      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(2);
    });
  });
});

