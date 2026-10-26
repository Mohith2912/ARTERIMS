import { useMemo, useState } from 'react';
import { Activity, ArrowUpRight, CheckCircle2, ChevronRight, FileWarning, Filter, Landmark, Play, ShieldCheck, Sparkles, Waves } from 'lucide-react';

type Status = 'ALL' | 'VERIFIED' | 'PROBABLE' | 'INSUFFICIENT' | 'CONFLICTING';

const tiles = [
  ['Auto-closed', '10', 'neutral', 'Matched without intervention'], ['Verified', '16', 'verified', 'Evidence complete'], ['Probable', '6', 'probable', 'Awaiting confirmation'], ['Insufficient', '4', 'insufficient', 'More evidence needed'], ['Conflicting', '4', 'conflicting', 'Source mismatch found'],
] as const;

const cases = [
  ['CASE-0007', 'UTR839201', 'ABC Infra Private Limited', '₹15,08,000', 'VERIFIED', 'PENDING_APPROVAL', '6'],
  ['CASE-0008', 'UTR839202', 'ABC Infra Private Limited', '₹15,08,000', 'PROBABLE', 'AWAITING_EVIDENCE', '7'],
  ['CASE-0009', 'UTR839203', 'ABC Infra Private Limited', '₹15,08,000', 'CONFLICTING', 'NEEDS_REVIEW', '5'],
  ['CASE-0010', 'UTR839204', 'Mitra Enterprises', '₹8,24,000', 'INSUFFICIENT', 'NEEDS_REVIEW', '4'],
] as const;

const formatState = (state: string) => state.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());

