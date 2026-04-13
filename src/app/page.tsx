"use client";

import { useState, useEffect, useCallback } from "react";
import { programWorkouts, getTodaysWorkout, PROGRAM_NAME } from "@/lib/workoutData";
import { db } from "@/lib/db";
import { WorkoutLog, LoggedExercise, LoggedSet, ProgramWorkout } from "@/lib/types";
import RestTimer from "@/components/RestTimer";

function createEmptyLog(workout: ProgramWorkout): LoggedExercise[] {
  return workout.exercises.map((ex) => {
    const numSets = parseInt(ex.sets) || 3;
    const sets: LoggedSet[] = Array.from({ length: numSets }, (_, i) => ({
      setNumber: i + 1,
      weight: null,
      reps: null,
      completed: false,
    }));
    return { exerciseName: ex.name, sets };
  });
}

export default function WorkoutPage() {
  const [selectedWorkout, setSelectedWorkout] = useState<ProgramWorkout | null>(null);
  const [exercises, setExercises] = useState<LoggedExercise[]>([]);
  const [activeWorkoutId, setActiveWorkoutId] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  // Load today's workout or existing log
  useEffect(() => {
    const todayWorkout = getTodaysWorkout();
    if (todayWorkout) {
      setSelectedWorkout(todayWorkout);
      // Check for existing log
      db.workoutLogs
        .where("date")
        .equals(today)
        .and((log) => log.programWorkoutId === todayWorkout.id)
        .first()
        .then((existing) => {
          if (existing) {
            setExercises(existing.exercises);
            setActiveWorkoutId(existing.id!);
          } else {
            setExercises(createEmptyLog(todayWorkout));
          }
        });
    }
  }, [today]);

  const selectWorkout = (workout: ProgramWorkout) => {
    setSelectedWorkout(workout);
    setExercises(createEmptyLog(workout));
    setActiveWorkoutId(null);
    setShowPicker(false);
  };

  const updateSet = useCallback(
    (exIndex: number, setIndex: number, field: "weight" | "reps", value: string) => {
      setExercises((prev) => {
        const next = [...prev];
        const ex = { ...next[exIndex] };
        const sets = [...ex.sets];
        sets[setIndex] = { ...sets[setIndex], [field]: value === "" ? null : Number(value) };
        ex.sets = sets;
        next[exIndex] = ex;
        return next;
      });
    },
    []
  );

  const toggleSet = useCallback((exIndex: number, setIndex: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const ex = { ...next[exIndex] };
      const sets = [...ex.sets];
      sets[setIndex] = { ...sets[setIndex], completed: !sets[setIndex].completed };
      ex.sets = sets;
      next[exIndex] = ex;
      return next;
    });
  }, []);

  const saveWorkout = useCallback(async () => {
    if (!selectedWorkout) return;
    const log: WorkoutLog = {
      programWorkoutId: selectedWorkout.id,
      date: today,
      exercises,
      completed: exercises.every((ex) => ex.sets.every((s) => s.completed)),
    };
    if (activeWorkoutId) {
      await db.workoutLogs.put({ ...log, id: activeWorkoutId });
    } else {
      const id = await db.workoutLogs.add(log);
      setActiveWorkoutId(id as number);
    }
  }, [selectedWorkout, today, exercises, activeWorkoutId]);

  // Auto-save on changes
  useEffect(() => {
    if (selectedWorkout && exercises.length > 0) {
      const timer = setTimeout(saveWorkout, 500);
      return () => clearTimeout(timer);
    }
  }, [exercises, selectedWorkout, saveWorkout]);

  const completedSets = exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.completed).length, 0);
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  const dayOfWeek = new Date().getDay();
  const isRestDay = dayOfWeek === 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {isRestDay && !selectedWorkout ? "Rest Day" : selectedWorkout?.name || "Select Workout"}
          </h1>
          <p className="text-sm text-muted">
            {isRestDay && !selectedWorkout
              ? "Recovery & Regeneration"
              : selectedWorkout
              ? `${selectedWorkout.dayLabel} \u2014 ${selectedWorkout.focusAreas}`
              : PROGRAM_NAME}
          </p>
        </div>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="text-xs bg-card border border-card-border rounded-lg px-3 py-1.5 text-muted"
        >
          Switch
        </button>
      </div>

      {/* Workout picker */}
      {showPicker && (
        <div className="bg-card border border-card-border rounded-xl p-3 space-y-1">
          {programWorkouts.map((w) => (
            <button
              key={w.id}
              onClick={() => selectWorkout(w)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedWorkout?.id === w.id ? "bg-accent/20 text-accent" : "active:bg-card-border"
              }`}
            >
              <span className="font-medium">{w.name}</span>
              <span className="text-muted ml-2">{w.focusAreas}</span>
            </button>
          ))}
        </div>
      )}

      {isRestDay && !selectedWorkout && (
        <div className="bg-card border border-card-border rounded-xl p-6 text-center space-y-2">
          <div className="text-4xl">&#128564;</div>
          <p className="text-muted text-sm">Sunday is for recovery. Log an activity or pick a workout if you want to train anyway.</p>
        </div>
      )}

      {selectedWorkout && (
        <>
          {/* Progress bar */}
          <div className="bg-card border border-card-border rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted">Progress</span>
              <span className="text-xs font-mono text-muted">{completedSets}/{totalSets} sets</span>
            </div>
            <div className="h-2 bg-card-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: totalSets > 0 ? `${(completedSets / totalSets) * 100}%` : "0%" }}
              />
            </div>
          </div>

          {/* Rest Timer */}
          <RestTimer />

          {/* Exercises */}
          <div className="space-y-3">
            {selectedWorkout.exercises.map((programEx, exIndex) => {
              const loggedEx = exercises[exIndex];
              if (!loggedEx) return null;

              const isSupersetStart = programEx.supersetGroup && programEx.supersetOrder === 1;
              const isInSuperset = !!programEx.supersetGroup;

              return (
                <div key={exIndex}>
                  {isSupersetStart && (
                    <div className="flex items-center gap-2 mb-1 mt-2">
                      <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                        SUPERSET {programEx.supersetGroup}
                      </span>
                      <div className="flex-1 h-px bg-card-border" />
                    </div>
                  )}
                  <div className={`bg-card border border-card-border rounded-xl p-3 ${isInSuperset ? "ml-2 border-l-2 border-l-accent/30" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold">{programEx.name}</h3>
                      <span className="text-[10px] text-muted">
                        {programEx.sets} x {programEx.reps}
                      </span>
                    </div>
                    {/* Sets */}
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 text-[10px] text-muted font-medium uppercase tracking-wider px-1">
                        <span>Set</span>
                        <span>Lbs</span>
                        <span>Reps</span>
                        <span></span>
                      </div>
                      {loggedEx.sets.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          className={`grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 items-center rounded-lg px-1 py-1 ${
                            set.completed ? "bg-success/10" : ""
                          }`}
                        >
                          <span className="text-xs text-muted text-center">{set.setNumber}</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            placeholder="—"
                            value={set.weight ?? ""}
                            onChange={(e) => updateSet(exIndex, setIndex, "weight", e.target.value)}
                            className="bg-card-border rounded-lg px-2 py-1.5 text-sm text-center w-full focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                          <input
                            type="number"
                            inputMode="numeric"
                            placeholder={programEx.reps}
                            value={set.reps ?? ""}
                            onChange={(e) => updateSet(exIndex, setIndex, "reps", e.target.value)}
                            className="bg-card-border rounded-lg px-2 py-1.5 text-sm text-center w-full focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                          <button
                            onClick={() => toggleSet(exIndex, setIndex)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${
                              set.completed
                                ? "bg-success text-white"
                                : "bg-card-border text-muted"
                            }`}
                          >
                            {set.completed ? "\u2713" : ""}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Complete workout button */}
          {completedSets === totalSets && totalSets > 0 && (
            <div className="bg-success/20 border border-success/30 rounded-xl p-4 text-center">
              <p className="text-success font-bold">Workout Complete!</p>
              <p className="text-success/70 text-xs mt-1">All sets logged and saved automatically.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
