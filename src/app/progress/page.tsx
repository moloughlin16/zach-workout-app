"use client";

import { useState, useRef } from "react";
import { db } from "@/lib/db";
import { WeightEntry, ProgressPhoto } from "@/lib/types";
import { useLiveQuery } from "dexie-react-hooks";

export default function ProgressPage() {
  const [weightInput, setWeightInput] = useState("");
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [photoLabel, setPhotoLabel] = useState("front");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().split("T")[0];

  const weightEntries = useLiveQuery(
    () => db.weightEntries.orderBy("date").reverse().limit(30).toArray(),
    []
  );

  const photos = useLiveQuery(
    () => db.progressPhotos.orderBy("date").reverse().limit(20).toArray(),
    []
  );

  const [selectedPhotos, setSelectedPhotos] = useState<[number | null, number | null]>([null, null]);

  const saveWeight = async () => {
    if (!weightInput) return;
    const entry: WeightEntry = { date: today, weight: Number(weightInput) };
    await db.weightEntries.add(entry);
    setWeightInput("");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const imageData = ev.target?.result as string;

      // Resize to save storage
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const maxDim = 800;
        const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const resized = canvas.toDataURL("image/jpeg", 0.8);

        const photo: ProgressPhoto = {
          date: today,
          imageData: resized,
          label: photoLabel,
        };
        await db.progressPhotos.add(photo);
        setShowPhotoForm(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
  };

  const deletePhoto = async (id: number) => {
    await db.progressPhotos.delete(id);
  };

  const deleteWeight = async (id: number) => {
    await db.weightEntries.delete(id);
  };

  // Simple weight chart (last 14 entries, drawn with divs)
  const chartData = weightEntries ? [...weightEntries].reverse().slice(-14) : [];
  const minW = chartData.length > 0 ? Math.min(...chartData.map((e) => e.weight)) - 2 : 0;
  const maxW = chartData.length > 0 ? Math.max(...chartData.map((e) => e.weight)) + 2 : 1;
  const range = maxW - minW || 1;

  // Compare mode
  const comparePhoto1 = selectedPhotos[0] !== null ? photos?.find((p) => p.id === selectedPhotos[0]) : null;
  const comparePhoto2 = selectedPhotos[1] !== null ? photos?.find((p) => p.id === selectedPhotos[1]) : null;

  const togglePhotoSelect = (id: number) => {
    setSelectedPhotos((prev) => {
      if (prev[0] === id) return [null, prev[1]];
      if (prev[1] === id) return [prev[0], null];
      if (prev[0] === null) return [id, prev[1]];
      if (prev[1] === null) return [prev[0], id];
      return [id, null]; // replace first
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Progress</h1>

      {/* Weight entry */}
      <div className="bg-card border border-card-border rounded-xl p-4">
        <h2 className="text-sm font-semibold mb-3">Log Weight</h2>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="lbs"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="bg-card-border rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            onClick={saveWeight}
            className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Save
          </button>
        </div>
      </div>

      {/* Weight chart */}
      {chartData.length > 1 && (
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Weight Trend</h2>
            <span className="text-xs text-muted">
              {chartData.length > 0 && `${chartData[chartData.length - 1].weight} lbs`}
            </span>
          </div>
          <div className="flex items-end gap-1 h-24">
            {chartData.map((entry, i) => {
              const height = ((entry.weight - minW) / range) * 100;
              return (
                <div key={entry.id || i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-accent rounded-t transition-all"
                    style={{ height: `${Math.max(4, height)}%` }}
                    title={`${entry.date}: ${entry.weight} lbs`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-muted">{chartData[0]?.date.slice(5)}</span>
            <span className="text-[9px] text-muted">{chartData[chartData.length - 1]?.date.slice(5)}</span>
          </div>
        </div>
      )}

      {/* Weight history */}
      {weightEntries && weightEntries.length > 0 && (
        <div className="bg-card border border-card-border rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-2">Recent Weigh-ins</h2>
          <div className="space-y-1">
            {weightEntries.slice(0, 7).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-1">
                <span className="text-xs text-muted">{entry.date}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{entry.weight} lbs</span>
                  <button onClick={() => entry.id && deleteWeight(entry.id)} className="text-muted/50 text-xs">&#x2715;</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress photos */}
      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Progress Photos</h2>
          <button
            onClick={() => setShowPhotoForm(!showPhotoForm)}
            className="text-xs bg-accent text-white px-3 py-1 rounded-lg font-semibold"
          >
            {showPhotoForm ? "Cancel" : "+ Add"}
          </button>
        </div>

        {showPhotoForm && (
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs text-muted block mb-1">Pose</label>
              <div className="flex gap-2">
                {["front", "side", "back"].map((label) => (
                  <button
                    key={label}
                    onClick={() => setPhotoLabel(label)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      photoLabel === label ? "bg-accent text-white" : "bg-card-border text-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="text-sm text-muted file:bg-accent file:text-white file:border-0 file:rounded-lg file:px-3 file:py-1.5 file:text-xs file:font-semibold file:mr-3"
            />
          </div>
        )}

        {/* Compare mode */}
        {(comparePhoto1 || comparePhoto2) && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted">Compare Mode</span>
              <button onClick={() => setSelectedPhotos([null, null])} className="text-xs text-muted">Clear</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[comparePhoto1, comparePhoto2].map((photo, i) => (
                <div key={i} className="aspect-[3/4] bg-card-border rounded-lg overflow-hidden flex items-center justify-center">
                  {photo ? (
                    <div className="relative w-full h-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.imageData} alt={photo.label || ""} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                        {photo.date}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted">Tap a photo</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photo grid */}
        <div className="grid grid-cols-3 gap-2">
          {photos?.map((photo) => (
            <button
              key={photo.id}
              onClick={() => photo.id && togglePhotoSelect(photo.id)}
              className={`aspect-[3/4] rounded-lg overflow-hidden relative ${
                selectedPhotos.includes(photo.id!) ? "ring-2 ring-accent" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.imageData} alt={photo.label || ""} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-1">
                <span className="text-[9px] text-white">{photo.date.slice(5)}</span>
                {photo.label && <span className="text-[9px] text-white/70 ml-1">{photo.label}</span>}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); photo.id && deletePhoto(photo.id); }}
                className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white/70 rounded-full text-[10px] flex items-center justify-center"
              >
                &#x2715;
              </button>
            </button>
          ))}
          {(!photos || photos.length === 0) && (
            <p className="text-xs text-muted/50 col-span-3 text-center py-4">No photos yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
