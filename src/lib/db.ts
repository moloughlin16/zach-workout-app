import Dexie, { type EntityTable } from "dexie";
import { WorkoutLog, ActivityLog, WeightEntry, ProgressPhoto } from "./types";

// Only create database on the client (not during SSR)
let db: Dexie & {
  workoutLogs: EntityTable<WorkoutLog, "id">;
  activityLogs: EntityTable<ActivityLog, "id">;
  weightEntries: EntityTable<WeightEntry, "id">;
  progressPhotos: EntityTable<ProgressPhoto, "id">;
};

if (typeof window !== "undefined") {
  db = new Dexie("ZachWorkoutApp") as typeof db;
  db.version(1).stores({
    workoutLogs: "++id, programWorkoutId, date",
    activityLogs: "++id, type, date",
    weightEntries: "++id, date",
    progressPhotos: "++id, date",
  });
} else {
  // SSR placeholder — never actually used since all pages are "use client"
  db = null as unknown as typeof db;
}

export { db };
