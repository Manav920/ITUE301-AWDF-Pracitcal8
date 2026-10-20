# ITUE301 - Advanced Web Development Frameworks
## Practical 5: MongoDB Integration and Schema Design with Mongoose

### Student Details
- **Student ID:** 24CS048
- **Student Name:** Manav Lathiya
- **Subject Code & Name:** CSE304 / ITUE301: Advanced Web Development Frameworks
- **Department:** Department of Computer Science and Engineering
- **Institution:** Chandubhai S Patel Institute of Technology (CSPIT), CHARUSAT
- **Academic Year:** 2025-26

---

### Aim
To connect a MongoDB database to an Express server using the Mongoose ODM, design a validated Mongoose schema with constraints and pre-save lifecycle hooks, and implement persistent CRUD operations with structured error responses.

---

### Mongoose Schema Design (`models/Task.js`)

| Field | Type | Constraints & Rules | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`title`** | `String` | `required: true`, minlength: 3, maxlength: 120 | *None* | Task title; automatically trimmed via pre-save hook |
| **`description`** | `String` | maxlength: 500 | `""` | Optional task overview / details |
| **`completed`** | `Boolean`| Must be boolean | `false` | Status toggle for task completion |
| **`priority`** | `String` | Enum: `['low', 'medium', 'high']` | `'medium'` | Task urgency restricted to enum values |
| **`category`** | `String` | String, trimmed | `'Coursework'` | Categorization linking practical modules |
| **`createdAt`** | `Date` | Timestamp | `Date.now` | Creation timestamp |

---

### Key Features Implemented

1. **Persistent MongoDB Connection via Mongoose**:
   - Asynchronous `mongoose.connect(process.env.MONGO_URI)` pipeline with connection error handling.
   - Initial database auto-seeding with connected coursework practical tasks (Prac 1 to Prac 5).
2. **Schema-Level Validation & Pre-Save Hook**:
   - `pre('save')` lifecycle hook automatically trims leading/trailing whitespace before writing to MongoDB.
   - Enum constraint on `priority` (`low`, `medium`, `high`).
3. **Structured Validation Errors**:
   - Centralized error handler captures Mongoose `ValidationError` and transforms raw internal errors into clean, readable JSON:
     ```json
     {
       "success": false,
       "error": "Schema Validation Error",
       "message": "One or more required fields failed Mongoose schema validation",
       "validationErrors": {
         "title": "Task title is required",
         "priority": "urgent is not a valid priority. Must be low, medium, or high"
       }
     }
     ```
4. **ObjectId Validation & 404 Handling**:
   - `validateObjectId` middleware validates 24-character hexadecimal IDs before database queries.
   - Proper `404 Not Found` responses when documents do not exist.

---

### Setup & Execution

#### Prerequisites
- Node.js (v18+)
- MongoDB Community Server (running locally at `mongodb://127.0.0.1:27017`) or MongoDB Atlas URI

#### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Inside `.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/task_manager_24cs048
```

#### 2. Install Dependencies & Start
```bash
npm install
npm start
```
The server will start at `http://localhost:5000` and connect to MongoDB.

---

### Testing Endpoints via cURL / Postman / PowerShell

```powershell
# 1. GET all tasks (Read)
curl http://localhost:5000/tasks

# 2. POST create task with valid schema (Create)
curl -X POST http://localhost:5000/tasks `
  -H "Content-Type: application/json" `
  -d '{"title": "Implement JWT Authentication (Prac 6)", "priority": "high", "completed": false}'

# 3. POST test schema validation failure (missing title, invalid priority)
curl -X POST http://localhost:5000/tasks `
  -H "Content-Type: application/json" `
  -d '{"priority": "ultra-critical"}'

# 4. GET task by ID (Read Single)
curl http://localhost:5000/tasks/<TASK_ID>

# 5. PUT update task status (Update)
curl -X PUT http://localhost:5000/tasks/<TASK_ID> `
  -H "Content-Type: application/json" `
  -d '{"completed": true, "priority": "medium"}'

# 6. DELETE task (Delete)
curl -X DELETE http://localhost:5000/tasks/<TASK_ID>
```
