import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from './api';
import AdminPanel from './AdminPanel';
import './styles.css';

const PROFILE = { name: 'Sachin Jha', role: 'Full Stack Developer / Frontend Developer', tagline: 'Building digital systems that feel alive.', location: 'India', github: 'https://github.com/jhasachin0661-maker', linkedin: 'https://www.linkedin.com/in/sachin-jha-a4b504281/', email: 'jhasachin0661@gmail.com', availability: 'Available for opportunities' };
const ROTATOR = ['Full Stack Developer', 'Frontend Developer', 'AI / Data Explorer', 'Systems Thinker'];

function usePortfolioData() {
  const [data, setData] = useState({
    projects: [],
    skills: [],
    journey: [],
    build: null,
    lab: [],
    settings: {}
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const loadPortfolio = async () => {
      const results = await Promise.allSettled([
        api.get('/projects'),
        api.get('/skills'),
        api.get('/journey'),
        api.get('/current-build'),
        api.get('/lab'),
        api.get('/settings')
      ]);

      if (!alive) return;

      const [
        projectsResult,
        skillsResult,
        journeyResult,
        buildResult,
        labResult,
        settingsResult
      ] = results;

      setData({
        projects:
          projectsResult.status === 'fulfilled'
            ? projectsResult.value
            : [],

        skills:
          skillsResult.status === 'fulfilled'
            ? skillsResult.value
            : [],

        journey:
          journeyResult.status === 'fulfilled'
            ? journeyResult.value
            : [],

        build:
          buildResult.status === 'fulfilled'
            ? buildResult.value
            : null,

        lab:
          labResult.status === 'fulfilled'
            ? labResult.value
            : [],

        settings:
          settingsResult.status === 'fulfilled'
            ? settingsResult.value
            : {}
      });

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const endpoints = [
            '/projects',
            '/skills',
            '/journey',
            '/current-build',
            '/lab',
            '/settings'
          ];

          console.error(
            `Portfolio API failed: ${endpoints[index]}`,
            result.reason
          );
        }
      });

      setLoading(false);
    };

    loadPortfolio();

    return () => {
      alive = false;
    };
  }, []);

  return { ...data, loading };
}

function useSystemStatus() {
  const [status, setStatus] = useState({
    system: 'CHECKING',
    api: 'CHECKING'
  });

  useEffect(() => {
    let alive = true;

    api.get('/health')
      .then(() => {
        if (!alive) return;

        setStatus({
          system: 'ONLINE',
          api: 'ONLINE'
        });
      })
      .catch(() => {
        if (!alive) return;

        setStatus({
          system: 'OFFLINE',
          api: 'OFFLINE'
        });
      });

    return () => {
      alive = false;
    };
  }, []);

  return status;
}

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('is-visible')), { threshold: .12 });
    const nodes = ref.current?.querySelectorAll('[data-reveal]') || [];
    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  return ref;
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return progress;
}

function useRotator(words, interval = 2400) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setIndex(i => (i + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words, interval]);
  return words[index];
}

