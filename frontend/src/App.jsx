import React, { useState, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import RouteLoadingFallback from './components/RouteLoadingFallback';
import { lazyWithMinDelay } from './utils/lazyWithDelay';
import './App.css';

// =======================================================================
// PRACTICAL 8: ROUTE-BASED CODE SPLITTING (React.lazy + Suspense)
// Instead of bundling all page components into a single massive bundle,
// each route is downloaded on-demand as a separate JavaScript chunk.
// =======================================================================

// Minimum 300ms delay avoids flickering loading spinner on fast local connections (Lab Manual Supplementary 2)
const Home = lazyWithMinDelay(() => import('./components/Home'), 300);
const TaskManager = lazyWithMinDelay(() => import('./components/TaskManager'), 300);
const Projects = lazyWithMinDelay(() => import('./components/Projects'), 300);
const Contact = lazyWithMinDelay(() => import('./components/Contact'), 300);
const NotFound = lazyWithMinDelay(() => import('./components/NotFound'), 300);

function App() {
  // useState variable for dark/light mode theme toggle across entire application
  const [darkMode, setDarkMode] = useState(false);

  // Student and academic portfolio data
  const studentInfo = {
    name: 'Manav Lathiya',
    id: '24CS048',
    department: 'Department of Computer Science and Engineering',
    institution: 'Chandubhai S Patel Institute of Technology (CSPIT), CHARUSAT',
    academicYear: '2025-26',
    email: '24cs048@charusat.edu.in',
    githubUrl: 'https://github.com/24CS048Manav',
    bio: 'Third-year B.Tech Computer Science and Engineering student at CSPIT, Charusat. Passionate about modern web architecture, component-driven design, and building scalable full-stack web applications. Currently mastering React, Vite, Node.js, and advanced development frameworks through hands-on coursework.',
  };

  // Skills array passed to Home -> Skills component via props
  const skills = [
    'React.js (React Router v6)',
    'Route-based Code Splitting (React.lazy)',
    'Dynamic Suspense Fallbacks',
    'Bundle Optimization & Chunks',
    'Controlled Forms & Real-time Binding',
    'JWT Authentication & Middleware',
    'Vite Build Tool & Profiler',
    'Node.js & Express REST APIs',
    'MongoDB & Mongoose ODM',
  ];

  // Connected projects list maintaining thread across practicals
  const projects = [
    {
      title: 'Practical 1: Student Portfolio Platform',
      description: 'Component-based static portfolio built using Vite and React, demonstrating modular architecture and dynamic prop passing.',
      tech: ['React', 'Vite', 'CSS3', 'JSX'],
      status: 'Completed (Prac 1)',
    },
    {
      title: 'Practical 2: SPA Routing & State Management',
      description: 'Multi-page single-page application with client-side routing (React Router v6), controlled form inputs, dynamic state toggling, and live previews.',
      tech: ['React Router v6', 'useState', 'SPA Navigation', 'Controlled Forms'],
      status: 'Completed (Prac 2)',
    },
    {
      title: 'Practical 3-7: Full-Stack MERN Platform',
      description: 'Progressive architecture with GitHub API integration, Express backend, persistent MongoDB storage, and secure JWT authentication pipeline.',
      tech: ['MERN Stack', 'JWT Auth', 'Bcrypt', 'MongoDB', 'Mongoose'],
      status: 'Completed (Pracs 3-7)',
    },
    {
      title: 'Practical 8: Performance Optimization & Lazy Loading',
      description: 'Route-based code splitting, dynamic component lazy loading, Suspense fallbacks, and bundle profiling with DevTools.',
      tech: ['React.lazy()', 'Suspense', 'Code Splitting', 'Vite Chunks', 'DevTools Profiler'],
      status: 'Current (Prac 8)',
    },
  ];

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`portfolio-app ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      {/* Navigation bar with route Links and theme toggle */}
      <NavBar darkMode={darkMode} onToggleTheme={toggleDarkMode} />

      {/* Main Single Page Application Route Outlet with Route-Level Suspense */}
      <main className="portfolio-container">
        {/* Practical 8 Optimization Status Banner */}
        <div className="optimization-banner" role="region" aria-label="Performance Status">
          <div className="opt-info-text">
            <span className="opt-badge-pill">Practical 8 Active</span>
            <span>Route Code Splitting Enabled (<code>React.lazy()</code> + <code>Suspense</code>)</span>
          </div>
          <div className="opt-chunks-info">
            <span className="opt-chunk-tag">Home.chunk</span>
            <span className="opt-chunk-tag">Projects.chunk</span>
            <span className="opt-chunk-tag">Tasks.chunk</span>
            <span className="opt-chunk-tag">Contact.chunk</span>
          </div>
        </div>

        {/* Suspense boundary wrapped strictly around Routes as guided by syllabus */}
        <Suspense fallback={<RouteLoadingFallback message="Loading route module..." />}>
          <Routes>
            <Route path="/" element={<Home studentInfo={studentInfo} skills={skills} />} />
            <Route path="/tasks" element={<TaskManager />} />
            <Route path="/projects" element={<Projects projectList={projects} />} />
            <Route path="/contact" element={<Contact studentInfo={studentInfo} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      {/* Academic Footer */}
      <Footer
        studentId={studentInfo.id}
        academicYear={studentInfo.academicYear}
        email={studentInfo.email}
        githubUrl={studentInfo.githubUrl}
      />
    </div>
  );
}

export default App;

