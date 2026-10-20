require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Task = require('./models/Task');
const auth = require('./middleware/auth');
const { validateTask, validateRegister, validateLogin } = require('./middleware/validate');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/task_manager_24cs048';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_24cs048_manav_practical7';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// ==========================================
// 1. Connect to MongoDB using Mongoose
// ==========================================
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log(`=========================================`);
    console.log(`MongoDB connected successfully`);
    console.log(`Database: ${mongoose.connection.name}`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`=========================================`);
    await seedDemoUserAndTasks();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

// Seed default demo student user & tasks for instant verification
async function seedDemoUserAndTasks() {
  try {
    let demoUser = await User.findOne({ email: '24cs048@charusat.edu.in' });
    if (!demoUser) {
      console.log('Creating default demo user for Practical 7...');
      demoUser = await User.create({
        name: 'Manav Lathiya',
        email: '24cs048@charusat.edu.in',
        password: 'password123',
      });
      console.log('Demo user created: 24cs048@charusat.edu.in / password123');
    }

    const taskCount = await Task.countDocuments({ user: demoUser._id });
    if (taskCount === 0) {
      console.log('Seeding initial authenticated tasks...');
      await Task.insertMany([
        {
          title: 'Implement JWT Authentication & User Model',
          description: 'Hash passwords with bcrypt and sign JWT tokens with 1h expiration',
          completed: true,
          priority: 'high',
          category: 'Practical 7',
          user: demoUser._id,
        },
        {
          title: 'Protect Task Routes with Auth Middleware',
          description: 'Verify Authorization Bearer token and inject req.user into request context',
          completed: true,
          priority: 'high',
          category: 'Practical 7',
          user: demoUser._id,
        },
        {
          title: 'Add Server-Side Input Validation Pipeline',
          description: 'Intercept malformed payloads before database operations',
          completed: false,
          priority: 'medium',
          category: 'Validation',
          user: demoUser._id,
        },
      ]);
      console.log('Authenticated tasks seeded successfully!');
    }
  } catch (err) {
    console.error('Error seeding demo user/tasks:', err.message);
  }
}

// ==========================================
// 2. Global Middleware Pipeline
// ==========================================
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Route-specific ObjectId validator
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format: Expected 24-character hexadecimal MongoDB ObjectId',
    });
  }
  next();
};

// ==========================================
// 3. Authentication Routes
// ==========================================

// POST /register - Register a new user with hashed password
app.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Registration Error: An account with this email already exists',
      });
    }

    // User.create automatically hashes password via pre-save hook
    const user = await User.create({ name, email, password });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
});

// POST /login - Authenticate user, compare bcrypt password hash, and return JWT
app.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Credentials: No account found with this email',
      });
    }

    // Compare plain password against bcrypt hash in database
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Credentials: Password is incorrect',
      });
    }

    // Sign JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
});

// GET /me - Supplementary Problem 1: Return currently logged-in user details
app.get('/me', auth, async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authorized user profile retrieved from decoded JWT',
    user: req.user,
  });
});

// ==========================================
// 4. Protected Task Routes (Secured via auth middleware)
// ==========================================

// GET /tasks - Fetch user's tasks from MongoDB
app.get('/tasks', auth, async (req, res, next) => {
  try {
    const { completed, priority, search } = req.query;
    const filter = { user: req.user._id };

    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }

    if (priority) {
      filter.priority = priority.toLowerCase();
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:id - Fetch single task by ID
app.get('/tasks/:id', auth, validateObjectId, async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task not found with ID ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (err) {
    next(err);
  }
});

// POST /tasks - Create task (Protected + Input Validation)
app.post('/tasks', auth, validateTask, async (req, res, next) => {
  try {
    const newTask = await Task.create({
      ...req.body,
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully in MongoDB under authenticated user',
      data: newTask,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /tasks/:id - Update task (Protected)
app.put('/tasks/:id', auth, validateObjectId, async (req, res, next) => {
  try {
    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        error: `Task not found with ID ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:id - Delete task (Protected)
app.delete('/tasks/:id', auth, validateObjectId, async (req, res, next) => {
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        error: `Task not found with ID ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully from MongoDB',
      data: deletedTask,
    });
  } catch (err) {
    next(err);
  }
});

// Root route - API overview & health check
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'ITUE301 Practical 7: Authentication & Middleware Pipeline API',
    student: 'Manav Lathiya (24CS048)',
    authEndpoints: {
      register: 'POST /register',
      login: 'POST /login',
      getProfile: 'GET /me (Protected)',
    },
    taskEndpoints: {
      getTasks: 'GET /tasks (Protected: Bearer <token>)',
      createTask: 'POST /tasks (Protected: Bearer <token>)',
      updateTask: 'PUT /tasks/:id (Protected)',
      deleteTask: 'DELETE /tasks/:id (Protected)',
    },
    demoCredentials: {
      email: '24cs048@charusat.edu.in',
      password: 'password123',
    },
  });
});

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Centralized Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[Error Handler] ${err.name}: ${err.message}`);

  if (err.name === 'ValidationError') {
    const formattedErrors = Object.keys(err.errors).reduce((acc, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
    return res.status(400).json({
      success: false,
      error: 'Schema Validation Error',
      validationErrors: formattedErrors,
    });
  }

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    statusCode,
  });
});

// Server Listener
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
  console.log(`JWT Auth Active (Expiry: ${JWT_EXPIRES_IN})`);
});
