import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  loginUser,
  registerUser,
  getMe,
  getStoredToken,
  removeStoredToken,
} from '../api';
import Spinner from './Spinner';
import ErrorMessage from './ErrorMessage';
import Toast from './Toast';

// =======================================================================
// PRACTICAL 8 (Supplementary 1): On-Demand Dynamic Lazy Loading
// Heavy visual analytics module loaded only when user requests it.
// =======================================================================
const TaskAnalytics = lazy(() => import('./TaskAnalytics'));

// =======================================================================
// PRACTICAL 8 (Supplementary 3): Component Memoization (React.memo)
// Prevents unnecessary re-renders of task list items when searching/typing.
// =======================================================================
const TaskItem = React.memo(function TaskItem({
  task,
  onToggleComplete,
  onRequestDelete,
}) {
  return (
    <div
      className={`task-item-card ${task.completed ? 'completed' : ''} ${task.isOptimistic ? 'optimistic-syncing' : ''}`}
    >
      <div className="task-checkbox-col">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggleComplete(task)}
          className="task-check"
          aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
        />
      </div>

      <div className="task-body-col">
        <div className="task-title-line">
          <span className={`task-title-text ${task.completed ? 'strikethrough' : ''}`}>
            {task.title}
          </span>
          {task.isOptimistic && <span className="syncing-badge">⚡ Syncing...</span>}
          <span className={`priority-badge priority-${task.priority}`}>
            {task.priority}
          </span>
          <span className="category-badge">{task.category}</span>
        </div>

        {task.description && <p className="task-desc-text">{task.description}</p>}

        <div className="task-meta-line">
          <span className="meta-id">ID: <code>{task._id}</code></span>
          <span className="meta-date">{new Date(task.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="task-actions-col">
        <button
          type="button"
          className="delete-task-btn"
          onClick={() => onRequestDelete(task)}
          title="Delete task from MongoDB"
        >
          🗑️
        </button>
      </div>
    </div>
  );
});

function TaskManager() {
  const [token, setToken] = useState(getStoredToken());
  const [currentUser, setCurrentUser] = useState(null);

  // Lazy Analytics visibility state (Practical 8)
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Auth Form State
  const [isRegistering, setIsRegistering] = useState(false);
  const [authForm, setAuthForm] = useState({
    name: 'Manav Lathiya',
    email: '24cs048@charusat.edu.in',
    password: 'password123',
  });
  const [authLoading, setAuthLoading] = useState(false);


  // Tasks State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Task Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'Practical 7',
  });
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast & Modal
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showMeModal, setShowMeModal] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Check auth and load profile on mount
  useEffect(() => {
    if (token) {
      loadUserProfileAndTasks();
    }

    const handleAuthExpired = (e) => {
      setToken(null);
      setCurrentUser(null);
      setTasks([]);
      showToast(e.detail || 'Session expired. Please log in again.', 'error');
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [token]);

  const loadUserProfileAndTasks = async () => {
    try {
      const meRes = await getMe();
      if (meRes && meRes.user) {
        setCurrentUser(meRes.user);
      }
      fetchTasksList();
    } catch (err) {
      setToken(null);
      setCurrentUser(null);
    }
  };

  const fetchTasksList = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTasks();
      if (response && response.data) {
        setTasks(response.data);
      }
    } catch (err) {
      setError(err.message || 'Unable to fetch protected tasks');
    } finally {
      setLoading(false);
    }
  };

  // Auth Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      let res;
      if (isRegistering) {
        res = await registerUser(authForm.name, authForm.email, authForm.password);
        showToast('Registration successful! JWT issued.', 'success');
      } else {
        res = await loginUser(authForm.email, authForm.password);
        showToast('Login successful! Authorized to access MongoDB.', 'success');
      }
      setToken(res.token);
      setCurrentUser(res.user);
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    removeStoredToken();
    setToken(null);
    setCurrentUser(null);
    setTasks([]);
    showToast('Logged out successfully. JWT token cleared.', 'success');
  };

  const fillDemoCredentials = () => {
    setAuthForm({
      name: 'Manav Lathiya',
      email: '24cs048@charusat.edu.in',
      password: 'password123',
    });
    setIsRegistering(false);
    showToast('Demo credentials auto-filled!', 'success');
  };

  // Task Creation (Optimistic)
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Task title is required', 'error');
      return;
    }

    const trimmedTitle = formData.title.trim();
    const tempId = `temp-${Date.now()}`;

    const optimisticTask = {
      _id: tempId,
      title: trimmedTitle,
      description: formData.description.trim(),
      priority: formData.priority,
      category: formData.category || 'Practical 7',
      completed: false,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    setTasks((prev) => [optimisticTask, ...prev]);
    setFormData({ title: '', description: '', priority: 'medium', category: 'Practical 7' });
    setSubmitting(true);

    try {
      const res = await createTask({
        title: trimmedTitle,
        description: optimisticTask.description,
        priority: optimisticTask.priority,
        category: optimisticTask.category,
      });

      setTasks((prev) =>
        prev.map((t) => (t._id === tempId ? res.data : t))
      );
      showToast(`Protected task saved to MongoDB!`, 'success');
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t._id !== tempId));
      showToast(`Creation error: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Completion (PUT /tasks/:id) - Memoized with useCallback
  const handleToggleComplete = useCallback(async (task) => {
    const updatedStatus = !task.completed;
    setTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, completed: updatedStatus } : t))
    );

    try {
      const res = await updateTask(task._id, { completed: updatedStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? res.data : t))
      );
      showToast(`Status updated in MongoDB!`, 'success');
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, completed: !updatedStatus } : t))
      );
      showToast(`Update error: ${err.message}`, 'error');
    }
  }, []);

  // Delete Task with Confirmation
  const confirmDelete = async () => {
    if (!taskToDelete) return;
    const { _id, title } = taskToDelete;
    setTaskToDelete(null);

    const prevTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t._id !== _id));

    try {
      await deleteTask(_id);
      showToast(`Task deleted from MongoDB`, 'success');
    } catch (err) {
      setTasks(prevTasks);
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  // Memoized task deletion trigger
  const handleRequestDelete = useCallback((task) => {
    setTaskToDelete(task);
  }, []);

  // Performance Optimization: Derived filtered list computed with useMemo
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesPriority && matchesSearch;
    });
  }, [tasks, filterPriority, searchQuery]);


  return (
    <div className="task-manager-container">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      {/* Authentication Banner / User Session Panel */}
      {token && currentUser ? (
        <div className="auth-session-card">
          <div className="user-profile-info">
            <span className="user-avatar">👤</span>
            <div>
              <h3 className="user-name">{currentUser.name}</h3>
              <p className="user-email">{currentUser.email}</p>
            </div>
            <span className="jwt-badge">🛡️ JWT Active (1h Expiry)</span>
          </div>

          <div className="auth-actions">
            <button
              type="button"
              className="action-btn-small btn-secondary"
              onClick={() => setShowMeModal(true)}
              title="Inspect decoded JWT details via GET /me"
            >
              🔍 Inspect /me
            </button>
            <button
              type="button"
              className="action-btn-small btn-logout"
              onClick={handleLogout}
              title="Clear JWT token from localStorage"
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div className="section-card auth-gateway-card">
          <div className="auth-gateway-header">
            <span className="lock-icon">🔒</span>
            <h2>JWT Authentication Required (Practical 7)</h2>
            <p>
              Task routes are protected by Express authentication middleware.
              Sign in or register to receive a signed JSON Web Token and access MongoDB tasks.
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {isRegistering && (
              <div className="form-group">
                <label>Full Name:</label>
                <input
                  type="text"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Email Address:</label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label>Password (bcrypt hashed):</label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="auth-btn-row">
              <button type="submit" className="action-btn" disabled={authLoading}>
                {authLoading ? 'Verifying...' : isRegistering ? 'Create Account & Sign In' : 'Sign In with JWT'}
              </button>

              <button
                type="button"
                className="action-btn-small btn-demo"
                onClick={fillDemoCredentials}
              >
                ⚡ Fill Demo Account
              </button>

              <button
                type="button"
                className="toggle-auth-btn"
                onClick={() => setIsRegistering(!isRegistering)}
              >
                {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Protected Task Section (Only visible when authenticated) */}
      {token && (
        <>
          {/* Create Task Form */}
          <div className="section-card">
            <h2 className="section-heading">Create Protected Task (MongoDB + JWT)</h2>
            <p className="section-subtext">
              Every request is verified via <code>Authorization: Bearer &lt;token&gt;</code> before database execution.
            </p>

            <form onSubmit={handleCreateTask} className="task-create-form">
              <div className="form-row">
                <div className="form-group flex-2">
                  <label htmlFor="taskTitle">Task Title (Server-side validated):</label>
                  <input
                    id="taskTitle"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Implement Role-Based Access Control"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group flex-1">
                  <label htmlFor="taskPriority">Priority:</label>
                  <select
                    id="taskPriority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="form-input select-input"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-2">
                  <label htmlFor="taskDesc">Description:</label>
                  <input
                    id="taskDesc"
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Details about task objectives"
                    className="form-input"
                  />
                </div>

                <div className="form-group flex-1">
                  <label htmlFor="taskCategory">Category:</label>
                  <input
                    id="taskCategory"
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <button type="submit" className="action-btn" disabled={submitting}>
                {submitting ? 'Saving...' : '+ Add Protected Task'}
              </button>
            </form>
          </div>

          {/* Tasks List */}
          <div className="section-card">
            <div className="tasks-header-row">
              <div>
                <h2 className="section-heading">Your Authenticated Tasks</h2>
                <p className="section-subtext">
                  Isolated to user: <strong>{currentUser?.email}</strong> in MongoDB.
                </p>
              </div>

              <div className="tasks-filters">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input-small"
                />
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {loading && <Spinner message="Verifying JWT & fetching user tasks from MongoDB..." />}
            {!loading && error && <ErrorMessage message={error} onRetry={fetchTasksList} />}

            {!loading && !error && (
              <>
                <div className="task-stats-bar">
                  <span>Total: <strong>{tasks.length}</strong> tasks</span>
                  <span>
                    Completed: <strong>{tasks.filter((t) => t.completed).length}</strong> / {tasks.length}
                  </span>
                  <button
                    type="button"
                    className="btn-analytics action-btn-small"
                    onClick={() => setShowAnalytics((prev) => !prev)}
                    title="Practical 8: Lazy load analytics chunk on-demand via React.lazy"
                  >
                    📊 {showAnalytics ? 'Hide Analytics' : 'View Analytics (Chunk Demo)'}
                  </button>
                </div>

                {/* Practical 8 (Supplementary 1): On-Demand Component Lazy Loading */}
                {showAnalytics && (
                  <Suspense
                    fallback={
                      <div className="analytics-loading-skeleton" role="status">
                        <div className="fallback-spinner-core" style={{ width: 22, height: 22 }}></div>
                        <span>⚡ Dynamically loading TaskAnalytics chunk via React.lazy()...</span>
                      </div>
                    }
                  >
                    <TaskAnalytics tasks={tasks} onClose={() => setShowAnalytics(false)} />
                  </Suspense>
                )}

                {filteredTasks.length === 0 ? (
                  <div className="no-tasks-box">
                    <p>No tasks found. Use the form above to add a new task!</p>
                  </div>
                ) : (
                  <div className="tasks-list">
                    {filteredTasks.map((task) => (
                      <TaskItem
                        key={task._id}
                        task={task}
                        onToggleComplete={handleToggleComplete}
                        onRequestDelete={handleRequestDelete}
                      />
                    ))}
                  </div>
                )}

              </>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3 className="modal-title">Confirm Deletion</h3>
            <p className="modal-text">
              Are you sure you want to delete task <strong>"{taskToDelete.title}"</strong> from MongoDB?
            </p>
            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={() => setTaskToDelete(null)}>
                Cancel
              </button>
              <button type="button" className="confirm-delete-btn" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* /me Profile Modal (Supplementary Problem 1) */}
      {showMeModal && currentUser && (
        <div className="modal-overlay" onClick={() => setShowMeModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title" style={{ color: '#2563eb' }}>
              🛡️ Decoded JWT Profile (GET /me)
            </h3>
            <div className="me-details-box">
              <p><strong>Name:</strong> {currentUser.name}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>MongoDB User ID:</strong> <code>{currentUser._id}</code></p>
              <p><strong>Created At:</strong> {new Date(currentUser.createdAt).toLocaleString()}</p>
              <p><strong>Auth Method:</strong> Bearer Token (JSON Web Token)</p>
            </div>
            <div className="modal-actions">
              <button type="button" className="action-btn" onClick={() => setShowMeModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskManager;