export function App() {
  const [filter, setFilter] = useState<Status>('ALL');
  const [batchStarted, setBatchStarted] = useState(false);
  const [auditVerified, setAuditVerified] = useState(false);
  const visibleCases = useMemo(() => filter === 'ALL' ? cases : cases.filter((caseItem) => caseItem[4] === filter), [filter]);

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand-lockup"><span className="brand-mark"><ShieldCheck aria-hidden="true" /></span><span>Artemis</span></div>
      <div className="workspace-pill"><span className="pulse-dot" aria-hidden="true" /> Live workspace</div>
      <nav aria-label="Primary navigation">
        <a className="active" href="#dashboard"><Landmark aria-hidden="true" /> Overview</a>
        <a href="#cases"><Waves aria-hidden="true" /> Case queue <span>4</span></a>
        <a href="#audit"><ShieldCheck aria-hidden="true" /> Audit ledger</a>
      </nav>
      <div className="sidebar-footer"><p>Environment</p><strong>Synthetic AR · Q2 FY 2026-27</strong><span>40 reconciliation cases</span></div>
    </aside>

    <main id="dashboard">
      <div className="topline"><span><Sparkles size={14} aria-hidden="true" /> Evidence-first reconciliation</span><span>Last refreshed · just now</span></div>
      <header className="hero">
        <div className="hero-copy"><p className="eyebrow">RECONCILIATION CONTROL ROOM</p><h1>Clarity for every <em>receipt.</em></h1><p>Trace every clearance to its evidence, policy rule, and accountable review — all from one calm operating surface.</p><div className="hero-meta"><span><CheckCircle2 aria-hidden="true" /> 100% audit traceability</span><span><Activity aria-hidden="true" /> 40 cases in view</span></div></div>
        <div className="hero-action"><div className="action-orb"><Play size={21} fill="currentColor" aria-hidden="true" /></div><div><strong>{batchStarted ? 'Batch replay is ready' : 'Ready to reconcile'}</strong><span>{batchStarted ? '40 cases loaded for review' : 'Use replay mode for a safe demo run'}</span></div><button className="primary" onClick={() => setBatchStarted(true)}><Play size={16} aria-hidden="true" /> {batchStarted ? 'Batch loaded' : 'Run batch'}</button></div>
      </header>

      <section className="progress-card reveal" aria-label="Batch progress"><div className="progress-intro"><div><p className="eyebrow">LATEST RECONCILIATION</p><strong>BATCH-DEMO <span className="badge replay">Replay mode</span></strong></div><span className="completion">100% complete</span></div><div className="progress" aria-label="40 of 40 cases processed"><i /></div><div className="progress-footer"><span>40 of 40 cases processed</span><span>Completed safely with recorded tool paths</span></div></section>

      <section className="tiles reveal" aria-label="Case status counts">{tiles.map(([label, value, tone, caption]) => <article className={`tile ${tone}`} key={label} tabIndex={0}><span className="tile-label">{label}</span><strong>{value}</strong><small>{caption}</small><ChevronRight aria-hidden="true" /></article>)}</section>

      <section className="summary-grid reveal"><article className="panel exposure-panel"><div className="panel-heading"><div><p className="eyebrow">EXPOSURE SUMMARY</p><h2>₹58,42,000</h2><p className="subtle">Apparent variance investigated</p></div><span className="icon-well blue"><Activity aria-hidden="true" /></span></div><div className="exposure-track" aria-label="72 percent explained"><span /></div><dl><div><dt>Verified explanation</dt><dd>₹42,12,000 <small>72%</small></dd></div><div><dt>Held for review</dt><dd>₹16,30,000 <small>28%</small></dd></div></dl></article><article className="panel quality-panel"><div className="panel-heading"><div><p className="eyebrow">QUALITY GATES</p><h2>Clearance confidence</h2></div><span className="icon-well sage"><ShieldCheck aria-hidden="true" /></span></div><div className="metrics"><span><CheckCircle2 aria-hidden="true" /><strong>100%</strong><small>Verified precision</small></span><span><CheckCircle2 aria-hidden="true" /><strong>100%</strong><small>Evidence coverage</small></span><span><Waves aria-hidden="true" /><strong>8</strong><small>Distinct tool paths</small></span></div></article></section>

      <section className="panel cases reveal" id="cases"><div className="section-head"><div><p className="eyebrow">CASE QUEUE</p><h2>Investigated receipts <span>{visibleCases.length}</span></h2><p className="subtle">Prioritised by the evidence required to make a safe decision.</p></div><div className="filter-control"><Filter size={16} aria-hidden="true" /><label htmlFor="status-filter">Show</label><select id="status-filter" value={filter} onChange={(event) => setFilter(event.target.value as Status)}><option value="ALL">All statuses</option><option value="VERIFIED">Verified</option><option value="PROBABLE">Probable</option><option value="CONFLICTING">Conflicting</option><option value="INSUFFICIENT">Insufficient</option></select></div></div><div className="table-wrap"><table><thead><tr><th>Case</th><th>Customer</th><th>Receipt</th><th>Status</th><th>State</th><th>Steps</th><th><span className="sr-only">Open case</span></th></tr></thead><tbody>{visibleCases.map(caseItem => <tr key={caseItem[0]}><td><strong>{caseItem[0]}</strong><small>{caseItem[1]}</small></td><td>{caseItem[2]}</td><td className="amount">{caseItem[3]}</td><td><span className={`badge ${caseItem[4].toLowerCase()}`}>{caseItem[4]}</span></td><td><span className="state-label">{formatState(caseItem[5])}</span></td><td><span className="steps">{caseItem[6]}</span></td><td><button className="row-action" aria-label={`Open ${caseItem[0]}`}><ArrowUpRight size={17} aria-hidden="true" /></button></td></tr>)}</tbody></table></div></section>

      <section id="audit" className={`audit-strip reveal ${auditVerified ? 'verified-audit' : ''}`}><span className="audit-icon"><FileWarning aria-hidden="true" /></span><div><strong>{auditVerified ? 'Audit chain verified' : 'Audit chain healthy'}</strong><span>{auditVerified ? 'Every event is intact from the genesis record onward.' : 'Every decision remains traceable to its predecessor hash.'}</span></div><button className="secondary" onClick={() => setAuditVerified(true)}>{auditVerified ? <><CheckCircle2 size={16} aria-hidden="true" /> Verified</> : 'Verify chain'}</button></section>
      <p className="sr-only" aria-live="polite">{batchStarted ? 'Batch replay loaded.' : ''}{auditVerified ? ' Audit chain verified.' : ''}</p>
    </main>
  </div>;
}
