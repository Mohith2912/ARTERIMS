import { Activity, CheckCircle2, CircleAlert, FileWarning, Play, ShieldCheck } from 'lucide-react';

const tiles = [
  ['Auto-closed', '10', 'neutral'], ['Verified', '16', 'verified'], ['Probable', '6', 'probable'], ['Insufficient', '4', 'insufficient'], ['Conflicting', '4', 'conflicting'],
];

const cases = [
  ['CASE-0007', 'UTR839201', 'ABC Infra Private Limited', '₹15,08,000', 'VERIFIED', 'PENDING_APPROVAL', '6'],
  ['CASE-0008', 'UTR839202', 'ABC Infra Private Limited', '₹15,08,000', 'PROBABLE', 'AWAITING_EVIDENCE', '7'],
  ['CASE-0009', 'UTR839203', 'ABC Infra Private Limited', '₹15,08,000', 'CONFLICTING', 'NEEDS_REVIEW', '5'],
  ['CASE-0010', 'UTR839204', 'Mitra Enterprises', '₹8,24,000', 'INSUFFICIENT', 'NEEDS_REVIEW', '4'],
];

export function App() {
  return <div className="shell">
    <aside><div className="brand"><ShieldCheck aria-hidden="true" /> Artemis</div><nav><a className="active" href="#dashboard">Dashboard</a><a href="#cases">Cases</a><a href="#audit">Audit ledger</a></nav><div className="side-note">Synthetic AR environment<br/><strong>40 cases · Q2 FY 2026-27</strong></div></aside>
    <main id="dashboard">
      <header><div><p className="eyebrow">RECONCILIATION CONTROL ROOM</p><h1>Accounts receivable, explained.</h1><p className="subtle">Every clearance is traceable to evidence, policy, and an attributable review.</p></div><button className="primary"><Play size={17} aria-hidden="true" /> Run batch</button></header>
      <section className="progress-card" aria-label="Batch progress"><div><span>Latest batch <strong>BATCH-DEMO</strong></span><span className="badge replay">Replay mode</span></div><div className="progress"><i /></div><p>40 of 40 cases processed · completed</p></section>
      <section className="tiles" aria-label="Case status counts">{tiles.map(([label, value, tone]) => <article className={`tile ${tone}`} key={label}><span>{label}</span><strong>{value}</strong><small>cases</small></article>)}</section>
      <section className="summary-grid"><article className="panel"><div className="panel-heading"><div><p className="eyebrow">EXPOSURE SUMMARY</p><h2>₹58,42,000</h2><p className="subtle">Apparent variance investigated</p></div><Activity aria-hidden="true" /></div><dl><div><dt>Verified explanation</dt><dd>₹42,12,000</dd></div><div><dt>Held for review</dt><dd>₹16,30,000</dd></div></dl></article><article className="panel"><p className="eyebrow">QUALITY GATES</p><div className="metrics"><span><CheckCircle2 aria-hidden="true" />100%<small>Verified precision</small></span><span><CheckCircle2 aria-hidden="true" />100%<small>Evidence coverage</small></span><span><CheckCircle2 aria-hidden="true" />8<small>Tool paths</small></span></div></article></section>
      <section className="panel cases" id="cases"><div className="section-head"><div><p className="eyebrow">CASE QUEUE</p><h2>Investigated receipts</h2></div><label>Filter status <select aria-label="Filter cases by status"><option>All statuses</option><option>Verified</option><option>Probable</option><option>Conflicting</option></select></label></div><div className="table-wrap"><table><thead><tr><th>Case</th><th>Customer</th><th>Receipt</th><th>Status</th><th>State</th><th>Steps</th></tr></thead><tbody>{cases.map(c => <tr key={c[0]}><td><strong>{c[0]}</strong><small>{c[1]}</small></td><td>{c[2]}</td><td>{c[3]}</td><td><span className={`badge ${c[4].toLowerCase()}`}>{c[4]}</span></td><td>{c[5].replace('_', ' ')}</td><td>{c[6]}</td></tr>)}</tbody></table></div></section>
      <section id="audit" className="audit-strip"><FileWarning aria-hidden="true" /><div><strong>Audit chain healthy</strong><span>All appended events verify against their predecessor hash.</span></div><button className="secondary">Verify chain</button></section>
    </main>
  </div>;
}
