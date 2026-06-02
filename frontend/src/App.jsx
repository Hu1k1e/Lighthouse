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

  const [activeTab, setActiveTab] = useState('dashboard');

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
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</div>
          <div className={`nav-item ${activeTab === 'containers' ? 'active' : ''}`} onClick={() => setActiveTab('containers')}>Containers</div>
          <div className={`nav-item ${activeTab === 'triggers' ? 'active' : ''}`} onClick={() => setActiveTab('triggers')}>Triggers</div>
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header" style={{ textTransform: 'capitalize' }}>
          <h2>{activeTab}</h2>
        </header>

        {activeTab === 'dashboard' && (
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
            ) : containers.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No containers found. Ensure Docker socket is mounted.</div>
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
        )}

        {activeTab === 'containers' && (
          <div className="page-view">
            <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>All Containers</h3>
            <p style={{ color: 'var(--text-muted)' }}>Manage your local and remote containers here.</p>
            <div className="container-grid">
              {containers.map(c => (
                <div key={c.id} className="container-card">
                  <div className="card-header">
                    <div className="card-title">{c.name}</div>
                    <div className="status-badge" style={{ backgroundColor: c.state === 'running' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)', color: c.state === 'running' ? '#2ecc71' : '#e74c3c' }}>
                      {c.state}
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="info-row">
                      <span className="info-label">Image</span>
                      <span className="info-value" style={{ fontSize: '0.85rem' }}>{c.image}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'triggers' && (
          <div className="page-view">
            <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Notification Triggers</h3>
            <p style={{ color: 'var(--text-muted)' }}>Configure webhooks (Discord, Slack, Email) to run when updates are found.</p>
            <div className="container-card" style={{ marginTop: '20px' }}>
               <div className="card-body">
                  <p style={{ color: 'var(--text-muted)' }}>Backend trigger routing is currently managed via .env variables (e.g., DISCORD_WEBHOOK_URL). UI configuration coming soon.</p>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="page-view">
            <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Settings & Remote Hosts</h3>
            <p style={{ color: 'var(--text-muted)' }}>Link external helper apps to monitor remote servers.</p>
            <div className="container-card" style={{ marginTop: '20px' }}>
               <div className="card-header"><div className="card-title">Add Remote Host</div></div>
               <div className="card-body">
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <input type="text" placeholder="http://192.168.1.50:8305" style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #333', background: 'var(--bg-card)', color: '#fff' }} />
                    <input type="password" placeholder="API Key" style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #333', background: 'var(--bg-card)', color: '#fff' }} />
                    <button className="btn btn-primary">Link</button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
