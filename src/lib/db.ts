import Dexie, { type EntityTable } from "dexie";
import { WorkoutLog, ActivityLog, WeightEntry, ProgressPhoto } from "./types";

const db = new Dexie("ZachWorkoutApp") as Dexie & {
  workoutLogs: EntityTable<WorkoutLog, "id">;
  activityLogs: EntityTable<ActivityLog, "id">;
  weightEntries: EntityTable<WeightEntry, "id">;
  progressPhotos: EntityTable<ProgressPhoto, "id">;
};

db.version(1).stores({
  workoutLogs: "++id, programWorkoutId, date",
  activityLogs: "++id, type, date",
  weightEntries: "++id, date",
  progressPhotos: "++id, date",
});

export { db };
