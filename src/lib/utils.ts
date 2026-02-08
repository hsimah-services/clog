import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function calcExpiryDate(defaultExpiry: { unit: 'days' | 'months'; value: number }, from: Date = new Date()): Date {
  const result = new Date(from);
  if (defaultExpiry.unit === 'days') {
    result.setDate(result.getDate() + defaultExpiry.value);
  } else {
    result.setMonth(result.getMonth() + defaultExpiry.value);
  }
  return result;
}