function App() {
  if (window.location.pathname === '/admin') return <AdminPanel />;
  const data = usePortfolioData();
  const status = useSystemStatus();
  const page = useReveal();
  const progress = useScrollProgress();
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [flash, setFlash] = useState('');
  const [cursor, setCursor] = useState({ x: -100, y: -100, label: '' });
  const [cursorEnabled, setCursorEnabled] = useState(true);
  const showFlash = message => { setFlash(message); setTimeout(() => setFlash(''), 3000); };
  const profile = { ...PROFILE, ...Object.fromEntries(Object.entries(data.settings || {}).filter(([, v]) => v)) };

  useEffect(() => { setCursorEnabled(!window.matchMedia('(pointer: coarse)').matches); }, []);
  useEffect(() => {
    if (!cursorEnabled) return;
    const move = event => { const interactive = event.target.closest('a,button,.project-row'); setCursor({ x: event.clientX, y: event.clientY, label: interactive?.dataset.cursor || '' }); };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [cursorEnabled]);
  useEffect(() => { const escape = event => event.key === 'Escape' && setModal(null); window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape); }, []);

  const featured = data.projects.find(p => p.featured) || data.projects[0];
  const openProject = (project) => setModal(project);
  const nextProject = (current) => {
    const idx = data.projects.findIndex(p => p.id === current.id);
    return data.projects[(idx + 1) % data.projects.length];
  };

  return (
    <div className="app" ref={page}>
      <div className="noise" />
      <div className="grid" />
      <div className="scroll-progress" style={{ width: `${progress}%` }} />
      {cursorEnabled && <div className="cursor" style={{ transform: `translate3d(${cursor.x}px,${cursor.y}px,0)` }}>{cursor.label}</div>}
      <Nav menu={menu} setMenu={setMenu} onTerminal={() => setTerminalOpen(true)} profile={profile} />
      <main>
        <Hero profile={profile} projectCount={data.projects.length} build={data.build} status={status} />
        <About profile={profile} build={data.build} />
        <Stack skills={data.skills} projects={data.projects} />
        {featured && <FeaturedProject project={featured} onOpen={openProject} />}
        <Projects projects={data.projects} loading={data.loading} onOpen={openProject} featuredId={featured?.id} />
        <EngineeringLab lab={data.lab} loading={data.loading} />
        <Journey journey={data.journey} />
        <CurrentBuild build={data.build} />
        <Philosophy />
        <Contact showFlash={showFlash} profile={profile} />
      </main>
      <Footer profile={profile} />
      {terminalOpen && <Terminal onClose={() => setTerminalOpen(false)} projects={data.projects} skills={data.skills} build={data.build} profile={profile} status={status} />}
      {modal && <ProjectModal project={modal} onClose={() => setModal(null)} onNext={() => setModal(nextProject(modal))} />}
      {flash && <div className="toast" role="status">{flash}</div>}
    </div>
  );
}

function Nav({ menu, setMenu, onTerminal, profile }) {
  const links = [['about', 'About'], ['stack', 'Stack'], ['projects', 'Work'], ['lab', 'Lab'], ['journey', 'Journey'], ['contact', 'Contact']];
  return <>
    <nav className={menu ? 'nav-open' : ''}>
      <a className="brand" href="#home" onClick={() => setMenu(false)}><span>SJ</span> / {profile.name}</a>
      <div className="navlinks">{links.map(([id, label]) => <a href={`#${id}`} key={id}>{label}</a>)}</div>
      <div className="nav-right">
        <span className="availability"><i /> {profile.availability}</span>
        <a className="nav-admin" href="/admin">Admin ↗</a>
        <button className="terminal-link" onClick={onTerminal}>Terminal ↗</button>
        <button className="menu-toggle" aria-label="Toggle navigation" aria-expanded={menu} onClick={() => setMenu(!menu)}><span /><span /></button>
      </div>
    </nav>
    {menu && <div className="mobile-menu">
      <span className="micro-label">NAVIGATION / 00</span>
      {links.map(([id, label], index) => <a href={`#${id}`} onClick={() => setMenu(false)} key={id}><span>0{index + 1}</span>{label}<b>↗</b></a>)}
      <div className="mobile-status"><i /> {profile.availability}</div>
    </div>}
  </>;
}

