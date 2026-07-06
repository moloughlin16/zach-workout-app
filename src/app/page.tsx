"use client";

import { useState, useEffect, useCallback } from "react";
import { programWorkouts, getTodaysWorkout, PROGRAM_NAME, EXERCISE_LIBRARY } from "@/lib/workoutData";
import { db } from "@/lib/db";
import { WorkoutLog, LoggedExercise, LoggedSet, ProgramWorkout } from "@/lib/types";
import RestTimer from "@/components/RestTimer";

const FEELING_OPTIONS: { value: number; emoji: string; label: string }[] = [
  { value: 1, emoji: "\u{1F62B}", label: "Awful" },
  { value: 2, emoji: "\u{1F641}", label: "Rough" },
  { value: 3, emoji: "\u{1F610}", label: "Okay" },
  { value: 4, emoji: "\u{1F642}", label: "Good" },
  { value: 5, emoji: "\u{1F4AA}", label: "Great" },
];

function makeEmptySets(numSets: number): LoggedSet[] {
  return Array.from({ length: numSets }, (_, i) => ({
    setNumber: i + 1,
    weight: null,
    reps: null,
    completed: false,
  }));
}

function createEmptyLog(workout: ProgramWorkout): LoggedExercise[] {
  return workout.exercises.map((ex) => {
    const numSets = parseInt(ex.sets) || 3;
    return {
      exerciseName: ex.name,
      targetSets: ex.sets,
      targetReps: ex.reps,
      supersetGroup: ex.supersetGroup,
      supersetOrder: ex.supersetOrder,
      sets: makeEmptySets(numSets),
    };
  });
}

