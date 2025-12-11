export type ProductEventType = 'PRODUCT_CREATED' | 'PRODUCT_DELETED';

export interface ProductEventPayload {
  type: ProductEventType;
  productId: number;
  payload?: Record<string, unknown>;
  occurredAt: string;
}

