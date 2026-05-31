import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId() {
  return crypto.randomUUID();
}

/**
 * Validates if a date (YYYY-MM-DD) is today
 */
export function isToday(dateString: string) {
  const d = new Date(dateString);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Checks if a trip is archived (older than 5 days based on latest schedule or trip date)
 */
import type { Trip, Schedule } from '../types';

export function isTripArchived(trip: Trip, schedules: Schedule[]): boolean {
  const tripSchedules = schedules.filter((s) => s.tripId === trip.id);
  const dates = tripSchedules
    .map((s) => s.date)
    .concat(trip.date ? [trip.date] : [])
    .filter(Boolean);

  if (dates.length === 0) return false;

  // Sort descending
  dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const latestDate = dates[0];
  
  if (!latestDate) return false;

  const diffMs = new Date().getTime() - new Date(latestDate).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  return diffDays > 5;
}

/**
 * Format string YYYY-MM-DD to readable format like '12 Okt 2023'
 */
export function formatDate(dateString: string) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(d);
}
