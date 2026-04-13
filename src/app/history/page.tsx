"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { programWorkouts } from "@/lib/workoutData";

export default function HistoryPage() {
  const workoutLogs = useLiveQuery(
    () => db.workoutLogs.orderBy("date").reverse().limit(50).toArray(),
    []
  );

  const activityLogs = useLiveQuery(
    () => db.activityLogs.orderBy("date").reverse().limit(50).toArray(),
    []
  );

  // Combine and sort all entries by date
  const allEntries = [
    ...(workoutLogs || []).map((w) => ({
      type: "workout" as const,
      date: w.date,
      data: w,
    })),
    ...(activityLogs || []).map((a) => ({
      type: "activity" as const,
      date: a.date,
      data: a,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  // Group by date
  const grouped = allEntries.reduce<Record<string, typeof allEntries>>((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  // Program stats
  const totalWorkouts = workoutLogs?.length || 0;
  const totalActivities = activityLogs?.length || 0;
  const currentWeek = Math.min(8, Math.ceil(totalWorkouts / 6) || 1);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">History</h1>

      {/* Program progress */}
      <div className="bg-card border border-card-border rounded-xl p-4">
        <h2 className="text-sm font-semibold mb-3">Program Progress</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold text-accent">{totalWorkouts}</div>
            <div className="text-[10px] text-muted uppercase">Workouts</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">{totalActivities}</div>
            <div className="text-[10px] text-muted uppercase">Activities</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-success">{currentWeek}/8</div>
            <div className="text-[10px] text-muted uppercase">Week</div>
          </div>
        </div>
        <div className="mt-3 h-2 bg-card-border rounded-full overflow-hidden">
          <div
            className="h-full bg-success rounded-full transition-all"
            style={{ width: `${(currentWeek / 8) * 100}%` }}
          />
        </div>
      </div>

      {/* Weekly schedule overview */}
      <div className="bg-card border border-card-border rounded-xl p-4">
        <h2 className="text-sm font-semibold mb-3">Weekly Schedule</h2>
        <div className="grid grid-cols-7 gap-1 text-center">
          {["M", "T", "W", "T", "F", "S", "Su"].map((day, i) => {
            const workout = i < 6 ? programWorkouts[i] : null;
            return (
              <div key={i} className="space-y-1">
                <div className="text-[10px] text-muted">{day}</div>
                <div className={`text-[9px] rounded py-1 ${workout ? "bg-accent/10 text-accent" : "bg-card-border text-muted/50"}`}>
                  {workout ? workout.focusAreas.split(",")[0].trim() : "Rest"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted">Activity Log</h2>
        {Object.keys(grouped).length === 0 ? (
          <p className="text-sm text-muted/50 text-center py-8">No history yet. Start a workout!</p>
        ) : (
          Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <div className="text-xs text-muted font-medium mb-1 mt-3">
                {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>
              {entries.map((entry, i) => {
                if (entry.type === "workout") {
                  const w = entry.data;
                  const pw = programWorkouts.find((p) => p.id === w.programWorkoutId);
                  const completedSets = w.exercises.reduce((s, ex) => s + ex.sets.filter((set) => set.completed).length, 0);
                  const totalSets = w.exercises.reduce((s, ex) => s + ex.sets.length, 0);
                  return (
                    <div key={`w-${i}`} className="bg-card border border-card-border rounded-xl p-3 mb-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold bg-accent/20 text-accent px-2 py-0.5 rounded">
                            {pw?.name || `Workout ${w.programWorkoutId}`}
                          </span>
                          <span className="text-xs text-muted">{pw?.focusAreas}</span>
                        </div>
                        {w.completed ? (
                          <span className="text-success text-xs">&#10003;</span>
                        ) : (
                          <span className="text-xs text-muted">{completedSets}/{totalSets}</span>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  const a = entry.data;
                  return (
                    <div key={`a-${i}`} className="bg-card border border-card-border rounded-xl p-3 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          a.type === "climbing" ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400"
                        }`}>
                          {a.type === "climbing" ? "CLIMB" : "BIKE"}
                        </span>
                        <span className="text-xs text-muted">{a.duration} min</span>
                        {a.type === "climbing" && a.grades && <span className="text-xs">{a.grades}</span>}
                        {a.type === "biking" && a.trailName && <span className="text-xs">{a.trailName}</span>}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