function Hero({ profile, projectCount, build, status }) {
  const role = useRotator(ROTATOR);
  return <section id="home" className="hero section">
    <div className="hero-coordinate">28°36' N<br />77°12' E</div>
    <div className="hero-copy">
      <span className="eyebrow" data-reveal><i /> {role}</span>
      <h1 data-reveal>Building<br /><em>digital systems</em><br />that feel alive<span className="accent-dot">.</span></h1>
      <p className="hero-text" data-reveal>I build modern, interactive web applications and practical AI-powered systems, from considered frontend experiences to connected backend architecture.</p>
      <div className="hero-actions" data-reveal>
        <a className="button button-solid" href="#projects">View selected work <span>↘</span></a>
        <a className="text-link" href="#contact">Start a conversation <span>↗</span></a>
      </div>
      <div className="hero-stats" data-reveal>
        <div><strong>{String(projectCount).padStart(2, '0')}</strong><span>Selected builds</span></div>
        <div><strong>{build ? build.status : '—'}</strong><span>Currently building{build ? `: ${build.name}` : ''}</span></div>
        <div><strong className={status?.system === 'ONLINE' ? 'ok' : ''}>{status ? status.system : 'CHECKING'}</strong><span>System status</span></div>
      </div>
    </div>
    <div className="hero-visual" aria-hidden="true">
      <div className="visual-ring ring-one" />
      <div className="visual-ring ring-two" />
      <div className="visual-cross cross-one" />
      <div className="visual-cross cross-two" />
      <div className="visual-nodes">{Array.from({ length: 8 }).map((_, i) => <span key={i} style={{ '--i': i }} />)}</div>
      <div className="visual-readout"><span>FIELD / 001</span><strong>{status?.system || 'ACTIVE'}</strong><small>REACT · NODE · AI</small></div>
      <div className="visual-core">SJ<span>/</span></div>
    </div>
    <div className="hero-footer"><span>SCROLL TO EXPLORE</span><span className="scroll-line" /><span>01 / 09</span></div>
  </section>;
}

function SectionLabel({ number, title, intro }) {
  return <div className="section-label" data-reveal><span>{number} / 09</span><h2>{title}</h2>{intro && <p>{intro}</p>}</div>;
}

function About({ profile, build }) {
  return <section id="about" className="section about">
    <SectionLabel number="01" title="A developer with a systems mind." intro="ABOUT / INTRODUCTION" />
    <div className="about-layout">
      <div className="about-statement" data-reveal>
        <p>I'm a developer focused on building modern, interactive web applications and practical AI-powered systems. I enjoy turning ideas into working products — from polished frontend experiences to connected backend systems and APIs.</p>
        <p className="muted">Driven by curiosity, experimentation, and technology that solves real problems.</p>
      </div>
      <div className="metadata" data-reveal>
        <Meta label="Location" value={profile.location} />
        <Meta label="Focus" value="Full stack / AI" />
        <Meta label="Currently" value={build ? build.name : 'Building'} />
        <Meta label="Approach" value="Useful over impressive" />
      </div>
    </div>
  </section>;
}

function Meta({ label, value }) { return <div className="meta-row"><span>{label}</span><strong>{value}</strong></div>; }

function Stack({ skills, projects }) {
  const groups = useMemo(() => skills.reduce((all, skill) => { (all[skill.category] ||= []).push(skill); return all; }, {}), [skills]);
  const [active, setActive] = useState(null);
  const usedIn = name => projects.filter(p => p.stack.toLowerCase().includes(name.toLowerCase())).map(p => p.name);
  return <section id="stack" className="section stack-section">
    <SectionLabel number="02" title="Tools for making ideas real." intro="STACK / WORKING SET" />
    <div className="stack-index" data-reveal>
      {Object.entries(groups).map(([category, items], index) => (
        <div className="stack-row" key={category}>
          <span className="stack-number">0{index + 1}</span>
          <h3>{category}</h3>
          <div className="stack-items">
            {items.map(skill => (
              <span key={skill.id} className="skill-chip" onMouseEnter={() => setActive(skill.id)} onMouseLeave={() => setActive(null)} onClick={() => setActive(active === skill.id ? null : skill.id)}>
                {skill.name}
                {active === skill.id && <div className="skill-tooltip">
                  {skill.description && <p>{skill.description}</p>}
                  {usedIn(skill.name).length > 0 && <small>Used in: {usedIn(skill.name).join(', ')}</small>}
                </div>}
              </span>
            ))}
          </div>
          <span className="row-arrow">↗</span>
        </div>
      ))}
    </div>
  </section>;
}

