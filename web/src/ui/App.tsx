import { useMemo, useState, useEffect } from 'react';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  FileWarning,
  Filter,
  Landmark,
  Play,
  ShieldCheck,
  Sparkles,
  Waves,
  Search,
  X,
  Database,
  SlidersHorizontal,
  Lock,
  Cpu,
  RefreshCw,
  Clock,
  FileText,
  Check,
  Hash
} from 'lucide-react';

type Status = 'ALL' | 'VERIFIED' | 'PROBABLE' | 'INSUFFICIENT' | 'CONFLICTING';

interface CaseItem {
  id: string;
  utr: string;
  customer: string;
  amount: string;
  status: 'VERIFIED' | 'PROBABLE' | 'CONFLICTING' | 'INSUFFICIENT';
  state: string;
  steps: string;
  gstin?: string;
  ruleApplied?: string;
  confidence?: string;
  invoiceNo?: string;
  bankRef?: string;
}

const rawCases: CaseItem[] = [
  {
    id: 'CASE-0007',
    utr: 'UTR839201',
    customer: 'ABC Infra Private Limited',
    amount: '₹15,08,000',
    status: 'VERIFIED',
    state: 'PENDING_APPROVAL',
    steps: '6',
    gstin: '27AAACA1234F1Z8',
    ruleApplied: 'Rule 4.2 · Exact Paise & UTR Verified Match',
    confidence: '99.8%',
    invoiceNo: 'INV-2026-9042',
    bankRef: 'HDFC-NEFT-9283710'
  },
  {
    id: 'CASE-0008',
    utr: 'UTR839202',
    customer: 'ABC Infra Private Limited',
    amount: '₹15,08,000',
    status: 'PROBABLE',
    state: 'AWAITING_EVIDENCE',
    steps: '7',
    gstin: '27AAACA1234F1Z8',
    ruleApplied: 'Rule 3.1 · Multi-Invoice Heuristic Matching',
    confidence: '84.2%',
    invoiceNo: 'INV-2026-9043',
    bankRef: 'HDFC-NEFT-9283711'
  },
  {
    id: 'CASE-0009',
    utr: 'UTR839203',
    customer: 'ABC Infra Private Limited',
    amount: '₹15,08,000',
    status: 'CONFLICTING',
    state: 'NEEDS_REVIEW',
    steps: '5',
    gstin: '27AAACA1234F1Z8',
    ruleApplied: 'Rule 7.4 · Source Amount Discrepancy Flag',
    confidence: '42.0%',
    invoiceNo: 'INV-2026-9044',
    bankRef: 'ICICI-RTGS-104928'
  },
  {
    id: 'CASE-0010',
    utr: 'UTR839204',
    customer: 'Mitra Enterprises',
    amount: '₹8,24,000',
    status: 'INSUFFICIENT',
    state: 'NEEDS_REVIEW',
    steps: '4',
    gstin: '29BBBCB5678G2Z1',
    ruleApplied: 'Rule 2.8 · Remittance Advice Missing UTR',
    confidence: '31.5%',
    invoiceNo: 'INV-2026-8819',
    bankRef: 'SBI-INB-772910'
  },
];

const tiles = [
  { label: 'Auto-closed', count: '10', tone: 'neutral', caption: 'Matched without intervention', filterKey: 'ALL' as const },
  { label: 'Verified', count: '16', tone: 'verified', caption: 'Evidence complete', filterKey: 'VERIFIED' as const },
  { label: 'Probable', count: '6', tone: 'probable', caption: 'Awaiting confirmation', filterKey: 'PROBABLE' as const },
  { label: 'Insufficient', count: '4', tone: 'insufficient', caption: 'More evidence needed', filterKey: 'INSUFFICIENT' as const },
  { label: 'Conflicting', count: '4', tone: 'conflicting', caption: 'Source mismatch found', filterKey: 'CONFLICTING' as const },
] as const;

const formatState = (state: string) =>
  state.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());

