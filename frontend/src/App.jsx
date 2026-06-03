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
  const [remoteHosts, setRemoteHosts] = useState([]);
  const [newHostUrl, setNewHostUrl] = useState('');
  const [newHostApiKey, setNewHostApiKey] = useState('');
  const [currentView, setCurrentView] = useState('list');
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [originTab, setOriginTab] = useState('dashboard');

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
            latest: c.latest,
            changelog: c.changelog
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
      
    fetchRemoteHosts();
  }, []);

  const fetchRemoteHosts = () => {
    fetch('/api/settings/remote-hosts')
      .then(res => res.json())
      .then(data => setRemoteHosts(data.hosts || []))
      .catch(err => console.error(err));
  };

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

  const linkRemoteHost = () => {
    if (!newHostUrl) return;
    fetch('/api/settings/remote-hosts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: newHostUrl, api_key: newHostApiKey })
    })
    .then(res => res.json())
    .then(() => {
      setNewHostUrl('');
      setNewHostApiKey('');
      fetchRemoteHosts();
      alert('Remote host linked successfully!');
    })
    .catch(err => console.error(err));
  };

  const deleteRemoteHost = (id) => {
    fetch(`/api/settings/remote-hosts/${id}`, { method: 'DELETE' })
      .then(() => fetchRemoteHosts())
      .catch(err => console.error(err));
  };

  const [activeTab, setActiveTab] = useState('dashboard');

  const filteredContainers = containers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.image.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'updates') return matchesSearch && c.status === 'update_available';
    if (filter === 'uptodate') return matchesSearch && c.status === 'up-to-date';
    return matchesSearch;
  });

  const openDetails = (container, fromTab = 'dashboard') => {
    setSelectedContainer(container);
    setOriginTab(fromTab);
    setCurrentView('releases');
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

  const goBack = () => {
    setCurrentView('list');
    setSelectedContainer(null);
    setHistory([]);
    setRemoteReleases([]);
    setSelectedRelease(null);
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);
    
    if (diffDays > 365) {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
    if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    if (diffDays > 1) {
      return `${diffDays} days ago`;
    }
    if (diffDays === 1) {
      return 'yesterday';
    }
    if (diffHrs >= 1) {
      return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
    }
    if (diffMin >= 1) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    }
    return 'just now';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const rendered = [];
    let currentList = [];
    let listKey = 0;

    const flushList = () => {
      if (currentList.length > 0) {
        rendered.push(
          <ul key={`list-${listKey++}`} className="markdown-list">
            {currentList}
          </ul>
        );
        currentList = [];
      }
    };

    const parseInline = (lineText) => {
      let parts = [{ type: 'text', content: lineText }];
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      
      let processedParts = [];
      for (const part of parts) {
        if (part.type !== 'text') {
          processedParts.push(part);
          continue;
        }

        let lastIndex = 0;
        const codeRegex = /`([^`]+)`/g;
        let cMatch;
        let foundCode = false;

        while ((cMatch = codeRegex.exec(part.content)) !== null) {
          foundCode = true;
          if (cMatch.index > lastIndex) {
            processedParts.push({ type: 'text', content: part.content.substring(lastIndex, cMatch.index) });
          }
          processedParts.push({ type: 'code', content: cMatch[1] });
          lastIndex = codeRegex.lastIndex;
        }

        if (foundCode) {
          if (lastIndex < part.content.length) {
            processedParts.push({ type: 'text', content: part.content.substring(lastIndex) });
          }
        } else {
          processedParts.push(part);
        }
      }
      parts = processedParts;

      processedParts = [];
      for (const part of parts) {
        if (part.type !== 'text') {
          processedParts.push(part);
          continue;
        }

        let lastIndex = 0;
        let lMatch;
        let foundLink = false;
        linkRegex.lastIndex = 0;

        while ((lMatch = linkRegex.exec(part.content)) !== null) {
          foundLink = true;
          if (lMatch.index > lastIndex) {
            processedParts.push({ type: 'text', content: part.content.substring(lastIndex, lMatch.index) });
          }
          processedParts.push({ type: 'link', text: lMatch[1], url: lMatch[2] });
          lastIndex = linkRegex.lastIndex;
        }

        if (foundLink) {
          if (lastIndex < part.content.length) {
            processedParts.push({ type: 'text', content: part.content.substring(lastIndex) });
          }
        } else {
          processedParts.push(part);
        }
      }
      parts = processedParts;

      return parts.map((part, index) => {
        if (part.type === 'code') {
          return <code key={index} className="markdown-inline-code">{part.content}</code>;
        }
        if (part.type === 'link') {
          return <a key={index} href={part.url} target="_blank" rel="noreferrer" className="markdown-link">{part.text}</a>;
        }
        return part.content;
      });
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        continue;
      }

      if (line.startsWith('🚀') || line.startsWith('🐛') || line.startsWith('✨') || line.startsWith('🛠️') || line.startsWith('🔒')) {
        flushList();
        rendered.push(
          <h3 key={`heading-${i}`} className="markdown-heading markdown-h3">
            {line}
          </h3>
        );
      }
      else if (line.startsWith('#') || line.startsWith('##') || line.startsWith('###')) {
        flushList();
        const level = line.indexOf(' ') > 0 ? line.indexOf(' ') : 3;
        const titleText = line.substring(level).trim();
        const HeaderTag = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
        rendered.push(
          <HeaderTag key={`heading-${i}`} className={`markdown-heading markdown-h${level}`}>
            {titleText}
          </HeaderTag>
        );
      } 
      else if (line.startsWith('-') || line.startsWith('*')) {
        const itemContent = line.substring(1).trim();
        currentList.push(
          <li key={`li-${i}`} className="markdown-li">
            {parseInline(itemContent)}
          </li>
        );
      } 
      else {
        flushList();
        rendered.push(
          <p key={`p-${i}`} className="markdown-paragraph">
            {parseInline(line)}
          </p>
        );
      }
    }
    
    flushList();
    return <div className="markdown-body-content">{rendered}</div>;
  };

  const getRepoLink = (image) => {
    const imgNoTag = image.split(':')[0];
    if (imgNoTag.includes('ghcr.io')) {
      return `https://${imgNoTag.replace('ghcr.io', 'github.com')}`;
    }
    if (!imgNoTag.includes('/')) {
      return `https://hub.docker.com/_/${imgNoTag}`;
    }
    const firstPart = imgNoTag.split('/')[0];
    if (firstPart.includes('.')) {
      // It's a custom registry (e.g., lscr.io), fallback to GitHub Search
      return getGithubSearchLink(image);
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
          Lighthouse
        </h1>
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</div>
          <div className={`nav-item ${activeTab === 'updates' ? 'active' : ''}`} onClick={() => setActiveTab('updates')}>Updates</div>
          <div className={`nav-item ${activeTab === 'containers' ? 'active' : ''}`} onClick={() => setActiveTab('containers')}>Containers</div>
          <div className={`nav-item ${activeTab === 'triggers' ? 'active' : ''}`} onClick={() => setActiveTab('triggers')}>Triggers</div>
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header" style={{ textTransform: 'capitalize' }}>
          <h2>
            {currentView === 'releases' ? 'Releases' : currentView === 'changelog' ? 'Changelog' : activeTab}
          </h2>
        </header>

        {currentView === 'releases' && selectedContainer && (
          <div className="page-view releases-view">
            <button className="btn back-btn" onClick={goBack} style={{ marginBottom: '20px' }}>
              ← Back to {originTab === 'updates' ? 'Updates' : originTab === 'containers' ? 'Containers' : 'Dashboard'}
            </button>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
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

            {remoteLoading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading releases...</div>
            ) : remoteReleases.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No release history available.</div>
            ) : (
              <div className="releases-list">
                {remoteReleases.map((r, i) => {
                  const cleanContainerVersion = selectedContainer.version.replace(/^v/, '').split('-')[0];
                  const cleanReleaseVersion = r.version.replace(/^v/, '').split('-')[0];
                  const isCurrent = cleanContainerVersion === cleanReleaseVersion || r.version === selectedContainer.version;
                  const isLatest = i === 0 && selectedContainer.status === 'update_available';
                  return (
                    <div key={`rel-${i}`} className={`release-row ${isCurrent ? 'current' : ''}`}>
                      <div className="release-info">
                        <span className="release-date">{getRelativeTime(r.timestamp)}</span>
                        <span className="release-name">{r.title || r.version}</span>
                        {isCurrent && <span className="badge badge-current">Current Version</span>}
                        {isLatest && <span className="badge badge-latest">Latest</span>}
                      </div>
                      <button className="btn btn-view-changelog" onClick={() => {
                        setSelectedRelease(r);
                        setCurrentView('changelog');
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        View Changelog
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentView === 'changelog' && selectedRelease && (
          <div className="page-view changelog-view">
            <button className="btn back-btn" onClick={() => setCurrentView('releases')} style={{ marginBottom: '20px' }}>
              ← Back to Releases
            </button>
            <div className="changelog-header" style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>
                {selectedRelease.title || selectedRelease.version} Changelog
              </h2>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Version {selectedRelease.version} • Published {formatDate(selectedRelease.timestamp)}
              </div>
            </div>
            <div className="changelog-body" style={{ background: 'var(--panel-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              {selectedRelease.changelog && selectedRelease.changelog !== 'No release notes provided.' ? 
                renderMarkdown(selectedRelease.changelog) : 
                <div style={{ color: 'var(--text-muted)' }}>No detailed changelog provided for this release.</div>
              }
            </div>
          </div>
        )}

        {currentView === 'list' && activeTab === 'dashboard' && (
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
                <span className="stat-value">{remoteHosts.length}</span>
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
                  <div key={container.id} className="container-card clickable-card" onClick={() => openDetails(container, 'dashboard')}>
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

        {currentView === 'list' && activeTab === 'updates' && (
          <div className="page-view">
            <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Available Updates</h3>
            <p style={{ color: 'var(--text-muted)' }}>Detailed changelogs for all containers with pending updates.</p>
            <div className="container-grid" style={{ marginTop: '20px' }}>
              {containers.filter(c => c.status === 'update_available').length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>All containers are up to date!</div>
              ) : (
                containers.filter(c => c.status === 'update_available').map((container) => (
                  <div key={container.id} className="container-card clickable-card" onClick={() => openDetails(container, 'updates')}>
                    <div className="card-header">
                      <div className="card-title">{container.name}</div>
                      <div className="status-badge update">Update Available</div>
                    </div>
                    <div className="card-body">
                      <div className="info-row">
                        <span className="info-label">Current</span>
                        <span className="info-value">{container.version === 'latest' && container.digest ? `latest (${container.digest.substring(0, 12)})` : container.version}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Latest</span>
                        <span className="info-value" style={{ color: 'var(--accent-color)' }}>{container.latest}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {currentView === 'list' && activeTab === 'containers' && (
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

        {currentView === 'list' && activeTab === 'triggers' && (
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

        {currentView === 'list' && activeTab === 'settings' && (
          <div className="page-view">
            <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Settings & Remote Hosts</h3>
            <p style={{ color: 'var(--text-muted)' }}>Link external helper apps to monitor remote servers.</p>
            <div className="container-card" style={{ marginTop: '20px' }}>
               <div className="card-header"><div className="card-title">Add Remote Host</div></div>
               <div className="card-body">
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="http://192.168.1.50:8305" 
                      className="search-input" 
                      style={{ flex: 1 }} 
                      value={newHostUrl}
                      onChange={e => setNewHostUrl(e.target.value)}
                    />
                    <input 
                      type="password" 
                      placeholder="API Key" 
                      className="search-input" 
                      style={{ flex: 1 }} 
                      value={newHostApiKey}
                      onChange={e => setNewHostApiKey(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={linkRemoteHost}>Link</button>
                  </div>
               </div>
            </div>
            
            {remoteHosts.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '15px' }}>Linked Hosts</h4>
                <div className="container-grid">
                  {remoteHosts.map(host => (
                    <div key={host.id} className="container-card">
                      <div className="card-header">
                        <div className="card-title" style={{ fontSize: '14px', fontFamily: 'monospace' }}>{host.url}</div>
                      </div>
                      <div className="card-footer">
                        <button className="btn" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => deleteRemoteHost(host.id)}>Disconnect</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Details Modal Removed */}
    </div>
  );
}

export default App;
