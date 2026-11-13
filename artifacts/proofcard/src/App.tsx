import { useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Copy,
  ExternalLink,
  FileText,
  Fingerprint,
  Link2,
  LockKeyhole,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';

type EvidenceLink = { label: string; url: string };
type ProjectDraft = {
  title: string;
  projectUrl: string;
  summary: string;
  problem: string;
  contribution: string;
  tools: string;
  aiUse: string;
  process: string;
  validation: string;
  evidenceLinks: EvidenceLink[];
  impact: string;
  limitations: string;
  skills: string[];
  descriptionOverride: string;
};

const STORAGE_KEY = 'proofcard-project-draft-v1';

const emptyDraft: ProjectDraft = {
  title: '',
  projectUrl: '',
  summary: '',
  problem: '',
  contribution: '',
  tools: '',
  aiUse: '',
  process: '',
  validation: '',
  evidenceLinks: [],
  impact: '',
  limitations: '',
  skills: [],
  descriptionOverride: '',
};

const demoDraft: ProjectDraft = {
  title: 'Campus Pantry Map',
  projectUrl: 'https://github.com/maya-chen/campus-pantry-map',
  summary: 'A small directory that helps students find campus food pantries and understand what to expect before visiting.',
  problem: 'Pantry hours and eligibility details were spread across several campus pages. I wanted to make the information easier to scan in one place.',
  contribution: 'I planned the page structure, built the searchable pantry directory, and wrote the location cards. I was responsible for the frontend and the content organization.',
  tools: 'React, TypeScript, CSS, and a manually assembled list of campus pantry details.',
  aiUse: 'I used an AI assistant to brainstorm clearer labels. I reviewed and rewrote the suggestions; no AI-generated facts were added to the directory.',
  process: 'I collected the details from campus pages, grouped them into consistent fields, sketched the directory layout, then built and refined the search and location cards.',
  validation: 'I checked the listed details against the source campus pages and tried the search with pantry names and neighborhood terms. I have not yet tested this with pantry visitors.',
  evidenceLinks: [{ label: 'Project repository (demo link — replace)', url: 'https://github.com/maya-chen/campus-pantry-map' }],
  impact: 'The directory brings pantry location, hours, and visit notes into one page. I do not have usage data or measured outcomes to report.',
  limitations: 'The information can change, and the directory has not been reviewed by pantry staff. It currently covers only the locations I found on campus pages.',
  skills: ['React', 'TypeScript', 'Information architecture', 'Content research'],
  descriptionOverride: '',
};

const fieldSections = [
  { id: 'project-basics', label: 'Project basics', number: '01' },
  { id: 'your-work', label: 'Your work', number: '02' },
  { id: 'process-proof', label: 'Process & proof', number: '03' },
  { id: 'reflection', label: 'Reflection', number: '04' },
];

function clean(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function safeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

function normalizeDraft(value: unknown): ProjectDraft {
  const parsed = value && typeof value === 'object' ? value as Partial<ProjectDraft> : {};
  const textFields = [
    'title', 'projectUrl', 'summary', 'problem', 'contribution', 'tools',
    'aiUse', 'process', 'validation', 'impact', 'limitations', 'descriptionOverride',
  ] as const;
  const textValues = Object.fromEntries(
    textFields.map((key) => [key, typeof parsed[key] === 'string' ? parsed[key] : '']),
  ) as Pick<ProjectDraft, (typeof textFields)[number]>;
  const evidenceLinks = Array.isArray(parsed.evidenceLinks)
    ? parsed.evidenceLinks
        .filter((link): link is EvidenceLink => Boolean(link && typeof link === 'object' && typeof link.label === 'string' && typeof link.url === 'string'))
        .map((link) => ({ label: link.label, url: link.url }))
    : [];
  const skills = Array.isArray(parsed.skills)
    ? parsed.skills.filter((skill): skill is string => typeof skill === 'string')
    : [];
  return { ...emptyDraft, ...textValues, evidenceLinks, skills };
}

function hasSavedDraft() {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}

function makeDescription(draft: ProjectDraft) {
  const title = clean(draft.title) || 'This project';
  const paragraphs: string[] = [];
  if (clean(draft.summary)) paragraphs.push(clean(draft.summary));
  if (clean(draft.problem)) paragraphs.push(`The problem I worked on: ${clean(draft.problem)}`);
  if (clean(draft.contribution)) paragraphs.push(`My contribution: ${clean(draft.contribution)}`);
  const toolsAndAi = [clean(draft.tools) ? `Tools: ${clean(draft.tools)}` : '', clean(draft.aiUse) ? `AI use: ${clean(draft.aiUse)}` : ''].filter(Boolean).join(' ');
  if (toolsAndAi) paragraphs.push(toolsAndAi);
  if (clean(draft.process)) paragraphs.push(`How I approached it: ${clean(draft.process)}`);
  const validation = [clean(draft.validation), ...draft.evidenceLinks.map((link) => clean(link.label) && clean(link.url) ? `${clean(link.label)} — ${clean(link.url)}` : '')].filter(Boolean).join(' ');
  if (validation) paragraphs.push(`What I checked: ${validation}`);
  if (clean(draft.impact)) paragraphs.push(`Outcome: ${clean(draft.impact)}`);
  if (clean(draft.limitations)) paragraphs.push(`What remains: ${clean(draft.limitations)}`);
  if (draft.skills.length) paragraphs.push(`Skills demonstrated: ${draft.skills.join(', ')}.`);
  return `${title}\n\n${paragraphs.join('\n\n')}`.trim();
}

function loadInitialDraft(): ProjectDraft {
  try {
    const hash = window.location.hash;
    const match = hash.match(/^#draft=(.*)$/);
    if (match?.[1]) {
      return normalizeDraft(JSON.parse(decodeURIComponent(match[1])));
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeDraft(JSON.parse(saved));
  } catch {
    return demoDraft;
  }
  return demoDraft;
}

function App() {
  const [draft, setDraft] = useState<ProjectDraft>(loadInitialDraft);
  const [saved, setSaved] = useState(() => !window.location.hash && hasSavedDraft());
  const [toast, setToast] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [activeSection, setActiveSection] = useState('project-basics');
  const [privacyVisible, setPrivacyVisible] = useState(true);
  const [demoLoaded, setDemoLoaded] = useState(() => !hasSavedDraft() && !window.location.hash);

  const generatedDescription = useMemo(() => makeDescription(draft), [draft]);
  const description = draft.descriptionOverride || generatedDescription;
  const fieldsToComplete = [draft.title, draft.summary, draft.problem, draft.contribution, draft.tools, draft.process, draft.validation, draft.impact, draft.limitations, draft.skills.length ? 'yes' : ''];
  const completedCount = fieldsToComplete.filter((item) => String(item).trim().length > 0).length;
  const progress = Math.round((completedCount / fieldsToComplete.length) * 100);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const handleHashChange = () => {
      const match = window.location.hash.match(/^#draft=(.*)$/);
      if (!match?.[1]) return;
      try {
        setDraft(normalizeDraft(JSON.parse(decodeURIComponent(match[1]))));
        setSaved(false);
        setDemoLoaded(false);
      } catch {
        setToast('This shared draft could not be opened.');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const update = (key: keyof ProjectDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value, descriptionOverride: '' }));
    setSaved(false);
  };

  const jumpTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setSaved(true);
      setDemoLoaded(false);
      setToast('Draft saved on this device.');
    } catch {
      setToast('Could not save here. Your browser storage may be full.');
    }
  };

  const clearDraft = () => {
    if (!window.confirm('Clear this project draft from the editor and this device?')) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      setToast('Browser storage could not be cleared.');
    }
    if (window.location.hash) history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    setDraft(emptyDraft);
    setSaved(false);
    setDemoLoaded(false);
    setToast('Draft cleared.');
  };

  const loadDemo = () => {
    setDraft(demoDraft);
    setSaved(false);
    setDemoLoaded(true);
    setToast('Demo project loaded. Replace its details with your own.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyText = async (text: string, success: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast(success);
    } catch {
      setToast('Clipboard access is unavailable in this browser.');
    }
  };

  const createShareLink = async () => {
    const encoded = encodeURIComponent(JSON.stringify(draft));
    const shareUrl = `${window.location.origin}${window.location.pathname}#draft=${encoded}`;
    history.replaceState(null, '', `#draft=${encoded}`);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setToast('Share link copied. Anyone with it can open this draft.');
    } catch {
      setToast('Share link created in the address bar. Copy the URL to share it.');
    }
  };

  const addSkill = () => {
    const skill = clean(skillInput);
    if (!skill || draft.skills.some((item) => item.toLowerCase() === skill.toLowerCase())) return;
    setDraft((current) => ({ ...current, skills: [...current.skills, skill], descriptionOverride: '' }));
    setSaved(false);
    setSkillInput('');
  };

  const handleSkillKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addSkill();
    }
  };

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDraft((current) => ({ ...current, descriptionOverride: event.target.value }));
    setSaved(false);
  };

  const updateEvidence = (index: number, key: keyof EvidenceLink, value: string) => {
    setDraft((current) => ({
      ...current,
      evidenceLinks: current.evidenceLinks.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
      descriptionOverride: '',
    }));
    setSaved(false);
  };

  const addEvidence = () => {
    setDraft((current) => ({ ...current, evidenceLinks: [...current.evidenceLinks, { label: '', url: '' }], descriptionOverride: '' }));
    setSaved(false);
  };

  const removeEvidence = (index: number) => {
    setDraft((current) => ({ ...current, evidenceLinks: current.evidenceLinks.filter((_, itemIndex) => itemIndex !== index), descriptionOverride: '' }));
    setSaved(false);
  };

  const onField = (key: keyof ProjectDraft) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(key, event.target.value);
  const sectionLabel = (id: string) => fieldSections.find((section) => section.id === id)?.label ?? 'Project';
  const projectHref = safeHttpUrl(draft.projectUrl);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Workspace navigation">
        <div className="brand">
          <span className="brand-mark"><Fingerprint size={20} strokeWidth={2.2} /></span>
          <div><div className="brand-name">ProofCard</div><div className="brand-sub">YOUR WORK, WITH RECEIPTS</div></div>
        </div>
        <div className="workspace-label">Workspace</div>
        <div className="side-project">
          <div className="side-project-kicker"><span className="live-dot" /> CURRENT PROJECT</div>
          <div className="side-project-title" data-testid="text-sidebar-project-title">{draft.title || 'Untitled project'}</div>
          <div className="side-project-meta" data-testid="text-sidebar-progress">{completedCount} of 10 details added</div>
        </div>
        <div className="nav-label">Build your case study</div>
        <nav className="nav-list">
          {fieldSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => jumpTo(section.id)}
              data-testid={`nav-section-${section.id}`}
              aria-current={activeSection === section.id ? 'step' : undefined}
            >
              <ChevronRight size={14} /><span>{section.label}</span><span className="nav-step">{section.number}</span>
            </button>
          ))}
          <button type="button" className="nav-item" onClick={() => document.getElementById('showcase-output')?.scrollIntoView({ behavior: 'smooth' })} data-testid="nav-section-showcase">
            <FileText size={14} /><span>Showcase description</span><ArrowDownRight size={13} className="nav-step" />
          </button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="privacy-mini"><LockKeyhole size={15} /><span>Your details stay in this browser unless you choose to share a link.</span></div>
        <div className="side-foot">A clearer story. Still your story.</div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><Fingerprint size={16} /></span>ProofCard</div>
          <div className="crumb"><span>Workspace</span><ChevronRight size={13} /><strong>Project builder</strong></div>
          <div className="top-actions">
            <span className="save-state" data-testid="status-save-state">{saved ? <><CheckCircle2 size={14} /> Saved on this device</> : <><CircleHelp size={14} /> Not saved yet</>}</span>
            <button className="btn btn-quiet btn-danger" onClick={clearDraft} type="button" data-testid="button-clear-draft"><RotateCcw size={14} /> Clear</button>
            <button className="btn btn-primary" onClick={saveDraft} type="button" data-testid="button-save-draft"><Save size={14} /> Save draft</button>
          </div>
        </header>

        <div className="content-wrap">
          <div className="intro">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> THE PROJECT EVIDENCE BUILDER</div>
              <h1>Make your work<br />easy to understand.</h1>
              <p className="intro-copy">One real project. A clear account of what you did, what you checked, and what you’re still figuring out.</p>
            </div>
            <div className="progress-block" aria-label={`Project details ${progress}% complete`}>
              <div className="progress-copy"><strong data-testid="text-progress-percent">{progress}%</strong> <span>of the story is here</span></div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
            </div>
          </div>

          {privacyVisible && (
            <div className="notice" role="note" data-testid="notice-privacy">
              <ShieldCheck size={17} />
              <span><strong>Your work stays yours.</strong> Drafts are stored in this browser only. A share link puts your draft data in the URL, so only share it with people you trust. We won’t add facts you haven’t entered.</span>
              <button className="notice-dismiss" type="button" aria-label="Dismiss privacy reminder" onClick={() => setPrivacyVisible(false)} data-testid="button-dismiss-privacy"><X size={15} /></button>
            </div>
          )}

          {demoLoaded && (
            <div className="notice" role="status" data-testid="notice-demo">
              <BookOpenCheck size={17} />
              <span><strong>Demo project loaded.</strong> Every detail below is an example, not a verified claim. Swap it for your own work before sharing.</span>
              <button className="notice-dismiss" type="button" aria-label="Dismiss demo reminder" onClick={() => setDemoLoaded(false)} data-testid="button-dismiss-demo"><X size={15} /></button>
            </div>
          )}

          <div className="work-grid">
            <section className="form-card" aria-label="Project details">
              <div className="form-header">
                <div><h2 className="section-title">Your project, in your words</h2><p>Start with what you know. You can leave a field blank.</p></div>
                <span className="required-note">NO PERFECT ANSWERS</span>
              </div>
              <div className="form-content">
                <section className="field-section" id="project-basics">
                  <div className="field-head"><span className="field-number">01</span><h3>Start with the project</h3></div>
                  <div className="field-grid">
                    <div className="field full">
                      <label htmlFor="project-title">Project title</label>
                      <input id="project-title" className="input" value={draft.title} onChange={onField('title')} placeholder="Give this project a name" data-testid="input-project-title" />
                    </div>
                    <div className="field full">
                      <label htmlFor="project-summary">What did you make? <span className="optional">A sentence or two</span></label>
                      <textarea id="project-summary" className="textarea" value={draft.summary} onChange={onField('summary')} placeholder="Describe the thing you made, for someone who hasn't seen it." data-testid="input-project-summary" />
                    </div>
                    <div className="field full">
                      <label htmlFor="project-url">Project link <span className="optional">Optional</span></label>
                      <input id="project-url" className="input" type="url" value={draft.projectUrl} onChange={onField('projectUrl')} placeholder="https://…" data-testid="input-project-url" />
                    </div>
                    <div className="field full">
                      <label htmlFor="problem">What problem or question were you working on?</label>
                      <p className="field-hint">Context helps someone understand why this project exists.</p>
                      <textarea id="problem" className="textarea" value={draft.problem} onChange={onField('problem')} placeholder="What felt missing, difficult, or worth exploring?" data-testid="input-project-problem" />
                    </div>
                  </div>
                </section>

                <section className="field-section" id="your-work">
                  <div className="field-head"><span className="field-number">02</span><h3>Be specific about your part</h3></div>
                  <div className="field-grid">
                    <div className="field full">
                      <label htmlFor="contribution">What did you personally do?</label>
                      <p className="field-hint">Name the decisions, tasks, and pieces you were responsible for.</p>
                      <textarea id="contribution" className="textarea tall" value={draft.contribution} onChange={onField('contribution')} placeholder="I was responsible for… I chose to… I built…" data-testid="input-project-contribution" />
                    </div>
                    <div className="field full">
                      <label htmlFor="tools">Tools, materials, or collaborators <span className="optional">Optional</span></label>
                      <textarea id="tools" className="textarea" value={draft.tools} onChange={onField('tools')} placeholder="Software, libraries, datasets, equipment, teammates…" data-testid="input-project-tools" />
                    </div>
                    <div className="field full">
                      <label htmlFor="ai-use">How did you use AI? <span className="optional">Include “I didn’t” if relevant</span></label>
                      <p className="field-hint">Say what AI contributed and what you reviewed, changed, or decided yourself.</p>
                      <textarea id="ai-use" className="textarea" value={draft.aiUse} onChange={onField('aiUse')} placeholder="I used [tool] to… I checked or changed its output by…" data-testid="input-project-ai-use" />
                    </div>
                  </div>
                </section>

                <section className="field-section" id="process-proof">
                  <div className="field-head"><span className="field-number">03</span><h3>Show your process and checks</h3></div>
                  <div className="field-grid">
                    <div className="field full">
                      <label htmlFor="process">How did you approach it?</label>
                      <p className="field-hint">A few steps, a decision that changed things, or what you tried first.</p>
                      <textarea id="process" className="textarea tall" value={draft.process} onChange={onField('process')} placeholder="First I… Then I… One decision I made was…" data-testid="input-project-process" />
                    </div>
                    <div className="field full">
                      <label htmlFor="validation">What did you test, review, or verify?</label>
                      <p className="field-hint">Include how you checked it—and what you haven't checked yet.</p>
                      <textarea id="validation" className="textarea tall" value={draft.validation} onChange={onField('validation')} placeholder="I checked… I compared… I haven't yet…" data-testid="input-project-validation" />
                    </div>
                    <div className="field full">
                      <div className="field-label">Evidence links <span className="optional">Optional</span></div>
                      <p className="field-hint">Link to something that helps someone see the work. You’re responsible for what each link shows.</p>
                      {draft.evidenceLinks.map((link, index) => (
                        <div className="evidence-row" key={`evidence-${index}`}>
                          <input className="input" aria-label={`Evidence ${index + 1} label`} placeholder="What this link shows" value={link.label} onChange={(event) => updateEvidence(index, 'label', event.target.value)} data-testid={`input-evidence-label-${index}`} />
                          <input className="input evidence-url" aria-label={`Evidence ${index + 1} URL`} placeholder="https://…" type="url" value={link.url} onChange={(event) => updateEvidence(index, 'url', event.target.value)} data-testid={`input-evidence-url-${index}`} />
                          <button className="icon-btn" type="button" aria-label={`Remove evidence link ${index + 1}`} onClick={() => removeEvidence(index)} data-testid={`button-remove-evidence-${index}`}><Trash2 size={14} /></button>
                        </div>
                      ))}
                      <button type="button" className="add-link" onClick={addEvidence} data-testid="button-add-evidence"><Plus size={13} /> Add an evidence link</button>
                    </div>
                  </div>
                </section>

                <section className="field-section" id="reflection">
                  <div className="field-head"><span className="field-number">04</span><h3>Keep the story grounded</h3></div>
                  <div className="field-grid">
                    <div className="field full">
                      <label htmlFor="impact">What changed or came out of it?</label>
                      <p className="field-hint">An outcome can be a working prototype or a new understanding—not necessarily a metric.</p>
                      <textarea id="impact" className="textarea" value={draft.impact} onChange={onField('impact')} placeholder="What exists now that didn't before? Avoid numbers you can't support." data-testid="input-project-impact" />
                    </div>
                    <div className="field full">
                      <label htmlFor="limitations">What are the limitations or next steps?</label>
                      <textarea id="limitations" className="textarea" value={draft.limitations} onChange={onField('limitations')} placeholder="What would need more testing, time, or a different approach?" data-testid="input-project-limitations" />
                    </div>
                    <div className="field full">
                      <label htmlFor="skill-input">Skills you used <span className="optional">Add one at a time</span></label>
                      <div className="skills-wrap">
                        <input id="skill-input" className="input" value={skillInput} onChange={(event) => setSkillInput(event.target.value)} onKeyDown={handleSkillKey} placeholder="e.g. User research" data-testid="input-skill" />
                        <button type="button" className="btn" onClick={addSkill} data-testid="button-add-skill"><Plus size={14} /> Add</button>
                      </div>
                      {draft.skills.length > 0 && <div className="skill-list" aria-label="Added skills">
                        {draft.skills.map((skill, index) => <span className="skill-chip" key={`${skill}-${index}`} data-testid={`chip-skill-${index}`}>{skill}<button className="skill-remove" type="button" aria-label={`Remove ${skill}`} onClick={() => { setDraft((current) => ({ ...current, skills: current.skills.filter((_, i) => i !== index), descriptionOverride: '' })); setSaved(false); }} data-testid={`button-remove-skill-${index}`}><X size={12} /></button></span>)}
                      </div>}
                      <div className="confirm-note"><TriangleAlert size={12} /> Only list skills you can talk about with a specific example.</div>
                    </div>
                  </div>
                </section>
              </div>
            </section>

            <aside className="preview-column" aria-label="Live project preview">
              <section className="preview-card">
                <div className="preview-top">
                  <div className="preview-title"><BookOpenCheck size={17} /> Case study preview</div>
                  <span className="ready-badge"><BadgeCheck size={12} /> HANDSHAKE AI SHOWCASE</span>
                </div>
                <div className="preview-body">
                  <div className="preview-kicker">PROJECT / STUDENT WORK</div>
                  <h2 className="preview-project-title" data-testid="text-preview-title">{draft.title || 'Your project title'}</h2>
                  {projectHref && <a className="preview-paragraph" href={projectHref} target="_blank" rel="noreferrer" data-testid="link-preview-project"><ExternalLink size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />View project</a>}
                  <p className={`preview-summary ${draft.summary ? '' : 'preview-missing'}`} data-testid="text-preview-summary">{draft.summary || 'A short description of what you made will appear here.'}</p>
                  <div className="preview-divider" />
                  <div className="preview-label">The problem</div>
                  <p className={`preview-paragraph ${draft.problem ? '' : 'preview-missing'}`} data-testid="text-preview-problem">{draft.problem || 'What were you trying to solve or understand?'}</p>
                  <div className="preview-divider" />
                  <div className="preview-label">My contribution</div>
                  <p className={`preview-paragraph ${draft.contribution ? '' : 'preview-missing'}`} data-testid="text-preview-contribution">{draft.contribution || 'Your specific role and decisions belong here.'}</p>
                  <div className="preview-divider" />
                  <div className="preview-label">Process & validation</div>
                  <p className={`preview-paragraph ${draft.process || draft.validation ? '' : 'preview-missing'}`} data-testid="text-preview-process">{[draft.process, draft.validation ? `Checked: ${draft.validation}` : ''].filter(Boolean).join(' ') || 'How you worked and what you checked will appear here.'}</p>
                  <div className="preview-divider" />
                  <div className="preview-label">Outcome & boundaries</div>
                  <p className={`preview-paragraph ${draft.impact || draft.limitations ? '' : 'preview-missing'}`} data-testid="text-preview-impact">{[draft.impact, draft.limitations ? `Limitations: ${draft.limitations}` : ''].filter(Boolean).join(' ') || 'Share what came out of it—and what is still uncertain.'}</p>
                  {draft.skills.length > 0 && <div className="preview-skills">{draft.skills.map((skill, index) => <span className="preview-skill" key={`${skill}-preview`} data-testid={`text-preview-skill-${index}`}>{skill}</span>)}</div>}
                </div>
                <div className="preview-foot"><TriangleAlert size={13} /><span>Draft preview only. Confirm every detail and link before you share it.</span></div>
              </section>

              <section className="preview-card output-card" id="showcase-output">
                <div className="output-head"><h3>Showcase description</h3><span>EDITABLE · FROM YOUR INPUT</span></div>
                <p className="field-hint">A plain-language starting point for your Handshake AI Showcase. Nothing is added unless you enter it.</p>
                <textarea className="output-copy" aria-label="Editable Showcase description" value={description} onChange={handleDescriptionChange} data-testid="input-showcase-description" />
                <div className="confirmation" data-testid="status-needs-confirmation"><TriangleAlert size={13} /><span><strong>Needs your confirmation:</strong> review the wording, evidence, and any claim before publishing. This draft does not verify your work.</span></div>
                <div className="output-actions">
                  <button className="btn" type="button" onClick={() => update('descriptionOverride', '')} data-testid="button-regenerate-description"><Sparkles size={14} /> Refresh text</button>
                  <button className="btn btn-primary" type="button" onClick={() => copyText(description, 'Showcase description copied.')} data-testid="button-copy-description"><Copy size={14} /> Copy text</button>
                </div>
                <div className="preview-divider" />
                <div className="output-actions">
                  <button className="btn" type="button" onClick={saveDraft} data-testid="button-save-local"><Save size={14} /> Save locally</button>
                  <button className="btn btn-primary" type="button" onClick={createShareLink} data-testid="button-create-share-link"><Link2 size={14} /> Create share link <ArrowUpRight size={13} /></button>
                </div>
                <div className="below-note"><LockKeyhole size={13} /> Saving stays on this device. Share links contain the draft in their URL.</div>
              </section>
            </aside>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <button className="add-link" type="button" onClick={loadDemo} data-testid="button-load-demo"><BookOpenCheck size={13} /> Load the sample project</button>
            <span className="required-note" data-testid="text-active-section">{sectionLabel(activeSection).toUpperCase()}</span>
          </div>
        </div>
      </main>
      {toast && <div className="toast-message" role="status" aria-live="polite" data-testid="status-toast"><Check size={15} />{toast}</div>}
    </div>
  );
}

export default App;
