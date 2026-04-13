// Workout program types
export interface ProgramExercise {
  name: string;
  sets: string; // e.g. "3", "3 - 5"
  reps: string; // e.g. "10", "25 Each"
  supersetGroup?: string; // e.g. "A", "B", "C"
  supersetOrder?: number; // 1 or 2 within the group
}

export interface ProgramWorkout {
  id: number;
  name: string;
  dayLabel: string; // "Monday", "Tuesday", etc.
  focusAreas: string;
  exercises: ProgramExercise[];
}

// Logged workout types
export interface LoggedSet {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
}

export interface LoggedExercise {
  exerciseName: string;
  sets: LoggedSet[];
  notes?: string;
}

export interface WorkoutLog {
  id?: number;
  programWorkoutId: number;
  date: string; // ISO date string
  exercises: LoggedExercise[];
  startTime?: string;
  endTime?: string;
  notes?: string;
  completed: boolean;
}

// Activity types (climbing, biking)
export type ActivityType = 'climbing' | 'biking';
export type ClimbingType = 'boulder' | 'sport' | 'trad' | 'top-rope';
export type ClimbingLocation = 'indoor' | 'outdoor';

export interface ActivityLog {
  id?: number;
  type: ActivityType;
  date: string;
  duration: number; // minutes
  notes?: string;
  // Climbing-specific
  climbingType?: ClimbingType;
  climbingLocation?: ClimbingLocation;
  grades?: string; // free text, e.g. "V4, V5, V3"
  // Biking-specific
  trailName?: string;
  distance?: number; // miles
  elevationGain?: number; // feet
}

// Progress tracking
export interface WeightEntry {
  id?: number;
  date: string;
  weight: number; // lbs
  notes?: string;
}

export interface ProgressPhoto {
  id?: number;
  date: string;
  imageData: string; // base64 data URL
  label?: string; // "front", "side", "back"
  notes?: string;
}