// Deterministic abstract technical visual, seeded from a project's number —
// used instead of stock or invented screenshots (see project README notes).
function ProjectVisual({ seed = 1, size = 'small' }) {
  const bars = Array.from({ length: 12 }).map((_, i) => 30 + ((seed * (i + 3) * 37) % 65));
  return <svg className={`project-visual-svg ${size}`} viewBox="0 0 240 140" aria-hidden="true">
    <rect x="0" y="0" width="240" height="140" fill="none" />
    {bars.map((h, i) => <rect key={i} x={i * 20 + 4} y={140 - h} width="10" height={h} fill="var(--accent)" opacity={0.35 + (i % 3) * 0.15} />)}
    <circle cx={20 + ((seed * 53) % 200)} cy={20 + ((seed * 29) % 40)} r="3" fill="var(--ink)" opacity="0.6" />
    <line x1="0" y1="135" x2="240" y2="135" stroke="var(--line)" strokeWidth="1" />
  </svg>;
}

const STATUS_ORDER = ['All', 'Full Stack', 'Frontend', 'AI/ML', 'Data', 'APIs', 'Experimental'];

function FeaturedProject({ project, onOpen }) {
  return <section id="featured" className="section featured-project">
    <SectionLabel number="03" title="Featured build." intro="FEATURED / DEEP DIVE" />
    <div className="featured-layout" data-reveal>
      <div className="featured-visual" onClick={() => onOpen(project)} data-cursor="VIEW">
        <ProjectVisual seed={project.number} size="large" />
        <span className="featured-status">{project.status}</span>
      </div>
      <div className="featured-copy">
        <span className="micro-label">FEATURED BUILD / 0{project.number}</span>
        <h3>{project.name}</h3>
        <p>{project.description}</p>
        <div className="chips">{project.stack.split('·').map(item => <b key={item}>{item.trim()}</b>)}</div>
        <button className="button button-solid" onClick={() => onOpen(project)}>View case study <span>↗</span></button>
      </div>
    </div>
  </section>;
}

function Projects({ projects, loading, onOpen, featuredId }) {
  const [filter, setFilter] = useState('All');
  const tags = useMemo(() => {
    const set = new Set(['All']);
    projects.forEach(p => (p.tags || '').split(',').map(t => t.trim()).filter(Boolean).forEach(t => set.add(t)));
    return STATUS_ORDER.filter(t => set.has(t)).concat([...set].filter(t => !STATUS_ORDER.includes(t)));
  }, [projects]);
  const visible = filter === 'All' ? projects : projects.filter(p => (p.tags || '').includes(filter));

  return <section id="projects" className="section work-section">
    <SectionLabel number="04" title="Selected work, in progress." intro="WORK / CASE STUDIES" />
    {tags.length > 1 && <div className="filter-row" data-reveal>
      {tags.map(tag => <button key={tag} className={filter === tag ? 'filter-chip active' : 'filter-chip'} onClick={() => setFilter(tag)}>{tag}</button>)}
    </div>}
    <div className="project-list" data-reveal>
      {loading ? <ProjectSkeleton /> : visible.map(project => (
        <article className="project-row" data-cursor="VIEW" tabIndex="0" key={project.id} onClick={() => onOpen(project)} onKeyDown={event => event.key === 'Enter' && onOpen(project)}>
          <span className="project-index">0{project.number}</span>
          <div className="project-title">
            <span>{project.year} / {project.status}{project.id === featuredId ? ' / FEATURED' : ''}</span>
            <h3>{project.name}</h3>
            <p>{project.description}</p>
            <div className="chips">{project.stack.split('·').map(item => <b key={item}>{item.trim()}</b>)}</div>
          </div>
          <span className="project-arrow">↗</span>
          <div className="project-visual">
            <ProjectVisual seed={project.number} />
            <span>VISUAL / {String(project.number).padStart(2, '0')}</span>
          </div>
        </article>
      ))}
      {!loading && visible.length === 0 && <div className="empty">No projects match this filter yet.</div>}
    </div>
    <div className="work-footer"><span>{visible.length} of {projects.length} selected builds</span><span>Click a project to inspect the thinking <b>↗</b></span></div>
  </section>;
}

