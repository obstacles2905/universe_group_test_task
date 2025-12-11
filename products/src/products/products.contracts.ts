export interface Product {
  id: number;
  name: string;
  price: number;
  created_at: string;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

