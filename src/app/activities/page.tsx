"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { ActivityLog, ActivityType, ClimbingType, ClimbingLocation } from "@/lib/types";
import { useLiveQuery } from "dexie-react-hooks";

const emptyClimbing: Partial<ActivityLog> = {
  type: "climbing",
  duration: 60,
  climbingType: "boulder",
  climbingLocation: "indoor",
  grades: "",
  notes: "",
};

const emptyBiking: Partial<ActivityLog> = {
  type: "biking",
  duration: 60,
  trailName: "",
  distance: undefined,
  elevationGain: undefined,
  notes: "",
};

export default function ActivitiesPage() {
  const [showForm, setShowForm] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("climbing");
  const [form, setForm] = useState<Partial<ActivityLog>>(emptyClimbing);
  const today = new Date().toISOString().split("T")[0];

  const recentActivities = useLiveQuery(
    () => db.activityLogs.orderBy("date").reverse().limit(20).toArray(),
    []
  );

  useEffect(() => {
    setForm(activityType === "climbing" ? { ...emptyClimbing } : { ...emptyBiking });
  }, [activityType]);

  const handleSave = async () => {
    const entry: ActivityLog = {
      type: activityType,
      date: today,
      duration: form.duration || 60,
      notes: form.notes || "",
      ...(activityType === "climbing"
        ? {
            climbingType: form.climbingType as ClimbingType,
            climbingLocation: form.climbingLocation as ClimbingLocation,
            grades: form.grades,
          }
        : {
            trailName: form.trailName,
            distance: form.distance,
            elevationGain: form.elevationGain,
          }),
    };
    await db.activityLogs.add(entry);
    setForm(activityType === "climbing" ? { ...emptyClimbing } : { ...emptyBiking });
    setShowForm(false);
  };

  const deleteActivity = async (id: number) => {
    await db.activityLogs.delete(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Activities</h1>
          <p className="text-sm text-muted">Climbing & Mountain Biking</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-accent text-white px-4 py-1.5 rounded-lg text-sm font-semibold"
        >
          {showForm ? "Cancel" : "+ Log"}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-card-border rounded-xl p-4 space-y-4">
          {/* Activity type toggle */}
          <div className="flex gap-2">
            {(["climbing", "biking"] as ActivityType[]).map((t) => (
              <button
                key={t}
                onClick={() => setActivityType(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  activityType === t ? "bg-accent text-white" : "bg-card-border text-muted"
                }`}
              >
                {t === "climbing" ? "Climbing" : "Mountain Biking"}
              </button>
            ))}
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs text-muted block mb-1">Duration (minutes)</label>
            <input
              type="number"
              inputMode="numeric"
              value={form.duration || ""}
              onChange={(e) => setForm({ ...form, duration: e.target.value ? Number(e.target.value) : undefined })}
              className="bg-card-border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {activityType === "climbing" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Type</label>
                  <select
                    value={form.climbingType || "boulder"}
                    onChange={(e) => setForm({ ...form, climbingType: e.target.value as ClimbingType })}
                    className="bg-card-border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="boulder">Boulder</option>
                    <option value="sport">Sport</option>
                    <option value="trad">Trad</option>
                    <option value="top-rope">Top Rope</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Location</label>
                  <select
                    value={form.climbingLocation || "indoor"}
                    onChange={(e) => setForm({ ...form, climbingLocation: e.target.value as ClimbingLocation })}
                    className="bg-card-border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Grades (e.g. V4, V5, 5.11a)</label>
                <input
                  type="text"
                  value={form.grades || ""}
                  onChange={(e) => setForm({ ...form, grades: e.target.value })}
                  className="bg-card-border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="V4, V5, V3"
                />
              </div>
            </>
          )}

          {activityType === "biking" && (
            <>
              <div>
                <label className="text-xs text-muted block mb-1">Trail Name</label>
                <input
                  type="text"
                  value={form.trailName || ""}
                  onChange={(e) => setForm({ ...form, trailName: e.target.value })}
                  className="bg-card-border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="Trail name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Distance (miles)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={form.distance ?? ""}
                    onChange={(e) => setForm({ ...form, distance: e.target.value ? Number(e.target.value) : undefined })}
                    className="bg-card-border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Elevation (ft)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.elevationGain ?? ""}
                    onChange={(e) => setForm({ ...form, elevationGain: e.target.value ? Number(e.target.value) : undefined })}
                    className="bg-card-border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs text-muted block mb-1">Notes</label>
            <textarea
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="bg-card-border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-accent resize-none"
              placeholder="How'd it go?"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-accent text-white py-2.5 rounded-lg text-sm font-semibold"
          >
            Save Activity
          </button>
        </div>
      )}

      {/* Recent activities */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted">Recent Activities</h2>
        {!recentActivities || recentActivities.length === 0 ? (
          <p className="text-sm text-muted/50 text-center py-8">No activities logged yet</p>
        ) : (
          recentActivities.map((a) => (
            <div key={a.id} className="bg-card border border-card-border rounded-xl p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      a.type === "climbing" ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400"
                    }`}>
                      {a.type === "climbing" ? "CLIMB" : "BIKE"}
                    </span>
                    <span className="text-xs text-muted">{a.date}</span>
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="text-muted">{a.duration} min</span>
                    {a.type === "climbing" && (
                      <>
                        {a.climbingType && <span className="text-muted"> &middot; {a.climbingType}</span>}
                        {a.climbingLocation && <span className="text-muted"> &middot; {a.climbingLocation}</span>}
                        {a.grades && <span className="ml-2">{a.grades}</span>}
                      </>
                    )}
                    {a.type === "biking" && (
                      <>
                        {a.trailName && <span className="ml-2">{a.trailName}</span>}
                        {a.distance && <span className="text-muted"> &middot; {a.distance} mi</span>}
                        {a.elevationGain && <span className="text-muted"> &middot; {a.elevationGain} ft</span>}
                      </>
                    )}
                  </div>
                  {a.notes && <p className="text-xs text-muted mt-1">{a.notes}</p>}
                </div>
                <button
                  onClick={() => a.id && deleteActivity(a.id)}
                  className="text-muted/50 text-xs px-2 py-1"
                >
                  &#x2715;
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
