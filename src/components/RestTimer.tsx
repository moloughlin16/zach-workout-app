"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface RestTimerProps {
  defaultSeconds?: number;
}

export default function RestTimer({ defaultSeconds = 75 }: RestTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(defaultSeconds);
  const [totalSeconds, setTotalSeconds] = useState(defaultSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [totalSeconds]);

  const start = useCallback(() => {
    setSecondsLeft(totalSeconds);
    setIsRunning(true);
  }, [totalSeconds]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            // Vibrate if available
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;
  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  const adjustTime = (delta: number) => {
    const newTotal = Math.max(15, Math.min(300, totalSeconds + delta));
    setTotalSeconds(newTotal);
    if (!isRunning) setSecondsLeft(newTotal);
  };

  return (
    <div className="bg-card border border-card-border rounded-xl p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted font-medium uppercase tracking-wide">Rest</span>
        <div className="flex items-center gap-2">
          <button onClick={() => adjustTime(-15)} className="text-muted text-sm w-7 h-7 flex items-center justify-center rounded-lg active:bg-card-border">
            -15
          </button>
          <span className={`text-2xl font-mono font-bold tabular-nums w-16 text-center ${secondsLeft === 0 && !isRunning ? "text-success" : secondsLeft <= 10 && isRunning ? "text-warning" : ""}`}>
            {minutes}:{secs.toString().padStart(2, "0")}
          </span>
          <button onClick={() => adjustTime(15)} className="text-muted text-sm w-7 h-7 flex items-center justify-center rounded-lg active:bg-card-border">
            +15
          </button>
        </div>
        <button
          onClick={isRunning ? stop : start}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
            isRunning
              ? "bg-red-500/20 text-red-400 active:bg-red-500/30"
              : "bg-accent/20 text-accent active:bg-accent/30"
          }`}
        >
          {isRunning ? "Stop" : secondsLeft === 0 ? "Reset" : "Start"}
        </button>
      </div>
      {isRunning && (
        <div className="mt-2 h-1 bg-card-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
