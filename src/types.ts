export type Trip = {
  id: string;
  title: string;
  date: string;
};

export type ChecklistItem = {
  id: string;
  tripId: string;
  text: string;
  completed: boolean;
  urgent: boolean;
};

export type Schedule = {
  id: string;
  tripId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  completed?: boolean;
};

export type ScheduleLinkedItem = {
  scheduleId: string;
  checklistItemId: string;
};

export type FrequentGroup = {
  id: string;
  name: string;
  items: string[]; // List of strings for simple templating
};

// Application Screens
export type AppScreen = 'dashboard' | 'settings' | 'templates' | 'trip-detail';
