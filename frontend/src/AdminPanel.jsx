import React, { useEffect, useState } from 'react';
import { api } from './api';

const TABS = ['projects', 'skills', 'journey', 'current-build', 'lab', 'messages', 'settings'];

const FIELDS = {
  projects: ['number', 'name', 'slug', 'description', 'problem', 'solution', 'challenges', 'learnings', 'details', 'stack', 'tags', 'gallery', 'status', 'year', 'liveUrl', 'githubUrl', 'imageUrl'],
  skills: ['category', 'name', 'description', 'order'],
  journey: ['period', 'title', 'description', 'order'],
  'current-build': ['name', 'status', 'description', 'stack', 'objective', 'buildPhase'],
  lab: ['title', 'description', 'stack', 'status', 'link', 'order'],
  settings: ['name', 'role', 'tagline', 'location', 'email', 'github', 'linkedin', 'resumeUrl', 'availability'],
};

const LONG_FIELDS = ['description', 'details', 'problem', 'solution', 'challenges', 'learnings', 'objective', 'tagline'];
const NUMBER_FIELDS = ['number', 'order'];

export default function AdminPanel() {
  const [me, setMe] = useState(null);
  const [login, setLogin] = useState({ email: '', password: '' });
  const [tab, setTab] = useState('projects');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [overview, setOverview] = useState(null);

  const pathFor = name => name === 'current-build' || name === 'settings' ? `/${name}` : `/${name}`;
  const isSingleton = name => name === 'current-build' || name === 'settings';

  const load = async name => {
    setTab(name); setError(''); setEditing(null); setForm({});
    try {
      const data = await api.get(pathFor(name));
      setItems(isSingleton(name) ? [data] : data);
      if (isSingleton(name)) setForm(data || {});
    } catch (err) { setError(err.message); setItems([]); }
  };

  const loadOverview = async () => {
    try {
      const [projects, skills, messages, build] = await Promise.all([
        api.get('/projects'), api.get('/skills'), api.get('/messages').catch(() => []), api.get('/current-build').catch(() => null),
      ]);
      setOverview({
        totalProjects: projects.length,
        activeBuilds: build ? 1 : 0,
        unreadMessages: messages.filter(m => !m.read).length,
        skills: skills.length,
        lastUpdated: build ? new Date(build.updatedAt).toLocaleDateString() : '—',
      });
    } catch { /* overview is best-effort */ }
  };

  useEffect(() => { api.get('/auth/me').then(setMe).catch(() => {}); }, []);
  useEffect(() => { if (me) { load(tab); loadOverview(); } }, [me]);

  const submitLogin = async event => {
    event.preventDefault(); setError('');
    try { await api.post('/auth/login', login); setMe(await api.get('/auth/me')); }
    catch (err) { setError(err.message); }
  };

  const fields = FIELDS[tab] || [];

  const save = async event => {
    event.preventDefault(); setError('');
    try {
      const path = pathFor(tab);
      if (isSingleton(tab)) await api.put(path, form);
      else if (editing) await api.put(`${path}/${editing.id}`, form);
      else await api.post(path, form);
      setEditing(null); setForm({}); setSaved(true);
      load(tab); loadOverview();
      setTimeout(() => setSaved(false), 2200);
    } catch (err) { setError(err.message); }
  };

  const remove = async id => {
    if (!window.confirm('Delete this item?')) return;
    try { await api.del(`${pathFor(tab)}/${id}`); load(tab); loadOverview(); }
    catch (err) { setError(err.message); }
  };

  const toggleRead = async item => {
    try { await api.patch(`/messages/${item.id}/read`); load(tab); loadOverview(); }
    catch (err) { setError(err.message); }
  };

  if (!me) return (
    <div className="admin-page">
      <div className="admin-login">
        <span className="micro-label">PRIVATE CONTROL ROOM</span>
        <h1>Portfolio<br /><i>Control.</i></h1>
        <p>Sign in to edit the live portfolio content.</p>
        <form onSubmit={submitLogin}>
          <label>EMAIL<input type="email" autoComplete="email" value={login.email} onChange={event => setLogin({ ...login, email: event.target.value })} /></label>
          <label>PASSWORD<input type="password" autoComplete="current-password" value={login.password} onChange={event => setLogin({ ...login, password: event.target.value })} /></label>
          <button className="button button-solid">ENTER CONTROL ROOM <span>↗</span></button>
        </form>
        {error && <div className="admin-error">{error}</div>}
        <p className="admin-hint">Credentials are set via the backend <code>.env</code> (<code>ADMIN_EMAIL</code> / <code>ADMIN_PASSWORD</code>), and printed once by <code>npm run db:seed</code> if not configured.</p>
      </div>
    </div>
  );

  return (
    <div className="admin-page">
      <header className="admin-header">
        <a href="/" className="admin-brand">SJ<span>/</span></a>
        <span className="admin-session">ADMIN / {me.email}</span>
        <button className="text-button" onClick={async () => { await api.post('/auth/logout'); window.location.reload(); }}>LOG OUT</button>
      </header>
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <span className="micro-label">CONTENT SYSTEM</span>
          {TABS.map(name => <button className={tab === name ? 'active' : ''} onClick={() => load(name)} key={name}>{name.replace('-', ' ').toUpperCase()} <span>↗</span></button>)}
          <a href="/" className="back-site">← VIEW LIVE SITE</a>
        </aside>
        <section className="admin-content">
          {overview && (
            <div className="overview-cards">
              <div className="overview-card"><strong>{overview.totalProjects}</strong><span>Total projects</span></div>
              <div className="overview-card"><strong>{overview.activeBuilds}</strong><span>Active builds</span></div>
              <div className="overview-card"><strong>{overview.unreadMessages}</strong><span>Unread messages</span></div>
              <div className="overview-card"><strong>{overview.skills}</strong><span>Skills</span></div>
              <div className="overview-card"><strong>{overview.lastUpdated}</strong><span>Last updated</span></div>
            </div>
          )}
          <div className="admin-title">
            <div><span className="micro-label">LIVE DATABASE</span><h1>{tab.replace('-', ' ')}</h1></div>
            {tab !== 'messages' && !isSingleton(tab) && <button className="button button-solid" onClick={() => { setEditing(null); setForm({}); }}>NEW ENTRY +</button>}
          </div>
          {saved && <div className="save-note">Saved to the live portfolio.</div>}
          {error && <div className="admin-error">{error}</div>}
          {tab !== 'messages' && (
            <form className="admin-form" onSubmit={save}>
              {fields.map(field => (
                <label key={field} className={field === 'gallery' || field === 'tags' ? 'span-2' : ''}>
                  {field}
                  <textarea
                    rows={LONG_FIELDS.includes(field) ? 3 : 1}
                    value={form[field] ?? ''}
                    onChange={event => setForm({ ...form, [field]: NUMBER_FIELDS.includes(field) ? Number(event.target.value) : event.target.value })}
                    placeholder={field === 'tags' ? 'Full Stack, AI/ML' : field === 'gallery' ? 'https://.../a.png, https://.../b.png' : ''}
                  />
                </label>
              ))}
              <button className="button button-solid">{editing || isSingleton(tab) ? 'UPDATE ENTRY' : 'CREATE ENTRY'} <span>↗</span></button>
            </form>
          )}
          <div className="admin-items">
            {items.map(item => item && (
              <div className="admin-item" key={item.id || 'settings'}>
                <div>
                  <b>{item.name || item.title || item.subject || item.period || 'Settings'}</b>
                  <small>{item.email || item.status || item.category || ''}</small>
                </div>
                {tab === 'messages'
                  ? <div>
                      <button className="item-action" onClick={() => toggleRead(item)}>{item.read ? 'MARK UNREAD' : 'MARK READ'}</button>
                      <button className="item-action danger" onClick={async () => { if (window.confirm('Delete this message?')) { await api.del(`/messages/${item.id}`); load(tab); loadOverview(); } }}>DELETE</button>
                    </div>
                  : <div>
                      <button className="item-action" onClick={() => { setEditing(item); setForm(item); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>EDIT</button>
                      {!isSingleton(tab) && <button className="item-action danger" onClick={() => remove(item.id)}>DELETE</button>}
                    </div>}
              </div>
            ))}
            {tab !== 'messages' && items.length === 0 && <div className="empty">Nothing here yet — use the form above to add your first entry.</div>}
            {tab === 'messages' && items.length === 0 && <div className="empty">No messages yet.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