function ProjectSkeleton() {
  return <>{[1, 2].map(i => <div className="skeleton-row" key={i}><div className="skeleton-block sm" /><div className="skeleton-block lg" /><div className="skeleton-block md" /></div>)}</>;
}

function ProjectModal({ project, onClose, onNext }) {
  const gallery = (project.gallery || '').split(',').map(s => s.trim()).filter(Boolean);
  return <div className="overlay" role="dialog" aria-modal="true" aria-label={project.name} onMouseDown={onClose}>
    <div className="case-study" onMouseDown={event => event.stopPropagation()}>
      <button className="close-button" aria-label="Close project" onClick={onClose}>×</button>
      <span className="eyebrow"><i /> PROJECT 0{project.number} / {project.status}</span>
      <h2>{project.name}</h2>
      <p className="case-lead">{project.description}</p>
      <div className="case-visual"><ProjectVisual seed={project.number} size="large" /></div>
      <div className="case-grid">
        <div>
          <span className="micro-label">THE PROBLEM</span>
          <p>{project.problem || 'Details coming soon.'}</p>
          <span className="micro-label">THE SOLUTION</span>
          <p>{project.solution || project.details || 'A practical system designed to turn a complex problem into a more useful, understandable experience.'}</p>
          {project.challenges && <><span className="micro-label">CHALLENGES</span><p>{project.challenges}</p></>}
          {project.learnings && <><span className="micro-label">WHAT I LEARNED</span><p>{project.learnings}</p></>}
        </div>
        <div>
          <span className="micro-label">BUILT WITH</span>
          <div className="case-stack">{project.stack.split('·').map(item => <span key={item}>{item.trim()}</span>)}</div>
          {gallery.length > 0 && <>
            <span className="micro-label" style={{ marginTop: 25, display: 'block' }}>GALLERY</span>
            <div className="case-gallery">{gallery.map((src, i) => <img key={i} src={src} alt={`${project.name} screenshot ${i + 1}`} loading="lazy" />)}</div>
          </>}
        </div>
      </div>
      <div className="case-actions">
        {project.liveUrl && <a className="button button-solid" href={project.liveUrl} target="_blank" rel="noreferrer">Open live demo ↗</a>}
        {project.githubUrl && <a className="text-link" href={project.githubUrl} target="_blank" rel="noreferrer">View source ↗</a>}
        <button className="text-link next-project" onClick={onNext}>Next project ↗</button>
      </div>
    </div>
  </div>;
}

function EngineeringLab({ lab, loading }) {
  return <section id="lab" className="section engineering-lab">
    <SectionLabel number="05" title="Small experiments, kept alive." intro="ENGINEERING LAB" />
    <div className="lab-grid" data-reveal>
      {loading ? <div className="empty">Loading experiments...</div> : lab.length === 0
        ? <div className="empty">No experiments published yet — check back soon.</div>
        : lab.map(item => (
          <div className="lab-card" key={item.id}>
            <span className="micro-label">{item.status}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <div className="chips">{item.stack.split('·').map(s => <b key={s}>{s.trim()}</b>)}</div>
            {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="text-link">Explore ↗</a>}
          </div>
        ))}
    </div>
  </section>;
}

function Journey({ journey }) {
  return <section id="journey" className="section journey">
    <SectionLabel number="06" title="A practice in motion." intro="JOURNEY / BUILD LOG" />
    <div className="journey-list" data-reveal>
      {journey.map((item, index) => (
        <div className="journey-row" key={item.id}>
          <span className="journey-year">{item.period}</span>
          <span className="journey-line"><i /></span>
          <div><span className="micro-label">0{index + 1}</span><h3>{item.title}</h3><p>{item.description}</p></div>
        </div>
      ))}
    </div>
  </section>;
}

