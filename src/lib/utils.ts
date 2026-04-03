import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ItemUnit, UnitConversion } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

export function convertUnit(value: number, from: ItemUnit, to: ItemUnit, conversions: UnitConversion[]) {
  if (from === to) return value;
  const conversion = conversions.find(c => c.from === from && c.to === to);
  if (conversion) return value * conversion.factor;
  
  const inverse = conversions.find(c => c.from === to && c.to === from);
  if (inverse) return value / inverse.factor;
  
  return value;
}

export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function safeLocalStorageSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to persist "${key}" to localStorage:`, e);
  }
}
