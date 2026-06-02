import React, { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/containers')
      .then(res => res.json())
      .then(data => {
        if (data.containers) {
          const mapped = data.containers.map(c => ({
            id: c.id,
            name: c.name,
            image: c.image,
            state: c.state,
            status: 'up-to-date',
            version: c.image.includes(':') ? c.image.split(':')[1] : 'latest'
          }));
          setContainers(mapped);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching containers:", err);
        setLoading(false);
      });
  }, []);

  const handleScan = () => {
    setLoading(true);
    fetch('/api/updates/scan', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.updates) {
          setContainers(prev => prev.map(c => {
            const update = data.updates.find(u => u.container_id === c.id);
            if (update) {
              return { ...c, status: 'update_available', latest: update.latest_version };
            }
            return c;
          }));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error scanning:", err);
        setLoading(false);
      });
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h1>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            <line x1="6" y1="6" x2="6.01" y2="6"></line>
            <line x1="6" y1="18" x2="6.01" y2="18"></line>
          </svg>
          Update Checker
        </h1>
        <nav className="sidebar-nav">
          <div className="nav-item active">Dashboard</div>
          <div className="nav-item">Containers</div>
          <div className="nav-item">Triggers</div>
          <div className="nav-item">Settings</div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <h2>Dashboard</h2>
        </header>

        <div className="dashboard">
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Containers</span>
              <span className="stat-value">{containers.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Updates Available</span>
              <span className="stat-value" style={{ color: 'var(--accent-color)' }}>
                {containers.filter(c => c.status === 'update_available').length}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Remote Hosts</span>
              <span className="stat-value">1</span>
            </div>
          </div>

          {/* Containers List */}
          <div className="section-title">
            <span>Watched Containers</span>
            <button className="btn" onClick={handleScan} disabled={loading}>
              {loading ? 'Scanning...' : 'Scan Now'}
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading containers...</div>
          ) : (
            <div className="container-grid">
              {containers.map((container) => (
                <div key={container.id} className="container-card">
                  <div className="card-header">
                    <div className="card-title">{container.name}</div>
                    <div className={`status-badge ${container.status === 'update_available' ? 'update' : ''}`}>
                      {container.status === 'update_available' ? 'Update Available' : 'Up to Date'}
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="info-row">
                      <span className="info-label">Image</span>
                      <span className="info-value">{container.image.split(':')[0]}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Current Version</span>
                      <span className="info-value">{container.version}</span>
                    </div>
                    {container.status === 'update_available' && (
                      <div className="info-row">
                        <span className="info-label">Latest Version</span>
                        <span className="info-value" style={{ color: 'var(--accent-color)' }}>{container.latest}</span>
                      </div>
                    )}
                  </div>
                  <div className="card-footer">
                    {container.status === 'update_available' ? (
                      <button className="btn btn-primary" style={{ width: '100%' }}>View Changelog</button>
                    ) : (
                      <button className="btn" style={{ width: '100%' }}>Details</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
