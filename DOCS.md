# Zach's Workout Tracker — Project Documentation

## Overview

A Progressive Web App (PWA) built for Zach to track his workouts, climbing, mountain biking, weight, and progress photos. The app is offline-first, stores all data locally on the device, and can be installed on an iPhone home screen like a native app.

## Workout Program

The app comes pre-loaded with the **Hollywood Muscle: Sylvester Stallone Inspired Workout Routine** from Muscle & Strength.

- **Duration:** 8 weeks
- **Frequency:** 6 days/week (Sunday rest)
- **Workout time:** 45–75 minutes
- **Rest periods:** 60–90 seconds (default timer set to 75s)

### Weekly Schedule

| Day | Workout | Focus |
|-----|---------|-------|
| Monday | Workout 1 | Chest, Triceps, Biceps |
| Tuesday | Workout 2 | Back, Shoulders |
| Wednesday | Workout 3 | Legs, Abs |
| Thursday | Workout 4 | Chest, Triceps, Biceps |
| Friday | Workout 5 | Back, Shoulders |
| Saturday | Workout 6 | Legs, Abs |
| Sunday | Rest | Recovery |

Workouts include supersets (labeled A, B, C) where exercises are performed back-to-back without rest.

## Tech Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Framework | Next.js 16 (React) | App framework, SSR, routing |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS 4 | Mobile-first UI |
| Local DB | Dexie.js (IndexedDB) | Offline data persistence |
| PWA | Custom service worker + manifest | Installable, offline caching |
| Hosting | Vercel (free tier) | Deployment, CDN |
| Repo | GitHub | Source control |

## App Features

### 1. Workout Logging (Home tab — `/`)
- Auto-loads the correct workout for the current day of the week
- "Switch" button to manually pick any of the 6 workouts
- Each exercise shows prescribed sets x reps
- For each set: enter weight (lbs) and reps completed, tap checkmark to complete
- Supersets are visually grouped with labels (A, B, C)
- Progress bar shows completed sets out of total
- **Auto-saves** to IndexedDB on every change (500ms debounce)
- Rest day message shown on Sundays

### 2. Rest Timer
- Default 75 seconds (adjustable in 15-second increments)
- Visual progress bar while counting down
- Vibration alert when timer ends (on supported devices)

### 3. Activities (Activities tab — `/activities`)
- Log **climbing** sessions: type (boulder/sport/trad/top-rope), location (indoor/outdoor), grades, duration, notes
- Log **mountain biking** rides: trail name, distance (miles), elevation gain (ft), duration, notes
- Recent activities list with delete

### 4. Progress Tracking (Progress tab — `/progress`)
- **Weight logging:** daily weigh-in in lbs with save button
- **Weight chart:** bar chart showing last 14 entries with trend visualization
- **Recent weigh-ins:** list of last 7 entries
- **Progress photos:** upload from camera or gallery, labeled as front/side/back
- **Photo compare:** tap two photos to see them side-by-side
- Photos are resized to max 800px and compressed to JPEG 0.8 quality to save storage

### 5. History (History tab — `/history`)
- **Program progress:** total workouts, total activities, current week (X/8) with progress bar
- **Weekly schedule:** visual overview of the 6-day split
- **Activity log:** chronological timeline of all workouts and activities, grouped by date

### 6. Offline Support
- All data stored in IndexedDB via Dexie.js — persists between sessions, no internet needed
- Service worker caches app pages for offline access
- PWA manifest enables "Add to Home Screen" on iOS

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with nav, PWA meta tags
│   ├── page.tsx            # Workout logging (home)
│   ├── activities/
│   │   └── page.tsx        # Climbing & biking log
│   ├── progress/
│   │   └── page.tsx        # Weight & photo tracking
│   └── history/
│       └── page.tsx        # Timeline & program progress
├── components/
│   ├── BottomNav.tsx       # Tab bar navigation
│   ├── RestTimer.tsx       # Configurable rest timer
│   └── ServiceWorkerRegistrar.tsx  # SW registration
├── lib/
│   ├── db.ts               # Dexie database setup (SSR-safe)
│   ├── types.ts            # TypeScript interfaces
│   └── workoutData.ts      # Pre-loaded Stallone program data
public/
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── icon-192.png            # App icon (placeholder SVG)
└── icon-512.png            # App icon (placeholder SVG)
```

## Database Schema (IndexedDB via Dexie)

### workoutLogs
- `id` (auto-increment)
- `programWorkoutId` (1–6, indexed)
- `date` (ISO string, indexed)
- `exercises` (array of logged exercises with sets)
- `completed` (boolean)

### activityLogs
- `id` (auto-increment)
- `type` ("climbing" | "biking", indexed)
- `date` (ISO string, indexed)
- `duration` (minutes)
- `notes`, plus type-specific fields

### weightEntries
- `id` (auto-increment)
- `date` (ISO string, indexed)
- `weight` (number, lbs)

### progressPhotos
- `id` (auto-increment)
- `date` (ISO string, indexed)
- `imageData` (base64 JPEG)
- `label` ("front" | "side" | "back")

## Deployment

### GitHub
- **Repo:** https://github.com/moloughlin16/zach-workout-app
- **Branch:** main

### Vercel
- Connected to GitHub repo for auto-deploy on push
- Free tier (sufficient for single-user app)
- No environment variables needed
- No build configuration needed (auto-detects Next.js)

### Installing on iPhone
1. Open the Vercel deployment URL in Safari
2. Tap the share button (square with arrow)
3. Tap "Add to Home Screen"
4. The app runs in standalone mode (no browser chrome)

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Build History

### Initial commit
- Full app scaffold with all 4 tabs
- Pre-loaded Stallone workout program (all 6 workouts, all exercises)
- Dexie.js database with auto-save
- PWA manifest and service worker
- Dark theme, mobile-first design

### SSR fix
- Wrapped Dexie initialization in `typeof window` check to prevent Vercel build failures
- Fixed em dash placeholder character rendering

## Future Enhancements (not yet built)
- **Supabase integration** — cloud backup/sync of all data
- **Proper app icons** — replace SVG placeholders with designed icons
- **Start/end time tracking** — timestamps for workout duration
- **Personal records** — auto-detect PRs per exercise
- **Deload reminder** — alert at week 8
- **Volume tracking** — total volume per muscle group over time
- **CSV export** — export training history
- **Strava/Apple Health integration** — auto-import biking data
