import React, { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for initial UI before backend is fully hooked up
    setTimeout(() => {
      setContainers([
        { id: '1a2b3c4d', name: 'tracearr-server', image: 'connorgallopo/tracearr:latest', state: 'running', status: 'up-to-date', version: '1.5.0' },
        { id: '5e6f7g8h', name: 'plex-media-server', image: 'plexinc/pms-docker:latest', state: 'running', status: 'update_available', version: '1.32.1', latest: '1.32.2' },
        { id: '9i0j1k2l', name: 'portainer', image: 'portainer/portainer-ce:2.18.4', state: 'running', status: 'up-to-date', version: '2.18.4' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

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
            <button className="btn">Scan Now</button>
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
