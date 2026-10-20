import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import ErrorMessage from './ErrorMessage';

function Projects({ projectList }) {
  // 3 Core state variables as per lab step 1
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Supplementary states: Search filter & Error simulation toggle
  const [searchQuery, setSearchQuery] = useState('');
  const [simulateError, setSimulateError] = useState(false);

  const username = '24CS048Manav';

  const fetchRepositories = () => {
    setLoading(true);
    setError(null);

    // If simulateError is true, hit an invalid endpoint to demonstrate error handling
    const apiUrl = simulateError
      ? 'https://api.github.com/users/non-existent-user-error-test-404/repos'
      : `https://api.github.com/users/${username}/repos?sort=updated&per_page=30`;

    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`GitHub API Error: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setRepos(data);
        } else {
          throw new Error('Invalid response format received from API');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch repositories.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Step 2: Use useEffect to fetch data on component mount
  useEffect(() => {
    fetchRepositories();
  }, [simulateError]);

  // Filter repositories based on search input
  const filteredRepos = repos.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <section id="projects" className="section-card projects-container">
      <div className="projects-header-row">
        <div>
          <h2 className="section-heading">Projects & GitHub Repositories</h2>
          <p className="section-subtext">
            Dynamic REST API data fetched from GitHub (<code>api.github.com/users/{username}/repos</code>)
          </p>
        </div>

        {/* API State Controls for Lab Testing */}
        <div className="api-controls">
          <button
            type="button"
            className={`control-toggle-btn ${simulateError ? 'active-error' : ''}`}
            onClick={() => setSimulateError(!simulateError)}
            title="Toggle between real GitHub API and simulated 404 error endpoint"
          >
            {simulateError ? '✓ Restore Live API' : '⚡ Simulate Error State'}
          </button>
        </div>
      </div>

      {/* Search Filter Input (Supplementary Problem) */}
      <div className="repo-search-bar">
        <input
          type="text"
          placeholder="🔍 Search repositories by name or topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => setSearchQuery('')}
          >
            Clear
          </button>
        )}
      </div>

      {/* Conditional Rendering: Loading, Error, or Success */}
      {loading && <Spinner message="Connecting to GitHub REST API..." />}

      {!loading && error && (
        <ErrorMessage
          message={error}
          onRetry={fetchRepositories}
        />
      )}

      {!loading && !error && (
        <>
          <div className="repo-stats-summary">
            <span>Showing <strong>{filteredRepos.length}</strong> of <strong>{repos.length}</strong> repositories</span>
            {searchQuery && <span> (filtered by "{searchQuery}")</span>}
          </div>

          {filteredRepos.length === 0 ? (
            <div className="no-results-box">
              <p>No repositories match "<strong>{searchQuery}</strong>".</p>
              <button
                type="button"
                className="action-btn-small"
                onClick={() => setSearchQuery('')}
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="repos-grid">
              {filteredRepos.map((repo) => (
                <div key={repo.id} className="repo-card">
                  <div className="repo-card-top">
                    <h3 className="repo-title">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="repo-link"
                      >
                        {repo.name}
                      </a>
                    </h3>

                    {/* Star count alongside repository name (Supplementary Problem) */}
                    <span className="repo-stars" title={`${repo.stargazers_count} stargazers`}>
                      ★ {repo.stargazers_count}
                    </span>
                  </div>

                  <p className="repo-description">
                    {repo.description || 'Academic / practical coursework project repository.'}
                  </p>

                  <div className="repo-footer">
                    <span className="repo-lang-badge">
                      {repo.language || 'JavaScript'}
                    </span>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-code-link"
                    >
                      View on GitHub →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Coursework Connected Roadmap Context */}
      {projectList && projectList.length > 0 && (
        <div className="coursework-section">
          <h3 className="coursework-title">Curriculum Project Milestones</h3>
          <div className="milestones-row">
            {projectList.map((p, idx) => (
              <div key={idx} className="milestone-chip">
                <strong>{p.title}</strong>
                <span>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default Projects;
