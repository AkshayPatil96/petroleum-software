export type FuelType = 'Petrol' | 'Diesel' | 'CNG' | 'Power' | string;
export type ItemUnit = 'Liter' | 'Kg' | 'Pcs';

export interface CustomItem {
  id: string;
  name: string;
  price: number;
  unit: ItemUnit;
  category: 'Fuel' | 'Lubricant' | 'Other';
}

export interface FuelPrice {
  type: FuelType;
  pricePerLiter: number;
  lastUpdated: string;
}

export interface Bill {
  id: string;
  date: string;
  fuelType: FuelType; // This will now store the item name
  pricePerLiter: number; // Price per unit
  quantity: number;
  unit: ItemUnit;
  totalAmount: number;
  vehicleNumber: string;
  pumpNumber?: string;
  nozzleNumber?: string;
  customerName?: string;
  paymentMode: 'Cash' | 'Card' | 'UPI';
  status: 'Draft' | 'Paid';
  customNote?: string;
}

export interface Inventory {
  type: FuelType;
  currentStock: number;
  capacity: number;
  unit: ItemUnit;
}

export interface UnitConversion {
  from: ItemUnit;
  to: ItemUnit;
  factor: number;
}

export type UserRole = 'Admin' | 'Operator';

export interface PumpSettings {
  name: string;
  address: string;
  gstin: string;
  contact: string;
  pin?: string; // Keep for migration
  adminPin: string;
  operatorPin: string;
  printerSize: '58mm' | '80mm';
  logoUrl?: string;
  pairedPrinterName?: string;
  licenseNo?: string;
  defaultFooterNote?: string;
  receiptTemplate: 'Standard' | 'Compact' | 'Modern';
  customItems: CustomItem[];
  unitConversions: UnitConversion[];
  visibleFields: {
    customerName: boolean;
    vehicleNumber: boolean;
    pumpNumber: boolean;
    nozzleNumber: boolean;
    gstin: boolean;
    licenseNo: boolean;
    paymentMode: boolean;
    footerNote: boolean;
  };
}