function CurrentBuild({ build }) {
  return <section className="section current-build">
    <SectionLabel number="07" title="Currently making KisanSeva." intro="NOW / ACTIVE BUILD" />
    {build && <div className="build-layout" data-reveal>
      <div className="build-signal">
        <div className="signal-orbit"><span /><span /><span /></div>
        <span className="micro-label">SYSTEM / ACTIVE</span>
        <strong>IN<br /><em>DEVELOPMENT</em></strong>
      </div>
      <div className="build-copy">
        <span className="eyebrow"><i /> {build.status}</span>
        <h3>{build.name}</h3>
        <p>{build.description}</p>
        <div className="build-meta">
          <Meta label="Stack" value={build.stack} />
          <Meta label="Objective" value={build.objective} />
          {build.buildPhase && <Meta label="Build phase" value={build.buildPhase} />}
          <Meta label="Last updated" value={new Date(build.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} />
        </div>
      </div>
    </div>}
  </section>;
}

function Philosophy() {
  return <section className="section philosophy">
    <SectionLabel number="08" title="The reason behind the work." intro="PHILOSOPHY / PRINCIPLE" />
    <div className="philosophy-principles" data-reveal>
      <span>USEFUL <em>&gt;</em> IMPRESSIVE</span>
      <span>SYSTEMS <em>&gt;</em> SCREENS</span>
      <span>CLARITY <em>&gt;</em> COMPLEXITY</span>
    </div>
    <div className="philosophy-statement" data-reveal>I don't build software just because it can be built. <em>I build because technology should make complex problems easier to understand — and real problems easier to solve.</em></div>
  </section>;
}

function Contact({ showFlash, profile }) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState(false);
  const submit = async event => {
    event.preventDefault(); setBusy(true); setErrors({});
    try {
      const result = await api.post('/contact', form);
      setForm({ name: '', email: '', subject: '', message: '' });
      showFlash(result.emailSent ? 'Message sent to Sachin.' : 'Message received.');
      if (!result.emailSent) window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`From: ${form.name} <${form.email}>\n\n${form.message}`)}`;
    } catch (error) { setErrors(error.details || {}); showFlash(error.message); }
    finally { setBusy(false); }
  };
  const copyEmail = async () => { await navigator.clipboard?.writeText(profile.email); setCopied(true); showFlash('Email copied to clipboard.'); setTimeout(() => setCopied(false), 2200); };
  const errorFor = field => errors[field]?.[0];
  return <section id="contact" className="section contact">
    <SectionLabel number="09" title="Have an idea? Let's build it." intro="CONTACT / NEXT STEP" />
    <div className="contact-layout" data-reveal>
      <div className="contact-cta">
        <span className="micro-label">OPEN FOR A GOOD PROBLEM</span>
        <a className="email-link" href={`mailto:${profile.email}`}>{profile.email} <span>↗</span></a>
        <button className="copy-email" onClick={copyEmail}>{copied ? 'COPIED ✓' : 'COPY EMAIL'}</button>
        <div className="social-links">
          {profile.github && <a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>}
          {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
        </div>
      </div>
      <form className="contact-form" onSubmit={submit} noValidate>
        <span className="micro-label">OR SEND A NOTE</span>
        {[['name', 'Your name', 'text'], ['email', 'you@example.com', 'email'], ['subject', 'What are we building?', 'text']].map(([field, placeholder, type]) => (
          <label className={errorFor(field) ? 'has-error' : ''} key={field}>
            {field}
            <input required type={type} autoComplete={field} placeholder={placeholder} value={form[field]} onChange={event => setForm({ ...form, [field]: event.target.value })} />
            {errorFor(field) && <small>{errorFor(field)}</small>}
          </label>
        ))}
        <label className={errorFor('message') ? 'has-error' : ''}>
          message
          <textarea required rows="4" placeholder="A few details about your idea..." value={form.message} onChange={event => setForm({ ...form, message: event.target.value })} />
          {errorFor('message') && <small>{errorFor('message')}</small>}
        </label>
        <button className="button button-solid" disabled={busy}>{busy ? 'SENDING...' : 'SEND MESSAGE ↗'}</button>
      </form>
    </div>
  </section>;
}

function Footer({ profile }) {
  return <footer>
    <div className="footer-brand"><span>SJ</span><p>Full Stack Developer<br />/ Frontend Developer</p></div>
    <div>
      <span className="micro-label">FIND ME</span>
      <div className="footer-links">
        {profile.github && <a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>}
        {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
        <a href={`mailto:${profile.email}`}>Email ↗</a>
        <a href="#home">Back to top ↗</a>
      </div>
    </div>
    <div className="footer-end"><span>{profile.location}</span><span>© 2026 {profile.name}</span></div>
  </footer>;
}

function Terminal({ onClose, projects, skills, build, profile, status }) {
  const [history, setHistory] = useState(['Portfolio terminal ready.', 'Type "help" to explore.']);
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const commandHistory = useRef([]);

  const handlers = {
    help: () => 'help · whoami · about · projects · skills · stack · journey · status · build · contact · clear\naliases: ls, pwd, cat about.txt',
    whoami: () => `${profile.name}\n${profile.role}`,
    about: () => `${profile.name} — ${profile.role}\n${profile.tagline}`,
    'cat about.txt': () => `${profile.name} — ${profile.role}\n${profile.tagline}`,
    ls: () => projects.map(project => `0${project.number}  ${project.name}`).join('\n'),
    pwd: () => '~/sachin/portfolio',
    projects: () => projects.map(project => `0${project.number} · ${project.name} [${project.status}]`).join('\n'),
    skills: () => skills.map(skill => skill.name).join(' · '),
    stack: () => Object.entries(skills.reduce((all, s) => { (all[s.category] ||= []).push(s.name); return all; }, {})).map(([cat, items]) => `${cat}: ${items.join(', ')}`).join('\n'),
    journey: () => 'Type "help" to see other commands, or scroll to the Journey section.',
    contact: () => `${profile.email}\n${profile.github || ''}`.trim(),
    status: () => `SYSTEM ${status?.system || 'CHECKING'}\nAPI ${status?.api || 'CHECKING'}\nCURRENT BUILD: ${build ? build.name.toUpperCase() : 'N/A'}\nPORTFOLIO: ONLINE`,
    build: () => build ? `${build.name}\nSTATUS: ${build.status}\nSTACK: ${build.stack}\nOBJECTIVE: ${build.objective}` : 'No active build configured.',
    clear: () => null,
  };

  const run = command => {
    const value = command.trim();
    const key = value.toLowerCase();
    if (!value) return;
    commandHistory.current.push(value);
    setHistoryIndex(-1);
    if (key === 'clear') { setHistory([]); setInput(''); return; }
    const handler = handlers[key];
    const output = handler ? handler() : `command not found: ${value}`;
    setHistory(current => [...current, `> ${command}`, output]);
    setInput('');
  };

  const onKeyDown = event => {
    if (event.key === 'Enter') { run(input); return; }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const next = Math.min(historyIndex + 1, commandHistory.current.length - 1);
      if (commandHistory.current.length) { setHistoryIndex(next); setInput(commandHistory.current[commandHistory.current.length - 1 - next] || ''); }
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = historyIndex - 1;
      setHistoryIndex(next);
      setInput(next >= 0 ? commandHistory.current[commandHistory.current.length - 1 - next] : '');
    }
  };

  return <div className="overlay terminal-overlay" onMouseDown={onClose}>
    <div className="terminal" onMouseDown={event => event.stopPropagation()}>
      <div className="terminal-head"><span>~/sachin/portfolio</span><button onClick={onClose} aria-label="Close terminal">×</button></div>
      <div className="terminal-body">
        {history.map((line, index) => <pre key={index}>{line}</pre>)}
        <div className="terminal-input"><span>›</span><input autoFocus value={input} onChange={event => setInput(event.target.value)} onKeyDown={onKeyDown} /></div>
      </div>
    </div>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
