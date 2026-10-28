export interface CreateStockDto {
  code: string;
  name: string;
  category: string;
  quantity: number;
  unit?: string;
  location_id?: string;
  locationId?: string;
  rack?: string;
  location?: string;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  min_threshold?: number;
  minThreshold?: number;
  expiry_date?: string;
  expiryDate?: string;
  image_url?: string;
  imageUrl?: string;
  description?: string;
}

export interface UpdateStockDto {
  name?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  location_id?: string;
  locationId?: string;
  rack?: string;
  location?: string;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  min_threshold?: number;
  minThreshold?: number;
  expiry_date?: string;
  expiryDate?: string;
  image_url?: string;
  imageUrl?: string;
  description?: string;
}

export interface StockFilterQueryDto {
  category?: string;
  status?: string;
  search?: string;
}

