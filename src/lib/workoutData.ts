import { ProgramWorkout } from "./types";

export const PROGRAM_NAME = "Hollywood Muscle: Stallone Inspired";
export const PROGRAM_DURATION_WEEKS = 8;
export const REST_PERIOD_SECONDS = 75; // 60-90s, default to 75

export const programWorkouts: ProgramWorkout[] = [
  {
    id: 1,
    name: "Workout 1",
    dayLabel: "Monday",
    focusAreas: "Chest, Triceps, Biceps",
    exercises: [
      { name: "Incline Dumbbell Press", sets: "5", reps: "10" },
      { name: "Incline Dumbbell Fly", sets: "4", reps: "10" },
      { name: "Dumbbell Press", sets: "3", reps: "10" },
      { name: "Incline EZ Bar Skullcrusher", sets: "3", reps: "10", supersetGroup: "A", supersetOrder: 1 },
      { name: "EZ Bar Curl", sets: "3", reps: "10", supersetGroup: "A", supersetOrder: 2 },
      { name: "Seated Overhead Dumbbell Extension", sets: "3", reps: "10", supersetGroup: "B", supersetOrder: 1 },
      { name: "Seated Dumbbell Curl", sets: "3", reps: "10", supersetGroup: "B", supersetOrder: 2 },
      { name: "Tricep Cable Extension", sets: "3", reps: "10", supersetGroup: "C", supersetOrder: 1 },
      { name: "Rope Hammer Curl", sets: "3", reps: "10", supersetGroup: "C", supersetOrder: 2 },
      { name: "Forearm Wrist Curls", sets: "3", reps: "10" },
    ],
  },
  {
    id: 2,
    name: "Workout 2",
    dayLabel: "Tuesday",
    focusAreas: "Back, Shoulders",
    exercises: [
      { name: "T-Bar Row", sets: "5", reps: "10" },
      { name: "Pull Up", sets: "4", reps: "10" },
      { name: "Bent Over Dumbbell Row", sets: "3", reps: "10" },
      { name: "Dumbbell Arnold Press", sets: "5", reps: "10" },
      { name: "Side Lateral Raises", sets: "4", reps: "10" },
      { name: "Bent Over Rear Delt Fly", sets: "3", reps: "10" },
      { name: "Front Raise", sets: "2", reps: "10" },
    ],
  },
  {
    id: 3,
    name: "Workout 3",
    dayLabel: "Wednesday",
    focusAreas: "Legs, Abs",
    exercises: [
      { name: "Heels Elevated Dumbbell Squat", sets: "5", reps: "10" },
      { name: "Split Squat", sets: "4", reps: "10" },
      { name: "Leg Curl", sets: "3", reps: "10" },
      { name: "Calf Raise", sets: "3", reps: "15" },
      { name: "Ab Wheel Rollout", sets: "5", reps: "10" },
      { name: "Sit Up", sets: "3-5", reps: "25", supersetGroup: "A", supersetOrder: 1 },
      { name: "Lying Leg Raise", sets: "3-5", reps: "25", supersetGroup: "A", supersetOrder: 2 },
      { name: "Oblique Crunch", sets: "3-5", reps: "25", supersetGroup: "A", supersetOrder: 3 },
    ],
  },
  {
    id: 4,
    name: "Workout 4",
    dayLabel: "Thursday",
    focusAreas: "Chest, Triceps, Biceps",
    exercises: [
      { name: "Slight Incline Neutral Grip Dumbbell Press", sets: "5", reps: "10" },
      { name: "Cable Flys", sets: "4", reps: "10" },
      { name: "Push Ups", sets: "3", reps: "10" },
      { name: "Skullcrusher", sets: "3", reps: "10", supersetGroup: "A", supersetOrder: 1 },
      { name: "Incline Dumbbell Curl", sets: "3", reps: "10", supersetGroup: "A", supersetOrder: 2 },
      { name: "French Press", sets: "3", reps: "10", supersetGroup: "B", supersetOrder: 1 },
      { name: "Barbell Curl", sets: "3", reps: "10", supersetGroup: "B", supersetOrder: 2 },
      { name: "Tricep Kickback", sets: "3", reps: "10", supersetGroup: "C", supersetOrder: 1 },
      { name: "Dumbbell Curl", sets: "3", reps: "10", supersetGroup: "C", supersetOrder: 2 },
      { name: "Forearm Wrist Curl", sets: "3", reps: "10" },
    ],
  },
  {
    id: 5,
    name: "Workout 5",
    dayLabel: "Friday",
    focusAreas: "Back, Shoulders",
    exercises: [
      { name: "Barbell Row", sets: "5", reps: "10" },
      { name: "Wide Grip Pull Up", sets: "4", reps: "10" },
      { name: "Cable Row", sets: "3", reps: "10" },
      { name: "Dumbbell Side Laterals", sets: "5", reps: "10" },
      { name: "Bent Over Rear Delt Row", sets: "4", reps: "10" },
      { name: "Dumbbell Front Raise", sets: "3", reps: "10" },
      { name: "Dumbbell Shrug", sets: "2", reps: "25" },
    ],
  },
  {
    id: 6,
    name: "Workout 6",
    dayLabel: "Saturday",
    focusAreas: "Legs, Abs",
    exercises: [
      { name: "Goblet Squat", sets: "5", reps: "10" },
      { name: "Dumbbell Lunge", sets: "4", reps: "10" },
      { name: "Leg Curl", sets: "3", reps: "10" },
      { name: "Calf Raise", sets: "3", reps: "15" },
      { name: "Ab Wheel", sets: "5", reps: "10" },
      { name: "Sit Up", sets: "3-5", reps: "25", supersetGroup: "A", supersetOrder: 1 },
      { name: "Hanging Leg Raise", sets: "3-5", reps: "25", supersetGroup: "A", supersetOrder: 2 },
      { name: "Side Bends", sets: "3-5", reps: "25 Each", supersetGroup: "A", supersetOrder: 3 },
    ],
  },
];

// Map day of week (0=Sun, 1=Mon, ..., 6=Sat) to workout
export function getTodaysWorkout(): ProgramWorkout | null {
  const dayOfWeek = new Date().getDay();
  // Sunday = rest day
  if (dayOfWeek === 0) return null;
  // Mon=1 -> workout index 0, Tue=2 -> index 1, etc.
  return programWorkouts[dayOfWeek - 1] || null;
}

export function getWorkoutByDay(dayOfWeek: number): ProgramWorkout | null {
  if (dayOfWeek === 0) return null;
  return programWorkouts[dayOfWeek - 1] || null;
}
