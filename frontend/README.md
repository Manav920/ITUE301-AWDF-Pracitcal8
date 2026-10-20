# ITUE301 - Advanced Web Development Frameworks
## Practical 3: API Integration and Data Rendering in React

### Student Details
- **Student ID:** 24CS048
- **Student Name:** Manav Lathiya
- **Subject Code & Name:** CSE304 / ITUE301: Advanced Web Development Frameworks
- **Department:** Department of Computer Science and Engineering
- **Institution:** Chandubhai S Patel Institute of Technology (CSPIT), CHARUSAT
- **Academic Year:** 2025-26

---

### Aim
To consume a public REST API in React using the `fetch` API, execute network requests on component mount using `useEffect`, and handle all asynchronous states (loading, error, and success) with appropriate user feedback.

---

### Application Architecture
```text
Projects.jsx
 ├── useEffect()                → triggers fetch on component mount with dependency array []
 ├── useState                   → repos (data), loading, error, searchQuery, simulateError
 ├── [loading == true]          → <Spinner />
 ├── [error != null]            → <ErrorMessage message={error} onRetry={fetchRepositories} />
 └── [success]                  → <RepoList data={filteredRepos} />
      ├── Search & Filter Input → Dynamic query filtering by repository name
      ├── Star Count Badge      → Displays repository stargazers count
      ├── Language Tag & Link   → Direct link to GitHub repository
      └── Simulate Error Toggle → Interactive testing of error state and retry mechanism
```

---

### API Details & Endpoints
- **Public REST API:** GitHub REST API v3
- **Primary Endpoint:** `https://api.github.com/users/24CS048Manav/repos?sort=updated&per_page=30`
- **Authentication:** Unauthenticated public rate limit (60 requests/hour)
- **Features Tested:**
  1. **Loading State:** CSS animated circular spinner displayed while promise is pending.
  2. **Success State:** Dynamic mapping of live repositories with name, star count, language badge, and external links.
  3. **Error State & Recovery:** Try/catch error boundary with a live **"Simulate Error State"** toggle and a **"Retry API Request"** button.
  4. **Search Filter:** Real-time client-side filtering by repository title/description.

---

### Getting Started

#### Prerequisites
- Node.js (v18+)
- npm (v9+)

#### Installation & Execution
```bash
# 1. Clone repository
git clone https://github.com/24CS048Manav/ITUE301-AWDF_Practical3.git
cd ITUE301-AWDF_Practical3

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The application runs at `http://localhost:5173`.
Navigate to `/projects` to view the live GitHub API integration.
