# Practical 8: Performance Optimization and Lazy Loading in React

**Course**: Advanced Web Development Frameworks (ITUE301)  
**Department**: Computer Science and Engineering  
**Institute**: Chandubhai S. Patel Institute of Technology (CSPIT), CHARUSAT  
**Academic Year**: 2025–2026  
**Student Name**: Manav Lathiya  
**Student ID**: 24CS048  
**GitHub Repository**: [24CS048Manav/ITUE301-AWDF_Practical8](https://github.com/24CS048Manav/ITUE301-AWDF_Practical8)

---

## 🎯 Practical Objective
To improve frontend performance using route-based and component-based lazy loading, code splitting, dynamic Suspense fallbacks, and component memoization in a full-stack React + Express + MongoDB architecture.

---

## 🏗️ Architecture & Code-Splitting Concept

### Before Optimization (Single Monolithic Bundle)
All routes, pages, and components were packaged into a single large JavaScript bundle. A user visiting only the Home page was forced to download the code for Projects, Contact, and the entire Task Management system upfront.
```
┌─────────────────────────────────────────────────────────────┐
│                       main.bundle.js                        │
│  [Home]  [Projects]  [TaskManager]  [Contact]  [NotFound]   │
└─────────────────────────────────────────────────────────────┘
  (Loaded upfront on first visit regardless of current route)
```

### After Optimization (Route-Based & Component-Based Code Splitting)
By utilizing `React.lazy()` and dynamic `import()`, Vite splits the code into smaller, route-scoped chunks. Chunks are only requested across the network when the corresponding route is accessed or when an on-demand feature is requested.
```
                        index.html
                            │
                            ▼
                     main.bundle.js (Core layout, routing shell, theme)
                            │
       ┌─────────────┬──────┴───────┬──────────────┬──────────────┐
       ▼             ▼              ▼              ▼              ▼
  Home.chunk    Tasks.chunk   Projects.chunk  Contact.chunk  NotFound.chunk
  (loads on /) (loads on /tasks) (loads /projects) (loads /contact) (loads on 404)
                     │
                     ▼ (on-demand toggle)
               TaskAnalytics.chunk
```

---

## 📊 Before vs. After Bundle Size Comparison

The build metrics were recorded using Vite production builds (`npm run build`):

| Metric / Chunk File | Before Optimization (Single Bundle) | After Optimization (Code-Split) | Difference / Impact |
| :--- | :--- | :--- | :--- |
| **Main JS Entry (`index-*.js`)** | **290.20 kB** (gzip: 90.51 kB) | **266.08 kB** (gzip: 84.68 kB) | **-24.12 kB (-8.3% initial download)** |
| **`TaskManager-*.js`** | Bundled in main | **15.36 kB** (gzip: 4.64 kB) | Loaded only on `/tasks` |
| **`TaskAnalytics-*.js`** | Bundled in main | **4.56 kB** (gzip: 1.23 kB) | Loaded only on analytics button click |
| **`Contact-*.js`** | Bundled in main | **4.83 kB** (gzip: 1.48 kB) | Loaded only on `/contact` |
| **`Projects-*.js`** | Bundled in main | **3.91 kB** (gzip: 1.52 kB) | Loaded only on `/projects` |
| **`Home-*.js`** | Bundled in main | **3.28 kB** (gzip: 1.21 kB) | Loaded only on `/` |
| **`ErrorMessage-*.js`** | Bundled in main | **0.77 kB** (gzip: 0.39 kB) | Shared lazy utility chunk |
| **`NotFound-*.js`** | Bundled in main | **0.52 kB** (gzip: 0.30 kB) | Loaded only on invalid route |
| **Total JS Chunks Generated** | **1 chunk** | **8 chunks** | Fine-grained on-demand loading |
| **Initial Parse & Execution Time** | Slower (monolithic AST parsing) | Faster (critical path only) | Improved First Contentful Paint (FCP) |

---

## 💡 Key Implementation Details

### 1. Route-Based Lazy Loading (`src/App.jsx`)
```jsx
import React, { useState, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import RouteLoadingFallback from './components/RouteLoadingFallback';
import { lazyWithMinDelay } from './utils/lazyWithDelay';

// Dynamic lazy imports with artificial minimum delay for smooth transitions
const Home = lazyWithMinDelay(() => import('./components/Home'), 300);
const TaskManager = lazyWithMinDelay(() => import('./components/TaskManager'), 300);
const Projects = lazyWithMinDelay(() => import('./components/Projects'), 300);
const Contact = lazyWithMinDelay(() => import('./components/Contact'), 300);
const NotFound = lazyWithMinDelay(() => import('./components/NotFound'), 300);

function App() {
  return (
    <div className="portfolio-app">
      <NavBar />
      <main className="portfolio-container">
        <Suspense fallback={<RouteLoadingFallback message="Loading route module..." />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tasks" element={<TaskManager />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
```

### 2. Meaningful Fallback UI (`src/components/RouteLoadingFallback.jsx`)
Provides skeleton bars, an animated spinner, and a status badge explaining that code splitting is taking place. This informs users and avoids jarring blank screens.

### 3. Supplementary Problem 1: Heavy On-Demand Component (`src/components/TaskAnalytics.jsx`)
Inside `TaskManager.jsx`, the visual task statistics dashboard is split into an on-demand chunk:
```jsx
const TaskAnalytics = lazy(() => import('./TaskAnalytics'));

// Rendered inside localized Suspense only when the user toggles the view:
{showAnalytics && (
  <Suspense fallback={<div className="analytics-loading-skeleton">Loading analytics chunk...</div>}>
    <TaskAnalytics tasks={tasks} onClose={() => setShowAnalytics(false)} />
  </Suspense>
)}
```

### 4. Supplementary Problem 2: Minimum-Delay Fallback (`src/utils/lazyWithDelay.js`)
Prevents loading spinners from flickering on fast connections (< 50ms) by enforcing a 300ms minimum threshold:
```javascript
export function lazyWithMinDelay(factory, minDelay = 300) {
  return lazy(() =>
    Promise.all([
      factory(),
      new Promise((resolve) => setTimeout(resolve, minDelay)),
    ]).then(([moduleExports]) => moduleExports)
  );
}
```

### 5. Supplementary Problem 3: Component Memoization (`React.memo`, `useMemo`, `useCallback`)
- Extracted and memoized individual task cards with `React.memo(TaskItem)`.
- Bound action handlers with `useCallback` so `TaskItem` instances do not re-render unnecessarily when typing into search filters.
- Filtered lists and aggregated metrics computed with `useMemo`.

---

## ❓ Key Questions & Analysis (Lab Viva Preparation)

### Q1: What is the difference between the initial bundle and a lazy-loaded chunk in terms of when each is downloaded?
* **Initial Bundle**: Downloaded immediately when the browser first loads `index.html`. It contains the runtime framework, global state, navigation, and top-level styling necessary for First Paint.
* **Lazy-Loaded Chunk**: Downloaded asynchronously via an HTTP request only when triggered by user action (such as navigating to a new route via React Router or clicking a button that mounts a lazy-loaded component).

### Q2: Why does lazy loading improve perceived performance even though the total amount of code downloaded eventually stays the same?
* **Critical Rendering Path**: Users perceive a website as "fast" if the First Contentful Paint (FCP) and Time to Interactive (TTI) occur quickly.
* By deferring non-critical routes (e.g. `/contact` or `/tasks`), the browser parses and executes significantly fewer JavaScript bytes initially, freeing the main thread to render the current screen immediately.
* Furthermore, in real-world usage, many users may never navigate to every page in a session, saving network bandwidth altogether.

### Q3: In what situations would lazy loading not be worth the added complexity?
1. **Ultra-Small Single-Page Applications**: When the total application JavaScript is small (< 50–100 kB), introducing multiple chunks adds HTTP request roundtrips and overhead without noticeable user benefit.
2. **Critical Above-the-Fold Content**: Components that must appear instantly on the first screen should never be lazy loaded.
3. **Frequent Flash of Loading States**: Poorly tuned loading fallbacks without minimum delays can degrade UX on fluctuating connections.

---

## 🚀 How to Run and Test

### 1. Start the Backend Server
```bash
cd backend
npm install
npm run dev
# Backend runs at http://localhost:5000
```

### 2. Start the Frontend Development Server
```bash
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

### 3. Verify Code-Splitting in Browser DevTools
1. Open Chrome DevTools (`F12`) and navigate to the **Network** tab.
2. Filter requests by **JS**.
3. Under Network Throttling, select **Slow 3G** (or Fast 3G).
4. Navigate between **Home** (`/`), **Projects** (`/projects`), **Tasks** (`/tasks`), and **Contact** (`/contact`).
5. Observe the individual `.js` chunk requests dynamically firing only upon navigation, accompanied by the styled Suspense fallback UI.
6. On the **Tasks** page, click **"📊 View Analytics (Chunk Demo)"** to observe the on-demand `TaskAnalytics-*.js` chunk load!