export default function WorkoutPage() {
  const [selectedWorkout, setSelectedWorkout] = useState<ProgramWorkout | null>(null);
  const [exercises, setExercises] = useState<LoggedExercise[]>([]);
  const [activeWorkoutId, setActiveWorkoutId] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [feeling, setFeeling] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [exercisePicker, setExercisePicker] = useState<{ mode: "add" } | { mode: "swap"; index: number } | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const isPastDate = selectedDate !== today;
  const isStarted = activeWorkoutId !== null;

  // Allow deep-linking to a specific date (e.g. from History "Edit")
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get("date");
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      setSelectedDate(dateParam);
    }
  }, []);

  // Load workout for selected date
  useEffect(() => {
    const loadWorkout = async () => {
      // Check for existing log on this date
      const existingLogs = await db.workoutLogs
        .where("date")
        .equals(selectedDate)
        .toArray();

      if (existingLogs.length > 0) {
        const existing = existingLogs[0];
        const pw = programWorkouts.find((p) => p.id === existing.programWorkoutId);
        if (pw) {
          setSelectedWorkout(pw);
          setExercises(existing.exercises);
          setActiveWorkoutId(existing.id!);
          setFeeling(existing.feeling ?? null);
          setNotes(existing.notes ?? "");
          return;
        }
      }

      // No existing log — auto-select workout based on day
      if (!isPastDate) {
        const todayWorkout = getTodaysWorkout();
        if (todayWorkout) {
          setSelectedWorkout(todayWorkout);
          setExercises(createEmptyLog(todayWorkout));
          setActiveWorkoutId(null);
        } else {
          setSelectedWorkout(null);
          setExercises([]);
          setActiveWorkoutId(null);
        }
      } else {
        setSelectedWorkout(null);
        setExercises([]);
        setActiveWorkoutId(null);
      }
      setFeeling(null);
      setNotes("");
    };
    loadWorkout();
  }, [selectedDate, isPastDate]);

  const selectWorkout = async (workout: ProgramWorkout) => {
    // Check if a log already exists for this workout on this date
    const existing = await db.workoutLogs
      .where("date")
      .equals(selectedDate)
      .and((log) => log.programWorkoutId === workout.id)
      .first();

    if (existing) {
      setSelectedWorkout(workout);
      setExercises(existing.exercises);
      setActiveWorkoutId(existing.id!);
      setFeeling(existing.feeling ?? null);
      setNotes(existing.notes ?? "");
    } else {
      setSelectedWorkout(workout);
      setExercises(createEmptyLog(workout));
      setActiveWorkoutId(null);
      setFeeling(null);
      setNotes("");
    }
    setShowPicker(false);
  };

  const addExercise = (name: string) => {
    setExercises((prev) => [
      ...prev,
      { exerciseName: name, targetSets: "3", targetReps: "10", sets: makeEmptySets(3) },
    ]);
  };

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const swapExercise = (index: number, name: string) => {
    setExercises((prev) => {
      const next = [...prev];
      const old = next[index];
      const numSets = old.sets.length || 3;
      next[index] = {
        exerciseName: name,
        targetSets: old.targetSets,
        targetReps: old.targetReps,
        supersetGroup: old.supersetGroup,
        supersetOrder: old.supersetOrder,
        sets: makeEmptySets(numSets),
      };
      return next;
    });
  };

  const handlePickExercise = (name: string) => {
    if (!exercisePicker) return;
    if (exercisePicker.mode === "add") {
      addExercise(name);
    } else {
      swapExercise(exercisePicker.index, name);
    }
    setExercisePicker(null);
    setExerciseSearch("");
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
    if (!selectedWorkout || !activeWorkoutId) return;
    const log: WorkoutLog = {
      id: activeWorkoutId,
      programWorkoutId: selectedWorkout.id,
      date: selectedDate,
      exercises,
      feeling: feeling ?? undefined,
      notes: notes || undefined,
      completed: exercises.length > 0 && exercises.every((ex) => ex.sets.every((s) => s.completed)),
    };
    await db.workoutLogs.put(log);
  }, [selectedWorkout, selectedDate, exercises, feeling, notes, activeWorkoutId]);

  const startWorkout = async () => {
    if (!selectedWorkout || activeWorkoutId) return;
    const log: WorkoutLog = {
      programWorkoutId: selectedWorkout.id,
      date: selectedDate,
      exercises,
      feeling: feeling ?? undefined,
      notes: notes || undefined,
      completed: false,
    };
    const id = await db.workoutLogs.add(log);
    setActiveWorkoutId(id as number);
  };

  // Auto-save on changes — only after the workout has been started
  useEffect(() => {
    if (activeWorkoutId && selectedWorkout && exercises.length > 0) {
      const timer = setTimeout(saveWorkout, 500);
      return () => clearTimeout(timer);
    }
  }, [exercises, feeling, notes, selectedWorkout, activeWorkoutId, saveWorkout]);

  const deleteWorkout = async () => {
    if (activeWorkoutId) {
      await db.workoutLogs.delete(activeWorkoutId);
      setActiveWorkoutId(null);
      setExercises(selectedWorkout ? createEmptyLog(selectedWorkout) : []);
      setFeeling(null);
      setNotes("");
    }
  };

  const completedSets = exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.completed).length, 0);
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  const dayOfWeek = new Date(selectedDate + "T12:00:00").getDay();
  const isRestDay = dayOfWeek === 0 && !selectedWorkout;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {isRestDay ? "Rest Day" : selectedWorkout?.name || "Select Workout"}
          </h1>
          <p className="text-sm text-muted">
            {isRestDay
              ? "Recovery & Regeneration"
              : selectedWorkout
              ? `${selectedWorkout.focusAreas}`
              : PROGRAM_NAME}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeWorkoutId && (
            <button
              onClick={deleteWorkout}
              className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg px-3 py-1.5"
            >
              Delete
            </button>
          )}
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="text-xs bg-card border border-card-border rounded-lg px-3 py-1.5 text-muted"
          >
            Switch
          </button>
        </div>
      </div>

      {/* Date picker */}
      <div className="bg-card border border-card-border rounded-xl p-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              const d = new Date(selectedDate + "T12:00:00");
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split("T")[0]);
            }}
            className="text-muted px-2 py-1 rounded-lg active:bg-card-border"
          >
            &larr;
          </button>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm text-center focus:outline-none"
            />
            {isPastDate && (
              <button
                onClick={() => setSelectedDate(today)}
                className="text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded"
              >
                Today
              </button>
            )}
          </div>
          <button
            onClick={() => {
              const d = new Date(selectedDate + "T12:00:00");
              d.setDate(d.getDate() + 1);
              const next = d.toISOString().split("T")[0];
              if (next <= today) setSelectedDate(next);
            }}
            className={`text-muted px-2 py-1 rounded-lg active:bg-card-border ${selectedDate >= today ? "opacity-30" : ""}`}
          >
            &rarr;
          </button>
        </div>
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

      {isRestDay && (
        <div className="bg-card border border-card-border rounded-xl p-6 text-center space-y-2">
          <div className="text-4xl">&#128564;</div>
          <p className="text-muted text-sm">Rest day. Log an activity or pick a workout if you want to train anyway.</p>
        </div>
      )}

      {selectedWorkout && !isStarted && (
        <button
          onClick={startWorkout}
          className="w-full bg-accent text-white py-3 rounded-xl text-sm font-semibold active:opacity-80"
        >
          Start Workout
        </button>
      )}

      {selectedWorkout && (
        <>
          {/* Progress bar */}
          {isStarted && (
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
          )}

          {/* Rest Timer */}
          {isStarted && <RestTimer />}

          {/* Exercises */}
          <div className="space-y-3">
            {exercises.map((loggedEx, exIndex) => {
              const isSupersetStart = loggedEx.supersetGroup && loggedEx.supersetOrder === 1;
              const isInSuperset = !!loggedEx.supersetGroup;

              return (
                <div key={exIndex}>
                  {isSupersetStart && (
                    <div className="flex items-center gap-2 mb-1 mt-2">
                      <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                        SUPERSET {loggedEx.supersetGroup}
                      </span>
                      <div className="flex-1 h-px bg-card-border" />
                    </div>
                  )}
                  <div className={`bg-card border border-card-border rounded-xl p-3 ${isInSuperset ? "ml-2 border-l-2 border-l-accent/30" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold">{loggedEx.exerciseName}</h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted">
                          {loggedEx.targetSets} x {loggedEx.targetReps}
                        </span>
                        <button
                          onClick={() => setExercisePicker({ mode: "swap", index: exIndex })}
                          className="text-[10px] bg-card-border text-muted rounded px-1.5 py-0.5"
                        >
                          Swap
                        </button>
                        <button
                          onClick={() => removeExercise(exIndex)}
                          className="text-[10px] bg-red-500/20 text-red-400 rounded px-1.5 py-0.5"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
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
                          } ${!isStarted ? "opacity-50" : ""}`}
                        >
                          <span className="text-xs text-muted text-center">{set.setNumber}</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            placeholder="—"
                            value={set.weight ?? ""}
                            disabled={!isStarted}
                            onChange={(e) => updateSet(exIndex, setIndex, "weight", e.target.value)}
                            className="bg-card-border rounded-lg px-2 py-1.5 text-sm text-center w-full focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed"
                          />
                          <input
                            type="number"
                            inputMode="numeric"
                            placeholder={loggedEx.targetReps}
                            value={set.reps ?? ""}
                            disabled={!isStarted}
                            onChange={(e) => updateSet(exIndex, setIndex, "reps", e.target.value)}
                            className="bg-card-border rounded-lg px-2 py-1.5 text-sm text-center w-full focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed"
                          />
                          <button
                            onClick={() => toggleSet(exIndex, setIndex)}
                            disabled={!isStarted}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${
                              set.completed
                                ? "bg-success text-white"
                                : "bg-card-border text-muted"
                            } disabled:cursor-not-allowed`}
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

          <button
            onClick={() => setExercisePicker({ mode: "add" })}
            className="w-full border border-dashed border-card-border rounded-xl py-2.5 text-xs text-muted active:bg-card-border"
          >
            + Add Exercise
          </button>

          {completedSets === totalSets && totalSets > 0 && (
            <div className="bg-success/20 border border-success/30 rounded-xl p-4 text-center">
              <p className="text-success font-bold">Workout Complete!</p>
              <p className="text-success/70 text-xs mt-1">All sets logged and saved automatically.</p>
            </div>
          )}

          {/* Feeling + notes */}
          <div className="bg-card border border-card-border rounded-xl p-3 space-y-3">
            <div>
              <h3 className="text-sm font-semibold mb-2">How did it feel?</h3>
              <div className="flex justify-between gap-2">
                {FEELING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFeeling(opt.value)}
                    disabled={!isStarted}
                    title={opt.label}
                    className={`flex-1 py-2 rounded-lg text-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      feeling === opt.value ? "bg-accent/20 ring-1 ring-accent" : "bg-card-border"
                    }`}
                  >
                    {opt.emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Notes</h3>
              <textarea
                value={notes}
                disabled={!isStarted}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How was the workout? Anything to remember for next time..."
                rows={3}
                className="bg-card-border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed resize-none"
              />
            </div>
          </div>
        </>
      )}

      {/* Exercise picker modal (add / swap) */}
      {exercisePicker && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={() => { setExercisePicker(null); setExerciseSearch(""); }}
        >
          <div
            className="bg-card border border-card-border rounded-t-xl sm:rounded-xl w-full sm:max-w-sm max-h-[75vh] overflow-y-auto p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">
                {exercisePicker.mode === "add" ? "Add Exercise" : "Swap Exercise"}
              </h3>
              <button
                onClick={() => { setExercisePicker(null); setExerciseSearch(""); }}
                className="text-muted text-xs"
              >
                Close
              </button>
            </div>
            <input
              type="text"
              autoFocus
              placeholder="Search or type a custom name..."
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              className="bg-card-border rounded-lg px-3 py-2 text-sm w-full mb-2 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <div className="space-y-1">
              {exerciseSearch.trim() &&
                !EXERCISE_LIBRARY.some((n) => n.toLowerCase() === exerciseSearch.trim().toLowerCase()) && (
                  <button
                    onClick={() => handlePickExercise(exerciseSearch.trim())}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-accent active:bg-card-border"
                  >
                    Use &ldquo;{exerciseSearch.trim()}&rdquo;
                  </button>
                )}
              {EXERCISE_LIBRARY.filter((name) =>
                name.toLowerCase().includes(exerciseSearch.trim().toLowerCase())
              ).map((name) => (
                <button
                  key={name}
                  onClick={() => handlePickExercise(name)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm active:bg-card-border"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
