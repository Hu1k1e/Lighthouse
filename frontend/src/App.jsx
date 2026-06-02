import React, { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [remoteReleases, setRemoteReleases] = useState([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [triggers, setTriggers] = useState({ discord: '', ntfy: '' });

  useEffect(() => {
    fetch('/api/containers/')
      .then(res => res.json())
      .then(data => {
        if (data.containers) {
          const mapped = data.containers.map(c => ({
            id: c.id,
            name: c.name,
            image: c.image,
            state: c.state,
            status: c.status || 'up-to-date',
            version: c.image.includes(':') ? c.image.split(':')[1] : 'latest',
            digest: c.digest,
            latest: c.latest
          }));
          setContainers(mapped);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching containers:", err);
        setLoading(false);
      });

    fetch('/api/settings/triggers')
      .then(res => res.json())
      .then(data => {
        if (data.triggers) {
          const tMap = { discord: '', ntfy: '' };
          data.triggers.forEach(t => {
            if (t.enabled) tMap[t.platform] = t.webhook_url;
          });
          setTriggers(tMap);
        }
      })
      .catch(err => console.error("Error fetching triggers:", err));
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

  const saveTrigger = (platform, url) => {
    fetch('/api/settings/triggers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, webhook_url: url, enabled: url.length > 0 })
    })
    .then(res => res.json())
    .then(() => alert(`${platform.toUpperCase()} trigger saved!`))
    .catch(err => console.error(err));
  };

  const [activeTab, setActiveTab] = useState('dashboard');

  const filteredContainers = containers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.image.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'updates') return matchesSearch && c.status === 'update_available';
    if (filter === 'uptodate') return matchesSearch && c.status === 'up-to-date';
    return matchesSearch;
  });

  const openDetails = (container) => {
    setSelectedContainer(container);
    setHistoryLoading(true);
    setRemoteLoading(true);
    
    fetch(`/api/containers/${container.id}/history`)
      .then(res => res.json())
      .then(data => {
        setHistory(data.history || []);
        setHistoryLoading(false);
      })
      .catch(err => {
        console.error(err);
        setHistoryLoading(false);
      });
      
    fetch(`/api/releases/${encodeURIComponent(container.image)}`)
      .then(res => res.json())
      .then(data => {
        setRemoteReleases(data.releases || []);
        setRemoteLoading(false);
      })
      .catch(err => {
        console.error("Error fetching remote releases:", err);
        setRemoteLoading(false);
      });
  };

  const closeModal = () => {
    setSelectedContainer(null);
    setHistory([]);
    setRemoteReleases([]);
  };

  const getRepoLink = (image) => {
    const imgNoTag = image.split(':')[0];
    if (imgNoTag.includes('ghcr.io')) {
      return `https://${imgNoTag.replace('ghcr.io', 'github.com')}`;
    }
    if (!imgNoTag.includes('/')) {
      return `https://hub.docker.com/_/${imgNoTag}`;
    }
    return `https://hub.docker.com/r/${imgNoTag}`;
  };

  const getGithubSearchLink = (image) => {
    const imgNoTag = image.split(':')[0];
    if (imgNoTag.includes('ghcr.io')) {
      return `https://${imgNoTag.replace('ghcr.io', 'github.com')}`;
    }
    const cleanName = imgNoTag.replace('lscr.io/linuxserver/', '').replace(/.*\//, '');
    return `https://github.com/search?q=${cleanName}&type=repositories`;
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
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select 
                  className="filter-select"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="updates">Updates Available</option>
                  <option value="uptodate">Up to Date</option>
                </select>
                <button className="btn" onClick={handleScan} disabled={loading}>
                  {loading ? 'Scanning...' : 'Scan Now'}
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading containers...</div>
            ) : filteredContainers.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No containers found matching your criteria.</div>
            ) : (
              <div className="container-grid">
                {filteredContainers.map((container) => (
                  <div key={container.id} className="container-card clickable-card" onClick={() => openDetails(container)}>
                    <div className="card-header">
                      <div className="card-title">{container.name}</div>
                      <div className={`status-badge ${container.status === 'update_available' ? 'update' : ''}`}>
                        {container.status === 'update_available' ? 'Update Available' : 'Up to Date'}
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="info-row">
                        <span className="info-label">Image</span>
                        <span className="info-value" style={{fontSize: '0.85rem'}}>{container.image.split(':')[0]}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Current Version</span>
                        <span className="info-value">
                          {container.version === 'latest' && container.digest ? `latest (${container.digest.substring(0, 12)})` : container.version}
                        </span>
                      </div>
                      {container.status === 'update_available' && (
                        <div className="info-row">
                          <span className="info-label">Latest Version</span>
                          <span className="info-value" style={{ color: 'var(--accent-color)' }}>{container.latest}</span>
                        </div>
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
            <p style={{ color: 'var(--text-muted)' }}>Configure webhooks (Discord, NTFY) to run when updates are found.</p>
            
            <div className="container-card" style={{ marginTop: '20px' }}>
               <div className="card-header"><div className="card-title">Discord Webhook</div></div>
               <div className="card-body">
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="https://discord.com/api/webhooks/..." 
                      className="search-input" 
                      style={{ flex: 1 }}
                      value={triggers.discord}
                      onChange={e => setTriggers({ ...triggers, discord: e.target.value })}
                    />
                    <button className="btn btn-primary" onClick={() => saveTrigger('discord', triggers.discord)}>Save</button>
                  </div>
               </div>
            </div>

            <div className="container-card" style={{ marginTop: '20px' }}>
               <div className="card-header"><div className="card-title">NTFY Webhook</div></div>
               <div className="card-body">
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="https://ntfy.sh/mytopic" 
                      className="search-input" 
                      style={{ flex: 1 }}
                      value={triggers.ntfy}
                      onChange={e => setTriggers({ ...triggers, ntfy: e.target.value })}
                    />
                    <button className="btn btn-primary" onClick={() => saveTrigger('ntfy', triggers.ntfy)}>Save</button>
                  </div>
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
                    <input type="text" placeholder="http://192.168.1.50:8305" className="search-input" style={{ flex: 1 }} />
                    <input type="password" placeholder="API Key" className="search-input" style={{ flex: 1 }} />
                    <button className="btn btn-primary">Link</button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Details Modal */}
      {selectedContainer && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedContainer.name}</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="info-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
                <span className="info-label">Image</span>
                <span className="info-value" style={{ userSelect: 'all' }}>{selectedContainer.image}</span>
              </div>
              <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <a href={getRepoLink(selectedContainer.image)} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                  View Repository
                </a>
                <a href={getGithubSearchLink(selectedContainer.image)} target="_blank" rel="noreferrer" className="btn" style={{ textDecoration: 'none' }}>
                  <svg style={{marginRight: '6px'}} height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
                    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27-.01-1.13-.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.46-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
                  </svg>
                  Search GitHub
                </a>
              </div>
              
              <h4 style={{ marginBottom: '10px', color: 'var(--text-main)' }}>Update History</h4>
              {historyLoading ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading history...</div>
              ) : history.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No updates recorded yet.</div>
              ) : (
                <div className="history-list">
                  {history.map((h, i) => {
                    const isCurrent = selectedContainer.version === 'latest' 
                      ? h.digest === selectedContainer.digest 
                      : h.version === selectedContainer.version;

                    return (
                      <div key={i} className={`history-item ${isCurrent ? 'history-item-current' : ''}`}>
                        <div className="history-header">
                          <span className="history-version">
                            {h.version} 
                            {isCurrent && <span className="current-badge">✓ Currently Installed</span>}
                          </span>
                          <span className="history-date">{new Date(h.timestamp).toLocaleString()}</span>
                        </div>
                        {h.digest && <div className="history-digest" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Digest: {h.digest.substring(0, 15)}...</div>}
                        <p className="history-changelog">{h.changelog}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              <h4 style={{ marginBottom: '10px', color: 'var(--text-main)', marginTop: '20px' }}>Remote Version History</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Global releases and tags available for this container.</p>
              {remoteLoading ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Fetching remote tags...</div>
              ) : remoteReleases.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No remote history available.</div>
              ) : (
                <div className="history-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {remoteReleases.map((r, i) => (
                    <div key={`remote-${i}`} className="history-item">
                      <div className="history-header">
                        <span className="history-version">{r.version}</span>
                        <span className="history-date">{r.timestamp ? new Date(r.timestamp).toLocaleString() : ''}</span>
                      </div>
                      <p className="history-changelog">{r.changelog}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
