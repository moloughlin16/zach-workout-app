"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { programWorkouts } from "@/lib/workoutData";
import { WorkoutLog } from "@/lib/types";

const ACTIVITY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  climbing: { label: "CLIMB", color: "text-amber-400", bg: "bg-amber-500/20" },
  biking: { label: "BIKE", color: "text-green-400", bg: "bg-green-500/20" },
  run: { label: "RUN", color: "text-blue-400", bg: "bg-blue-500/20" },
  walk: { label: "WALK", color: "text-teal-400", bg: "bg-teal-500/20" },
  "jump-rope": { label: "JUMP ROPE", color: "text-pink-400", bg: "bg-pink-500/20" },
  stretch: { label: "STRETCH", color: "text-purple-400", bg: "bg-purple-500/20" },
};

export default function HistoryPage() {
  const [expandedWorkout, setExpandedWorkout] = useState<number | null>(null);

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

  const toggleExpand = (id: number) => {
    setExpandedWorkout((prev) => (prev === id ? null : id));
  };

  const deleteWorkout = async (id: number) => {
    if (!confirm("Delete this workout? This cannot be undone.")) return;
    await db.workoutLogs.delete(id);
    setExpandedWorkout((prev) => (prev === id ? null : prev));
  };

  const renderWorkoutDetail = (w: WorkoutLog) => {
    const pw = programWorkouts.find((p) => p.id === w.programWorkoutId);
    return (
      <div className="mt-2 space-y-2 border-t border-card-border pt-2">
        {w.exercises.map((ex, i) => {
          const programEx = pw?.exercises[i];
          const hasData = ex.sets.some((s) => s.weight !== null || s.reps !== null);
          if (!hasData) return null;
          return (
            <div key={i} className="text-xs">
              <div className="font-medium mb-0.5">{ex.exerciseName}</div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted">
                {ex.sets.map((s, si) => (
                  <span key={si} className={s.completed ? "text-success" : ""}>
                    {s.weight || "—"} x {s.reps || programEx?.reps || "—"}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        {w.exercises.every((ex) => ex.sets.every((s) => s.weight === null && s.reps === null)) && (
          <p className="text-xs text-muted/50">No data logged for this workout.</p>
        )}
      </div>
    );
  };

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
                  const isExpanded = expandedWorkout === w.id;
                  return (
                    <div
                      key={`w-${i}`}
                      className="bg-card border border-card-border rounded-xl p-3 mb-1"
                    >
                      <button
                        onClick={() => w.id && toggleExpand(w.id)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-accent/20 text-accent px-2 py-0.5 rounded">
                              {pw?.name || `Workout ${w.programWorkoutId}`}
                            </span>
                            <span className="text-xs text-muted">{pw?.focusAreas}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {w.completed ? (
                              <span className="text-success text-xs">&#10003;</span>
                            ) : (
                              <span className="text-xs text-muted">{completedSets}/{totalSets}</span>
                            )}
                            <span className="text-muted text-xs">{isExpanded ? "▲" : "▼"}</span>
                          </div>
                        </div>
                      </button>
                      {isExpanded && (
                        <>
                          {renderWorkoutDetail(w)}
                          <div className="flex gap-2 mt-3 pt-2 border-t border-card-border">
                            <Link
                              href={`/?date=${w.date}`}
                              className="flex-1 text-center text-xs bg-card-border text-foreground rounded-lg px-3 py-1.5 active:opacity-70"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => w.id && deleteWorkout(w.id)}
                              className="flex-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg px-3 py-1.5 active:opacity-70"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                } else {
                  const a = entry.data;
                  const style = ACTIVITY_LABELS[a.type] || ACTIVITY_LABELS.climbing;
                  return (
                    <div key={`a-${i}`} className="bg-card border border-card-border rounded-xl p-3 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${style.bg} ${style.color}`}>
                          {style.label}
                        </span>
                        <span className="text-xs text-muted">{a.duration} min</span>
                        {a.type === "climbing" && a.grades && <span className="text-xs">{a.grades}</span>}
                        {a.type === "biking" && a.trailName && <span className="text-xs">{a.trailName}</span>}
                        {a.type === "run" && a.distance && <span className="text-xs">{a.distance} mi</span>}
                      </div>
                      {a.notes && <p className="text-xs text-muted mt-1">{a.notes}</p>}
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
