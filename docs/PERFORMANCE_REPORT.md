# Performance Optimization & Profiler Report: Practical 8

**Student**: Manav Lathiya (24CS048)  
**Institution**: CSPIT, CHARUSAT  
**Course**: ITUE301 - Advanced Web Development Frameworks  

---

## 1. Production Bundle Build Analysis

### Baseline (Practical 7 - Monolithic Bundle)
Command executed: `npm run build`
```text
dist/index.html                   0.49 kB │ gzip:  0.32 kB
dist/assets/index-C8-UZ25U.css   25.29 kB │ gzip:  5.03 kB
dist/assets/index-JCX1CG_t.js   290.20 kB │ gzip: 90.51 kB
✓ built in 838ms
```
* Single monolithic JavaScript chunk: **290.20 kB**.
* Total JS chunks: **1**.

---

### Optimized (Practical 8 - Code Split via React.lazy & Suspense)
Command executed: `npm run build`
```text
dist/index.html                          0.49 kB │ gzip:  0.32 kB
dist/assets/index-Tn0cZxkQ.css          32.72 kB │ gzip:  6.37 kB
dist/assets/NotFound-BQfrQH0M.js         0.52 kB │ gzip:  0.30 kB
dist/assets/ErrorMessage-DEgB4Sr7.js     0.77 kB │ gzip:  0.39 kB
dist/assets/Home-BmzhJ4h8.js             3.28 kB │ gzip:  1.21 kB
dist/assets/Projects-C5DPjzpa.js         3.91 kB │ gzip:  1.52 kB
dist/assets/TaskAnalytics-KwC-9CUy.js    4.56 kB │ gzip:  1.23 kB
dist/assets/Contact-DJ3NtX01.js          4.83 kB │ gzip:  1.48 kB
dist/assets/TaskManager-DCb335ic.js     15.36 kB │ gzip:  4.64 kB
dist/assets/index-mOc92ylq.js          266.08 kB │ gzip: 84.68 kB
✓ built in 639ms
```

### Metrics Comparison Table
| Metric | Baseline | Optimized | Delta |
| :--- | :--- | :--- | :--- |
| **Initial Bundle Size** | 290.20 kB | 266.08 kB | **-24.12 kB (-8.3%)** |
| **Initial Gzip Size** | 90.51 kB | 84.68 kB | **-5.83 kB (-6.4%)** |
| **Number of JS Chunks** | 1 | 8 | **+7 lazy chunks** |
| **Build Time** | 838 ms | 639 ms | **-199 ms** |

---

## 2. DevTools Network Tab Profiling Guidelines

### Simulation Profile: Slow 3G
* **Condition**: DevTools -> Network -> Throttling -> "Slow 3G"
* **Cache**: Disabled (`Disable cache` checkbox checked)
* **Filter**: `JS`

### Step-by-Step Observation:
1. Load root URL `http://localhost:5173/`:
   - `index.html` loads.
   - `index-*.js` (main entry shell) loads.
   - `Home-*.js` loads immediately as the index route.
2. Click **"Projects"** in navigation bar:
   - Suspense fallback renders with animated pulse ring and skeleton bars.
   - Request fires for `Projects-*.js`.
   - Once chunk completes, Projects component replaces fallback seamlessly.
3. Click **"Task Manager"**:
   - Suspense fallback renders.
   - Request fires for `TaskManager-*.js`.
   - Task manager displays authentication banner & protected task pipeline.
4. Click **"📊 View Analytics (Chunk Demo)"**:
   - Micro-suspense fallback appears in analytics container.
   - Request fires for on-demand `TaskAnalytics-*.js`.
   - SVG doughnut & priority breakdown charts mount.

---

## 3. React DevTools Profiler Analysis (Supplementary 3)

### Identified Re-Render Bottleneck:
* In the baseline implementation, typing in the search filter on the Task Manager caused every rendered task item card to re-render, even if its properties had not changed.

### Optimization Solution:
1. Wrapped individual task cards in a memoized subcomponent:
   ```javascript
   const TaskItem = React.memo(function TaskItem({ task, onToggleComplete, onRequestDelete }) { ... });
   ```
2. Stabilized event callback references with `useCallback`:
   ```javascript
   const handleToggleComplete = useCallback(async (task) => { ... }, []);
   const handleRequestDelete = useCallback((task) => { setTaskToDelete(task); }, []);
   ```
3. Derived filtered results via `useMemo`:
   ```javascript
   const filteredTasks = useMemo(() => tasks.filter(...), [tasks, filterPriority, searchQuery]);
   ```

### Profiler Outcome:
* **Before**: 1 keystroke in search box = 10 task component renders.
* **After**: 1 keystroke in search box = 0 task item re-renders (only filtered subset re-mounts or updates without re-evaluating unchanged items).