export function App() {
  const [filter, setFilter] = useState<Status>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [batchStarted, setBatchStarted] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);
  const [auditVerified, setAuditVerified] = useState(false);
  const [verifyingAudit, setVerifyingAudit] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [activeNav, setActiveNav] = useState('overview');

  const visibleCases = useMemo(() => {
    return rawCases.filter(c => {
      const matchesFilter = filter === 'ALL' ? true : c.status === filter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        c.id.toLowerCase().includes(q) ||
        c.utr.toLowerCase().includes(q) ||
        c.customer.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [filter, searchQuery]);

  const handleRunBatch = () => {
    setBatchRunning(true);
    setTimeout(() => {
      setBatchRunning(false);
      setBatchStarted(true);
    }, 900);
  };

  const handleVerifyAudit = () => {
    setVerifyingAudit(true);
    setTimeout(() => {
      setVerifyingAudit(false);
      setAuditVerified(true);
    }, 800);
  };

  const handleTileClick = (targetStatus: Status) => {
    setFilter(prev => prev === targetStatus ? 'ALL' : targetStatus);
  };

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCase) {
        setSelectedCase(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCase]);

  return (
    <div className="shell">
      {/* Refined Executive Light Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">
              <ShieldCheck size={18} />
            </span>
            <div className="brand-text">
              <span className="brand-name">Artemis</span>
              <span className="brand-version">v2.4 Enterprise</span>
            </div>
          </div>
          
          <div className="workspace-pill" title="Deterministic synthetic AR sandbox">
            <span className="pulse-dot" aria-hidden="true" />
            <span className="workspace-label">Live workspace</span>
            <span className="workspace-tag">Replay</span>
          </div>
        </div>

        <nav aria-label="Primary navigation" className="sidebar-nav">
          <a
            className={activeNav === 'overview' ? 'active' : ''}
            href="#dashboard"
            onClick={() => setActiveNav('overview')}
          >
            <Landmark aria-hidden="true" size={17} />
            <span>Overview</span>
          </a>
          <a
            className={activeNav === 'cases' ? 'active' : ''}
            href="#cases"
            onClick={() => setActiveNav('cases')}
          >
            <Waves aria-hidden="true" size={17} />
            <span>Case queue</span>
            <span className="nav-badge">4</span>
          </a>
          <a
            className={activeNav === 'audit' ? 'active' : ''}
            href="#audit"
            onClick={() => setActiveNav('audit')}
          >
            <ShieldCheck aria-hidden="true" size={17} />
            <span>Audit ledger</span>
            {auditVerified && <span className="nav-badge-verified"><Check size={11} /></span>}
          </a>
          <a
            className={activeNav === 'rules' ? 'active' : ''}
            href="#dashboard"
            onClick={(e) => { e.preventDefault(); setActiveNav('rules'); }}
          >
            <SlidersHorizontal aria-hidden="true" size={17} />
            <span>Policy rules</span>
          </a>
          <a
            className={activeNav === 'traces' ? 'active' : ''}
            href="#dashboard"
            onClick={(e) => { e.preventDefault(); setActiveNav('traces'); }}
          >
            <Cpu aria-hidden="true" size={17} />
            <span>Agent traces</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="env-meta-card">
            <div className="env-row">
              <span className="env-kicker">Environment</span>
              <span className="env-ping"><span className="pulse-dot green" /> 24ms</span>
            </div>
            <strong>Synthetic AR · Q2 FY 2026-27</strong>
            <div className="env-sub">
              <span>40 cases in view</span>
              <span>Genesis #4a91</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main id="dashboard" className="main-viewport">
        {/* Ambient Top Bar */}
        <header className="topline">
          <div className="topline-left">
            <span className="topline-badge">
              <Sparkles size={13} aria-hidden="true" />
              Evidence-first autonomous reconciliation
            </span>
            <span className="topline-divider">/</span>
            <span className="topline-sub">Member 3 Assurance Lane</span>
          </div>
          <div className="topline-right">
            <span className="topline-meta">
              <Clock size={12} aria-hidden="true" />
              Last refreshed · just now
            </span>
            <button
              className="refresh-btn"
              title="Refresh ledger feed"
              aria-label="Refresh feed"
              onClick={() => {}}
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <header className="hero">
          <div className="hero-atmosphere" aria-hidden="true" />
          <div className="hero-copy">
            <div className="eyebrow-container">
              <span className="eyebrow-pill">RECONCILIATION CONTROL ROOM</span>
              <span className="eyebrow-rule">Policy v2.4 Enforced</span>
            </div>
            <h1>
              Clarity for every <em>receipt.</em>
            </h1>
            <p className="hero-lead">
              Trace every clearance to its verified evidence, policy rule, and attributable review — all from one calm, precision operating surface.
            </p>
            <div className="hero-meta">
              <span className="hero-chip">
                <CheckCircle2 size={15} aria-hidden="true" />
                <strong>100%</strong> audit traceability
              </span>
              <span className="hero-chip">
                <Activity size={15} aria-hidden="true" />
                <strong>40</strong> cases in view
              </span>
              <span className="hero-chip">
                <Lock size={14} aria-hidden="true" />
                Zero unverified variance
              </span>
            </div>
          </div>

          <div className="hero-action-deck">
            <div className="hero-action-surface">
              <div className="action-header">
                <div className="action-orb" aria-hidden="true">
                  <Play size={18} fill="currentColor" />
                </div>
                <div className="action-title-wrap">
                  <strong>{batchStarted ? 'Batch replay is active' : 'Ready to reconcile'}</strong>
                  <span>{batchStarted ? '40 cases loaded for instant review' : 'Deterministic replay mode configured'}</span>
                </div>
              </div>
              <p className="action-subtext">
                Applies Member 1 policy gates and Member 2 tool hypotheses with zero direct financial mutations.
              </p>
              <button
                className={`primary hero-btn ${batchRunning ? 'running' : ''}`}
                onClick={handleRunBatch}
                disabled={batchRunning}
              >
                {batchRunning ? (
                  <>
                    <RefreshCw size={15} className="spin-icon" aria-hidden="true" />
                    Reconciling batch...
                  </>
                ) : batchStarted ? (
                  <>
                    <CheckCircle2 size={15} aria-hidden="true" />
                    Batch loaded (Re-run)
                  </>
                ) : (
                  <>
                    <Play size={15} aria-hidden="true" fill="currentColor" />
                    Run batch
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Batch Progress HUD - Locked Intro Animation: .progress-card.reveal */}
        <section className="progress-card reveal" aria-label="Batch progress">
          <div className="progress-intro">
            <div className="progress-title-block">
              <div className="eyebrow-wrap">
                <p className="eyebrow">LATEST RECONCILIATION</p>
                <span className="batch-hash">#BATCH-DEMO-2026-Q2</span>
              </div>
              <div className="batch-info-line">
                <strong className="batch-name">BATCH-DEMO</strong>
                <span className="badge replay">Replay mode</span>
                <span className="badge-ghost">Deterministic</span>
              </div>
            </div>
            <div className="progress-stat">
              <span className="completion-value">100%</span>
              <span className="completion-label">Complete · 1.4s</span>
            </div>
          </div>

          <div className="progress-container">
            <div className="progress" aria-label="40 of 40 cases processed">
              <i style={{ width: '100%' }} />
            </div>
            <div className="progress-ticks">
              <span className="tick active" title="Ingestion verified">01 Ingest</span>
              <span className="tick active" title="Rule heuristic run">02 Heuristics</span>
              <span className="tick active" title="Multi-agent tool paths">03 Tool Paths</span>
              <span className="tick active" title="Audit Hash sealed">04 Ledger Sealed</span>
            </div>
          </div>

          <div className="progress-footer">
            <span className="progress-footer-left">
              <Database size={13} aria-hidden="true" />
              <strong>40 of 40</strong> cases processed safely
            </span>
            <span className="progress-footer-right">
              <ShieldCheck size={13} aria-hidden="true" />
              Completed safely with 8 recorded tool paths
            </span>
          </div>
        </section>

        {/* Status Intelligence Tiles - Locked Intro Animation: .tiles.reveal */}
        <section className="tiles reveal" aria-label="Case status counts">
          {tiles.map(({ label, count, tone, caption, filterKey }) => {
            const isSelected = filter === filterKey && filterKey !== 'ALL';
            return (
              <article
                className={`tile ${tone} ${isSelected ? 'tile-active' : ''}`}
                key={label}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                onClick={() => handleTileClick(filterKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTileClick(filterKey);
                  }
                }}
                title={`Filter queue by ${label}`}
              >
                <div className="tile-ambient-glow" aria-hidden="true" />
                <div className="tile-top">
                  <span className="tile-label">{label}</span>
                  <span className="tile-tone-pill" />
                </div>
                <strong className="tile-metric">{count}</strong>
                <div className="tile-footer">
                  <small>{caption}</small>
                  <ChevronRight size={15} aria-hidden="true" className="tile-arrow" />
                </div>
              </article>
            );
          })}
        </section>

        {/* Operational Insights Dual-Deck - Locked Intro Animation: .summary-grid.reveal */}
        <section className="summary-grid reveal">
          {/* Exposure Summary Deck */}
          <article className="panel exposure-panel">
            <div className="panel-ambient" aria-hidden="true" />
            <div className="panel-heading">
              <div>
                <p className="eyebrow">EXPOSURE DECOMPOSITION</p>
                <h2>₹58,42,000</h2>
                <p className="subtle">Apparent variance investigated across 40 accounts</p>
              </div>
              <span className="icon-well blue" aria-hidden="true">
                <Activity size={19} />
              </span>
            </div>

            <div className="exposure-visual">
              <div className="exposure-track" aria-label="72 percent explained">
                <span className="track-fill-verified" style={{ width: '72%' }} />
                <span className="track-fill-held" style={{ width: '28%' }} />
              </div>
              <div className="exposure-legend">
                <span className="legend-item verified-legend">
                  <i /> Verified explanation (72%)
                </span>
                <span className="legend-item held-legend">
                  <i /> Held for human review (28%)
                </span>
              </div>
            </div>

            <dl className="panel-dl">
              <div className="dl-item">
                <dt>Verified explanation</dt>
                <dd>
                  ₹42,12,000 <small className="tag-positive">72% resolved</small>
                </dd>
                <p className="dl-subtext">Backed by bank UTR + GST e-invoices</p>
              </div>
              <div className="dl-item">
                <dt>Held for review</dt>
                <dd>
                  ₹16,30,000 <small className="tag-warning">28% queued</small>
                </dd>
                <p className="dl-subtext">Requires human exception sign-off</p>
              </div>
            </dl>
          </article>

          {/* Quality Gates Deck */}
          <article className="panel quality-panel">
            <div className="panel-ambient" aria-hidden="true" />
            <div className="panel-heading">
              <div>
                <p className="eyebrow">QUALITY GATES & ASSURANCE</p>
                <h2>Clearance confidence</h2>
                <p className="subtle">Policy-enforced verification thresholds</p>
              </div>
              <span className="icon-well sage" aria-hidden="true">
                <ShieldCheck size={19} />
              </span>
            </div>

            <div className="metrics">
              <div className="metric-pod">
                <div className="metric-pod-icon">
                  <CheckCircle2 size={16} aria-hidden="true" />
                </div>
                <strong>100%</strong>
                <small>Verified precision</small>
                <span className="metric-badge">Zero false positive</span>
              </div>
              <div className="metric-pod">
                <div className="metric-pod-icon">
                  <CheckCircle2 size={16} aria-hidden="true" />
                </div>
                <strong>100%</strong>
                <small>Evidence coverage</small>
                <span className="metric-badge">Genesis linked</span>
              </div>
              <div className="metric-pod">
                <div className="metric-pod-icon">
                  <Waves size={16} aria-hidden="true" />
                </div>
                <strong>8</strong>
                <small>Distinct tool paths</small>
                <span className="metric-badge">Multi-agent</span>
              </div>
            </div>

            <div className="gate-footer">
              <span className="gate-tag">
                <Lock size={12} aria-hidden="true" /> Strict Non-Negotiable
              </span>
              <p>The API never computes paise directly; all transitions delegate to Member 1 policy.</p>
            </div>
          </article>
        </section>

        {/* Case Queue Command Table - Locked Intro Animation: .panel.cases.reveal */}
        <section className="panel cases reveal" id="cases">
          <div className="panel-ambient" aria-hidden="true" />
          <div className="section-head">
            <div>
              <div className="section-eyebrow-row">
                <p className="eyebrow">CASE QUEUE</p>
                <span className="live-case-tag">Live Feed</span>
              </div>
              <h2>
                Investigated receipts <span className="count-pill">{visibleCases.length}</span>
              </h2>
              <p className="subtle">Prioritised by the cryptographic evidence required to make a safe clearance decision.</p>
            </div>

            <div className="controls-group">
              {/* Quick Search Input */}
              <div className="search-control">
                <Search size={14} aria-hidden="true" className="search-icon" />
                <input
                  type="text"
                  placeholder="Filter case, UTR, or counterparty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search cases"
                />
                {searchQuery && (
                  <button
                    className="clear-search"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Status Select Control */}
              <div className="filter-control">
                <Filter size={15} aria-hidden="true" />
                <label htmlFor="status-filter">Status:</label>
                <select
                  id="status-filter"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value as Status)}
                >
                  <option value="ALL">All statuses (40)</option>
                  <option value="VERIFIED">Verified (16)</option>
                  <option value="PROBABLE">Probable (6)</option>
                  <option value="CONFLICTING">Conflicting (4)</option>
                  <option value="INSUFFICIENT">Insufficient (4)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Pills Bar */}
          <div className="status-pills-bar" role="tablist" aria-label="Status filters">
            {(['ALL', 'VERIFIED', 'PROBABLE', 'CONFLICTING', 'INSUFFICIENT'] as const).map((st) => (
              <button
                key={st}
                className={`filter-pill ${filter === st ? 'active' : ''}`}
                onClick={() => setFilter(st)}
                role="tab"
                aria-selected={filter === st}
              >
                {st === 'ALL' ? 'All cases' : formatState(st)}
                <span className="pill-count">
                  {st === 'ALL' ? 4 : rawCases.filter(c => c.status === st).length}
                </span>
              </button>
            ))}
          </div>

          {/* Interactive Case Table */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Case ID & UTR</th>
                  <th scope="col">Counterparty</th>
                  <th scope="col">Receipt Amount</th>
                  <th scope="col">Verification Status</th>
                  <th scope="col">Workflow State</th>
                  <th scope="col">Tool Steps</th>
                  <th scope="col">
                    <span className="sr-only">Inspect case</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleCases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      <div className="empty-wrap">
                        <FileText size={28} aria-hidden="true" />
                        <p>No matching reconciliation cases found.</p>
                        <button className="secondary btn-sm" onClick={() => { setFilter('ALL'); setSearchQuery(''); }}>
                          Reset filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleCases.map((caseItem) => (
                    <tr
                      key={caseItem.id}
                      className={selectedCase?.id === caseItem.id ? 'active-row' : ''}
                      onClick={() => setSelectedCase(caseItem)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setSelectedCase(caseItem);
                      }}
                      title="Click to inspect evidence trail"
                    >
                      <td className="col-case">
                        <div className="case-id-wrap">
                          <strong className="case-id">{caseItem.id}</strong>
                          <span className="case-utr">
                            <Hash size={10} aria-hidden="true" />
                            {caseItem.utr}
                          </span>
                        </div>
                      </td>
                      <td className="col-customer">
                        <div className="customer-cell">
                          <span className="customer-name">{caseItem.customer}</span>
                          <span className="customer-tag">Corporate AR</span>
                        </div>
                      </td>
                      <td className="amount col-amount">
                        <span className="currency-val">{caseItem.amount}</span>
                        <span className="fraction-val">.00</span>
                      </td>
                      <td>
                        <span className={`badge ${caseItem.status.toLowerCase()}`}>
                          <span className="badge-bullet" />
                          {caseItem.status}
                        </span>
                      </td>
                      <td>
                        <span className="state-label">
                          <span className="state-dot" />
                          {formatState(caseItem.state)}
                        </span>
                      </td>
                      <td>
                        <span className="steps" title={`${caseItem.steps} distinct tool executions`}>
                          {caseItem.steps}
                        </span>
                      </td>
                      <td className="col-action">
                        <button
                          className="row-action"
                          aria-label={`Inspect ${caseItem.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCase(caseItem);
                          }}
                          title="Open evidence inspection"
                        >
                          <ArrowUpRight size={16} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer-notes">
            <span>Showing {visibleCases.length} of 4 fixture items (40 synthetic batch cases represented)</span>
            <span className="table-contract-note">Contract: Member 1 Policy Engine Verified</span>
          </div>
        </section>

        {/* Cryptographic Audit Ledger Banner - Locked Intro Animation: .audit-strip.reveal */}
        <section
          id="audit"
          className={`audit-strip reveal ${auditVerified ? 'verified-audit' : ''}`}
        >
          <div className="audit-ambient" aria-hidden="true" />
          <span className="audit-icon" aria-hidden="true">
            {auditVerified ? <CheckCircle2 size={21} /> : <FileWarning size={21} />}
          </span>
          <div className="audit-content">
            <div className="audit-status-line">
              <strong>{auditVerified ? 'Audit chain verified & anchored' : 'Audit chain healthy'}</strong>
              <span className="audit-tag">
                {auditVerified ? 'SHA-256 Validated' : 'Merkle Tree Genesis #4a91'}
              </span>
            </div>
            <span>
              {auditVerified
                ? 'All 40 ledger events successfully verified from the genesis record onward. Predecessor hashes match.'
                : 'Every clearance decision remains strictly traceable to its predecessor cryptographic hash.'}
            </span>
          </div>
          <button
            className="secondary audit-btn"
            onClick={handleVerifyAudit}
            disabled={verifyingAudit}
          >
            {verifyingAudit ? (
              <>
                <RefreshCw size={15} className="spin-icon" aria-hidden="true" />
                Verifying chain...
              </>
            ) : auditVerified ? (
              <>
                <CheckCircle2 size={16} aria-hidden="true" />
                Verified
              </>
            ) : (
              <>
                <ShieldCheck size={16} aria-hidden="true" />
                Verify chain
              </>
            )}
          </button>
        </section>

        {/* Case Inspection Drawer Modal */}
        {selectedCase && (
          <div className="drawer-overlay" onClick={() => setSelectedCase(null)}>
            <div
              className="drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="drawer-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="drawer-header">
                <div>
                  <div className="drawer-kicker">
                    <span>EVIDENCE DRILLDOWN</span>
                    <span className="drawer-conf">Confidence: {selectedCase.confidence || '99.5%'}</span>
                  </div>
                  <h3 id="drawer-title">{selectedCase.id}</h3>
                  <p className="drawer-sub">{selectedCase.customer}</p>
                </div>
                <button
                  className="drawer-close"
                  onClick={() => setSelectedCase(null)}
                  aria-label="Close evidence inspector"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="drawer-body">
                {/* Status & Amount Block */}
                <div className="drawer-metric-card">
                  <div className="drawer-metric-col">
                    <span className="drawer-label">Total Invoiced Amount</span>
                    <strong className="drawer-amount">{selectedCase.amount}</strong>
                  </div>
                  <div className="drawer-status-col">
                    <span className={`badge ${selectedCase.status.toLowerCase()}`}>
                      {selectedCase.status}
                    </span>
                    <span className="state-label">{formatState(selectedCase.state)}</span>
                  </div>
                </div>

                {/* Evidence Chain */}
                <div className="drawer-section">
                  <h4 className="drawer-section-title">
                    <ShieldCheck size={15} aria-hidden="true" />
                    Cryptographic Evidence Provenance
                  </h4>
                  <div className="evidence-list">
                    <div className="evidence-item">
                      <div className="evidence-bullet active-bullet" />
                      <div className="evidence-info">
                        <strong>Bank UTR Clearance Receipt</strong>
                        <span>Reference: {selectedCase.utr} · Cleared via {selectedCase.bankRef || 'HDFC-NEFT'}</span>
                      </div>
                      <span className="evidence-badge">Match</span>
                    </div>

                    <div className="evidence-item">
                      <div className="evidence-bullet active-bullet" />
                      <div className="evidence-info">
                        <strong>GSTIN & Entity Registration</strong>
                        <span>Verified: {selectedCase.gstin || '27AAACA1234F1Z8'} · Active Taxpayer</span>
                      </div>
                      <span className="evidence-badge">Tax Verified</span>
                    </div>

                    <div className="evidence-item">
                      <div className="evidence-bullet active-bullet" />
                      <div className="evidence-info">
                        <strong>Purchase Order & Invoice Link</strong>
                        <span>Matched to: {selectedCase.invoiceNo || 'INV-2026-9042'}</span>
                      </div>
                      <span className="evidence-badge">Paise Exact</span>
                    </div>

                    <div className="evidence-item">
                      <div className="evidence-bullet active-bullet" />
                      <div className="evidence-info">
                        <strong>Policy Rule Enforced</strong>
                        <span>{selectedCase.ruleApplied || 'Rule 4.2: Direct UTR + Paise Balance'}</span>
                      </div>
                      <span className="evidence-badge policy-badge">Member 1</span>
                    </div>
                  </div>
                </div>

                {/* Hash Ledger Verification */}
                <div className="drawer-hash-card">
                  <div className="hash-header">
                    <Lock size={13} aria-hidden="true" />
                    <span>Cryptographic Block Signature</span>
                  </div>
                  <code className="hash-code">
                    sha256:8f2a991bce045a2789d311fa80c3298c55e921d70bb8
                  </code>
                  <p className="hash-desc">
                    Immutable signature linked to Genesis event #4a91. Zero manual overrides recorded.
                  </p>
                </div>
              </div>

              <div className="drawer-footer">
                <button
                  className="secondary drawer-btn"
                  onClick={() => setSelectedCase(null)}
                >
                  Dismiss
                </button>
                <button
                  className="primary drawer-btn"
                  onClick={() => {
                    setSelectedCase(null);
                  }}
                >
                  Acknowledge Record
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="sr-only" aria-live="polite">
          {batchStarted ? 'Batch replay loaded.' : ''}
          {auditVerified ? ' Audit chain verified.' : ''}
          {selectedCase ? `Inspecting ${selectedCase.id}.` : ''}
        </p>
      </main>
    </div>
  );
}
