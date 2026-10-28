export interface ProductModelInfo {
  barcode: string; // barcode or part number
  altCodes?: string[]; // alternate barcodes, UPC, EAN, or serial formats
  modelNumber: string;
  productName: string;
  brand: string;
  category: string;
  ports?: string;
  specs: string;
  power?: string;
  formFactor: string;
  defaultLocation: string;
  defaultRack: string;
  inStockQuantity?: number;
  unit: string;
}

