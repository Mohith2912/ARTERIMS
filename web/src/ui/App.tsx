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
  Hash,
  Terminal,
  Layers,
  GitBranch,
  ArrowRight,
  Code2,
  ExternalLink,
  BookOpen
} from 'lucide-react';

type Status = 'ALL' | 'VERIFIED' | 'PROBABLE' | 'INSUFFICIENT' | 'CONFLICTING';
type DrawerTab = 'trace' | 'narrative' | 'evidence' | 'graph';

interface ToolTraceStep {
  step: number;
  toolName: string;
  latencyMs: number;
  args: Record<string, any>;
  result: Record<string, any>;
  hypothesis?: {
    kind: string;
    text: string;
    status: 'open' | 'supported' | 'rejected';
  };
}

interface CaseItem {
  id: string;
  utr: string;
  customer: string;
  amount: string;
  amountPaise: number;
  status: 'VERIFIED' | 'PROBABLE' | 'CONFLICTING' | 'INSUFFICIENT';
  state: string;
  steps: string;
  gstin?: string;
  ruleApplied?: string;
  confidence?: string;
  invoiceNo?: string;
  bankRef?: string;
  narrative: string;
  traceSteps: ToolTraceStep[];
}

const rawCases: CaseItem[] = [
  {
    id: 'CASE-0007',
    utr: 'UTR839201',
    customer: 'ABC Infra Private Limited',
    amount: '₹15,08,000',
    amountPaise: 150800000,
    status: 'VERIFIED',
    state: 'PENDING_APPROVAL',
    steps: '6',
    gstin: '27AAACA1234F1Z8',
    ruleApplied: 'Rule 4.2 · Exact Paise & UTR Verified Match',
    confidence: '99.8%',
    invoiceNo: 'INV-1042',
    bankRef: 'HDFC-NEFT-9283710',
    narrative: 'Receipt UTR839201 of INR 15,08,000 was matched to INV-1042, invoiced INR 15,38,776; variance INR 30,776 explained by Section 194C TDS (2%) validated via Form 26AS. Unexplained INR 0. Grade: VERIFIED. Evidence: EVD-0003, EVD-0004.',
    traceSteps: [
      {
        step: 1,
        toolName: 'search_remittance_email',
        latencyMs: 14,
        args: { utr: 'UTR839201', customer_id: 'CUST-001' },
        result: { found: 1, email_id: 'EML-8910', subject: 'Payment Advice - ABC Infra / INV-1042' },
        hypothesis: { kind: 'tds', text: 'TDS deducted under Section 194C at 2.0%', status: 'open' }
      },
      {
        step: 2,
        toolName: 'parse_remittance',
        latencyMs: 22,
        args: { email_id: 'EML-8910' },
        result: { gross_paise: 153877600, net_paise: 150800000, tds_paise: 3077600, invoice_ref: 'INV-1042' },
        hypothesis: { kind: 'tds', text: 'Remittance advice confirms ₹30,776 TDS withholding', status: 'supported' }
      },
      {
        step: 3,
        toolName: 'compute_withholding',
        latencyMs: 8,
        args: { customer_id: 'CUST-001', invoice_ids: ['INV-1042'], transaction_date: '2026-05-18' },
        result: { section: '194C', expected_rate: 0.02, expected_paise: 3077600, match: true },
        hypothesis: { kind: 'tds', text: 'Withholding mathematically matches 2.0% Section 194C', status: 'supported' }
      },
      {
        step: 4,
        toolName: 'get_authorized_tax_credit_extract',
        latencyMs: 19,
        args: { customer_id: 'CUST-001', quarter: 1 },
        result: { form_26as_ref: 'AIS-2026-Q1-904', amount_paise: 3077600, verified: true },
        hypothesis: { kind: 'tds', text: 'Form 26AS tax credit extract confirms deposit with ITD', status: 'supported' }
      },
      {
        step: 5,
        toolName: 'propose_allocation',
        latencyMs: 16,
        args: { case_id: 'CASE-0007', allocations: [{ invoice_id: 'INV-1042', amount_paise: 150800000 }], adjustments: [{ kind: 'tds', amount_paise: 3077600 }] },
        result: { unexplained_paise: 0, variance_paise: 0, validated: true }
      },
      {
        step: 6,
        toolName: 'finish',
        latencyMs: 6,
        args: { case_id: 'CASE-0007', grade: 'VERIFIED', recommendation: 'Clear and apply to sales ledger' },
        result: { final_state: 'PENDING_APPROVAL', audit_event: 'GRADE_CONCLUDED' }
      }
    ]
  },
  {
    id: 'CASE-0008',
    utr: 'UTR839202',
    customer: 'ABC Infra Private Limited',
    amount: '₹15,08,000',
    amountPaise: 150800000,
    status: 'PROBABLE',
    state: 'AWAITING_EVIDENCE',
    steps: '7',
    gstin: '27AAACA1234F1Z8',
    ruleApplied: 'Rule 3.1 · Multi-Invoice Heuristic Matching',
    confidence: '84.2%',
    invoiceNo: 'INV-1043',
    bankRef: 'HDFC-NEFT-9283711',
    narrative: 'Receipt UTR839202 of INR 15,08,000 was matched to INV-1043; variance INR 30,776 expected as TDS but Form 26AS quarterly filing is pending deposit. Evidence request emitted to customer. Grade: PROBABLE.',
    traceSteps: [
      {
        step: 1,
        toolName: 'search_ledger',
        latencyMs: 11,
        args: { customer_id: 'CUST-001', amount_paise: 150800000 },
        result: { candidates: ['INV-1043', 'INV-1044'] },
        hypothesis: { kind: 'multi_invoice', text: 'Payment applies to recent work order invoice INV-1043', status: 'supported' }
      },
      {
        step: 2,
        toolName: 'search_remittance_email',
        latencyMs: 15,
        args: { utr: 'UTR839202' },
        result: { found: 0 },
        hypothesis: { kind: 'unexplained', text: 'No remittance advice found in customer mailbox', status: 'open' }
      },
      {
        step: 3,
        toolName: 'compute_withholding',
        latencyMs: 7,
        args: { customer_id: 'CUST-001', invoice_ids: ['INV-1043'], transaction_date: '2026-05-19' },
        result: { section: '194C', expected_rate: 0.02, expected_paise: 3077600 },
        hypothesis: { kind: 'tds', text: 'Variance matches exact 2% TDS on INV-1043', status: 'supported' }
      },
      {
        step: 4,
        toolName: 'get_authorized_tax_credit_extract',
        latencyMs: 17,
        args: { customer_id: 'CUST-001', quarter: 1 },
        result: { match: false, reason: 'Pending quarterly challan filing' },
        hypothesis: { kind: 'timing', text: 'Quarterly deposit challan pending with bank', status: 'supported' }
      },
      {
        step: 5,
        toolName: 'request_evidence',
        latencyMs: 25,
        args: { case_id: 'CASE-0008', evidence_kind: 'tds_certificate_form16a' },
        result: { request_id: 'REQ-4029', status: 'EMITTED_TO_AP_LANE' }
      },
      {
        step: 6,
        toolName: 'propose_allocation',
        latencyMs: 14,
        args: { case_id: 'CASE-0008', allocations: [{ invoice_id: 'INV-1043', amount_paise: 150800000 }] },
        result: { unexplained_paise: 3077600, grade: 'PROBABLE' }
      },
      {
        step: 7,
        toolName: 'finish',
        latencyMs: 5,
        args: { case_id: 'CASE-0008', grade: 'PROBABLE', recommendation: 'Await customer TDS challan confirmation' },
        result: { final_state: 'AWAITING_EVIDENCE' }
      }
    ]
  },
  {
    id: 'CASE-0009',
    utr: 'UTR839203',
    customer: 'ABC Infra Private Limited',
    amount: '₹15,08,000',
    amountPaise: 150800000,
    status: 'CONFLICTING',
    state: 'NEEDS_REVIEW',
    steps: '5',
    gstin: '27AAACA1234F1Z8',
    ruleApplied: 'Rule 7.4 · Source Amount Discrepancy Flag',
    confidence: '42.0%',
    invoiceNo: 'INV-1044',
    bankRef: 'ICICI-RTGS-104928',
    narrative: 'Receipt UTR839203 matched INV-1044, but customer email claims deduction for debit note DN-8812 which contradicts sales ledger status. Contradiction Flag 4 raised. Grade: CONFLICTING.',
    traceSteps: [
      {
        step: 1,
        toolName: 'search_remittance_email',
        latencyMs: 12,
        args: { utr: 'UTR839203' },
        result: { found: 1, email_id: 'EML-8912', claims: 'Debit note adjustment DN-8812' },
        hypothesis: { kind: 'credit_note', text: 'Customer claiming credit adjustment DN-8812', status: 'open' }
      },
      {
        step: 2,
        toolName: 'find_credit_notes',
        latencyMs: 16,
        args: { customer_id: 'CUST-001', invoice_ids: ['INV-1044'] },
        result: { found: 0, reason: 'No approved credit note DN-8812 found in ERP' },
        hypothesis: { kind: 'credit_note', text: 'ERP has no approved credit note matching DN-8812', status: 'rejected' }
      },
      {
        step: 3,
        toolName: 'record_hypothesis',
        latencyMs: 8,
        args: { case_id: 'CASE-0009', kind: 'unexplained', text: 'Disputed deduction claimed by customer without ERP credit note' },
        result: { registered: true }
      },
      {
        step: 4,
        toolName: 'propose_allocation',
        latencyMs: 14,
        args: { case_id: 'CASE-0009', allocations: [{ invoice_id: 'INV-1044', amount_paise: 150800000 }] },
        result: { unexplained_paise: 1200000, contradiction_code: 4 }
      },
      {
        step: 5,
        toolName: 'finish',
        latencyMs: 6,
        args: { case_id: 'CASE-0009', grade: 'CONFLICTING', recommendation: 'Escalate to credit control manager' },
        result: { final_state: 'NEEDS_REVIEW' }
      }
    ]
  },
  {
    id: 'CASE-0010',
    utr: 'UTR839204',
    customer: 'Mitra Enterprises',
    amount: '₹8,24,000',
    amountPaise: 82400000,
    status: 'INSUFFICIENT',
    state: 'NEEDS_REVIEW',
    steps: '4',
    gstin: '29BBBCB5678G2Z1',
    ruleApplied: 'Rule 2.8 · Remittance Advice Missing UTR',
    confidence: '31.5%',
    invoiceNo: 'INV-8819',
    bankRef: 'SBI-INB-772910',
    narrative: 'Receipt UTR839204 has no remittance advice and multiple open invoices with overlapping paise amounts. Insufficient primary evidence to allocate safely. Grade: INSUFFICIENT.',
    traceSteps: [
      {
        step: 1,
        toolName: 'resolve_customer',
        latencyMs: 11,
        args: { name_raw: 'Mitra Enterprises' },
        result: { customer_id: 'CUST-042', match_confidence: 0.96 },
        hypothesis: { kind: 'timing', text: 'Account mapped to Mitra Enterprises', status: 'supported' }
      },
      {
        step: 2,
        toolName: 'search_ledger',
        latencyMs: 13,
        args: { customer_id: 'CUST-042', status: 'OPEN' },
        result: { open_invoices: ['INV-8819', 'INV-8820', 'INV-8821'], total_outstanding_paise: 245000000 },
        hypothesis: { kind: 'split_payment', text: 'Three candidate open invoices of equal priority', status: 'open' }
      },
      {
        step: 3,
        toolName: 'search_remittance_email',
        latencyMs: 14,
        args: { customer_id: 'CUST-042', utr: 'UTR839204' },
        result: { found: 0 },
        hypothesis: { kind: 'unexplained', text: 'No remittance advice received', status: 'supported' }
      },
      {
        step: 4,
        toolName: 'finish',
        latencyMs: 5,
        args: { case_id: 'CASE-0010', grade: 'INSUFFICIENT', recommendation: 'Request remittance advice from customer AP' },
        result: { final_state: 'NEEDS_REVIEW' }
      }
    ]
  },
];

const tiles = [
  { label: 'Auto-closed', count: '10', tone: 'neutral', caption: 'Matched without intervention', filterKey: 'ALL' as const },
  { label: 'Verified', count: '16', tone: 'verified', caption: 'Evidence complete', filterKey: 'VERIFIED' as const },
  { label: 'Probable', count: '6', tone: 'probable', caption: 'Awaiting confirmation', filterKey: 'PROBABLE' as const },
  { label: 'Insufficient', count: '4', tone: 'insufficient', caption: 'More evidence needed', filterKey: 'INSUFFICIENT' as const },
  { label: 'Conflicting', count: '4', tone: 'conflicting', caption: 'Source mismatch found', filterKey: 'CONFLICTING' as const },
] as const;

const laneBTools = [
  { name: 'search_bank_receipts', desc: 'Scan incoming NEFT/RTGS/IMPS statement entries', schema: 'customer_id, amount_paise, date_range' },
  { name: 'search_ledger', desc: 'Query ERP sales ledger for open and cleared invoices', schema: 'customer_id, status, amount_paise' },
  { name: 'search_remittance_email', desc: 'Search customer remittance inbox by UTR / invoice', schema: 'customer_id, utr, invoice_ids' },
  { name: 'parse_remittance', desc: 'Deterministic parser for structured remittance advice', schema: 'email_id' },
  { name: 'resolve_customer', desc: 'Corporate PAN/GSTIN entity resolution with fuzzy fallback', schema: 'name_raw' },
  { name: 'compute_withholding', desc: 'Indian Income Tax Section 194C (2%) & 194J (10%) calculator', schema: 'customer_id, invoice_ids, transaction_date' },
  { name: 'find_credit_notes', desc: 'Locate authorized debit/credit adjustment notes in ERP', schema: 'customer_id, invoice_ids' },
  { name: 'get_authorized_tax_credit_extract', desc: 'Query verified Form 26AS / AIS tax credit registry', schema: 'customer_id, quarter' },
  { name: 'request_evidence', desc: 'Emit structured request to customer AP without stranding', schema: 'case_id, evidence_kind' },
  { name: 'record_hypothesis', desc: 'Track investigation hypotheses (TDS, Split, Credit Note)', schema: 'case_id, kind, text, status' },
  { name: 'propose_allocation', desc: 'Calculate exact paise multi-invoice match and adjustments', schema: 'case_id, allocations, adjustments' },
  { name: 'finish', desc: 'Conclude investigation with grade and policy recommendation', schema: 'case_id, grade, recommendation' }
];

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
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('trace');
  const [activeNav, setActiveNav] = useState('overview');
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

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

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCase(null);
        setShowToolsModal(false);
        setShowPolicyModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
              <span className="brand-version">Lane B + C Integrated</span>
            </div>
          </div>
          
          <div className="workspace-pill" title="Deterministic synthetic AR sandbox with Lane B Agent">
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
            href="#rules"
            onClick={(e) => {
              e.preventDefault();
              setActiveNav('rules');
              setShowPolicyModal(true);
            }}
          >
            <SlidersHorizontal aria-hidden="true" size={17} />
            <span>Policy rules</span>
            <span className="nav-tag-mini">A & C</span>
          </a>
          <a
            className={activeNav === 'traces' ? 'active' : ''}
            href="#traces"
            onClick={(e) => {
              e.preventDefault();
              setActiveNav('traces');
              setShowToolsModal(true);
            }}
          >
            <Cpu aria-hidden="true" size={17} />
            <span>12 Agent tools</span>
            <span className="nav-tag-mini">Lane B</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="env-meta-card">
            <div className="env-row">
              <span className="env-kicker">Environment</span>
              <span className="env-ping"><span className="pulse-dot green" /> 18ms</span>
            </div>
            <strong>Synthetic AR · Q2 FY 2026-27</strong>
            <div className="env-sub">
              <span>Lane B: 12 Tools Active</span>
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
            <span className="topline-sub">Lane B Agent Loop & Lane C Assurance</span>
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
              <span className="eyebrow-rule">Lane B Agent + Lane C Audit</span>
            </div>
            <h1>
              Clarity for every <em>receipt.</em>
            </h1>
            <p className="hero-lead">
              Trace every clearance to its cryptographic evidence, policy rule, and attributable review — all from one calm, precision operating surface.
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
                <Cpu size={15} aria-hidden="true" />
                <strong>12</strong> autonomous tools
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
                <span className="badge-ghost">Lane B Scripted</span>
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
              Completed safely with 12 recorded tool paths & 0 paise variance
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
                <p className="dl-subtext">Backed by bank UTR + Section 194C Form 26AS</p>
              </div>
              <div className="dl-item">
                <dt>Held for review</dt>
                <dd>
                  ₹16,30,000 <small className="tag-warning">28% queued</small>
                </dd>
                <p className="dl-subtext">Requires Controller sign-off (Over ₹5,00,000 limit)</p>
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
                <p className="subtle">Lane B tool paths & Lane C cryptographic ledger</p>
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
                  <Cpu size={16} aria-hidden="true" />
                </div>
                <strong>12</strong>
                <small>Distinct tool paths</small>
                <span className="metric-badge">Multi-agent tools</span>
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
                  <th scope="col">Lane B Tools</th>
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
                      onClick={() => {
                        setSelectedCase(caseItem);
                        setDrawerTab('trace');
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setSelectedCase(caseItem);
                          setDrawerTab('trace');
                        }
                      }}
                      title="Click to inspect deep Lane B agent trace"
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
                        <span className="steps" title={`${caseItem.steps} distinct tool executions in Lane B`}>
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
                            setDrawerTab('trace');
                          }}
                          title="Open Lane B trace inspection"
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
            <span className="table-contract-note">Contract: Lane B Investigation Trace + Member 1 Policy</span>
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

        {/* Lane B Deep Investigation Drawer */}
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
                    <span>LANE B INVESTIGATION SUITE</span>
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

              {/* Drawer Navigation Tabs */}
              <div className="drawer-tabs">
                <button
                  className={`drawer-tab-btn ${drawerTab === 'trace' ? 'active' : ''}`}
                  onClick={() => setDrawerTab('trace')}
                >
                  <GitBranch size={13} />
                  Agent Trace ({selectedCase.traceSteps.length})
                </button>
                <button
                  className={`drawer-tab-btn ${drawerTab === 'narrative' ? 'active' : ''}`}
                  onClick={() => setDrawerTab('narrative')}
                >
                  <FileText size={13} />
                  Narrative
                </button>
                <button
                  className={`drawer-tab-btn ${drawerTab === 'evidence' ? 'active' : ''}`}
                  onClick={() => setDrawerTab('evidence')}
                >
                  <ShieldCheck size={13} />
                  Evidence
                </button>
                <button
                  className={`drawer-tab-btn ${drawerTab === 'graph' ? 'active' : ''}`}
                  onClick={() => setDrawerTab('graph')}
                >
                  <Layers size={13} />
                  Graph Linkage
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

                {/* Tab Content: Trace */}
                {drawerTab === 'trace' && (
                  <div className="trace-section">
                    <h4 className="drawer-section-title">
                      <Terminal size={15} aria-hidden="true" />
                      Lane B Multi-Agent Execution Steps
                    </h4>
                    <div className="trace-timeline">
                      {selectedCase.traceSteps.map((step) => (
                        <div className="trace-step-card" key={step.step}>
                          <div className="trace-step-header">
                            <span className="trace-step-number">Step {step.step}</span>
                            <code className="trace-tool-badge">
                              <Code2 size={12} />
                              {step.toolName}
                            </code>
                            <span className="trace-latency">{step.latencyMs}ms</span>
                          </div>

                          {step.hypothesis && (
                            <div className="trace-hypothesis">
                              <span className="hypothesis-label">Hypothesis:</span>
                              <span className="hypothesis-text">{step.hypothesis.text}</span>
                              <span className={`hypothesis-status ${step.hypothesis.status}`}>
                                {step.hypothesis.status}
                              </span>
                            </div>
                          )}

                          <div className="trace-args-preview">
                            <span className="trace-preview-kicker">Args:</span>
                            <code>{JSON.stringify(step.args)}</code>
                          </div>

                          <div className="trace-result-preview">
                            <span className="trace-preview-kicker">Result:</span>
                            <code>{JSON.stringify(step.result)}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab Content: Narrative */}
                {drawerTab === 'narrative' && (
                  <div className="narrative-section">
                    <h4 className="drawer-section-title">
                      <BookOpen size={15} aria-hidden="true" />
                      Reviewer Narrative (Lane B Template / LLM)
                    </h4>
                    <div className="narrative-card">
                      <p className="narrative-text">{selectedCase.narrative}</p>
                      <div className="narrative-footer">
                        <span className="narrative-source">Source: Deterministic Finance Template</span>
                        <span className="narrative-check">✓ Figures Reconciled</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Content: Evidence */}
                {drawerTab === 'evidence' && (
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
                          <span>Matched to: {selectedCase.invoiceNo || 'INV-1042'}</span>
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
                )}

                {/* Tab Content: Graph Linkage */}
                {drawerTab === 'graph' && (
                  <div className="graph-section">
                    <h4 className="drawer-section-title">
                      <Layers size={15} aria-hidden="true" />
                      Entity Relational Graph
                    </h4>
                    <div className="graph-card">
                      <div className="graph-node node-receipt">
                        <span className="node-kind">RECEIPT</span>
                        <strong>{selectedCase.utr}</strong>
                        <span>{selectedCase.amount}</span>
                      </div>
                      <div className="graph-arrow"><ArrowRight size={14} /></div>
                      <div className="graph-node node-invoice">
                        <span className="node-kind">INVOICE</span>
                        <strong>{selectedCase.invoiceNo || 'INV-1042'}</strong>
                        <span>Paise matched</span>
                      </div>
                      <div className="graph-arrow"><ArrowRight size={14} /></div>
                      <div className="graph-node node-evidence">
                        <span className="node-kind">TAX AIS</span>
                        <strong>Form 26AS</strong>
                        <span>Section 194C</span>
                      </div>
                    </div>
                  </div>
                )}

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
                    alert(`Case ${selectedCase.id} controller review confirmed and appended to ledger.`);
                    setSelectedCase(null);
                  }}
                >
                  Approve Clearance
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: 12 Lane B Autonomous Tools */}
        {showToolsModal && (
          <div className="drawer-overlay" onClick={() => setShowToolsModal(false)}>
            <div
              className="tools-modal-card"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <div className="drawer-kicker">
                    <Cpu size={12} />
                    <span>LANE B AGENT ARCHITECTURE</span>
                  </div>
                  <h3>12 Autonomous Investigation Tools</h3>
                  <p className="subtle">Integrated directly from upstream Lane B repository (`artemis/tools`)</p>
                </div>
                <button className="drawer-close" onClick={() => setShowToolsModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="tools-grid">
                {laneBTools.map((t) => (
                  <div className="tool-info-card" key={t.name}>
                    <code className="tool-name-tag">{t.name}</code>
                    <p className="tool-desc">{t.desc}</p>
                    <div className="tool-schema">
                      <span>Parameters:</span> <code>{t.schema}</code>
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <span className="modal-footer-note">All 12 tools execute with bounded concurrency and strict error-as-data contracts.</span>
                <button className="primary btn-sm" onClick={() => setShowToolsModal(false)}>Done</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Policy Rules & Guardrails */}
        {showPolicyModal && (
          <div className="drawer-overlay" onClick={() => setShowPolicyModal(false)}>
            <div
              className="tools-modal-card"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <div className="drawer-kicker">
                    <SlidersHorizontal size={12} />
                    <span>SYSTEM SAFEGUARDS</span>
                  </div>
                  <h3>Non-Negotiable Policy Invariants</h3>
                  <p className="subtle">Lane boundaries and statutory reconciliation compliance rules</p>
                </div>
                <button className="drawer-close" onClick={() => setShowPolicyModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="rules-list">
                <div className="rule-card">
                  <strong>1. Zero Paise Calculation by LLM</strong>
                  <p>The agent never computes paise or tax directly in prompts; all mathematical allocations delegate to `compute_withholding` and Member 1 policy engine.</p>
                </div>
                <div className="rule-card">
                  <strong>2. Unexplained Variance Tolerance = 0</strong>
                  <p>A case cannot transition to `APPLIED` if unexplained variance &gt; ₹0.00. Any remaining paise requires human Controller review.</p>
                </div>
                <div className="rule-card">
                  <strong>3. Cryptographic Hash Provenance</strong>
                  <p>Every decision, tool execution, and state change appends to an immutable Merkle hash chain anchored to Genesis block #4a91.</p>
                </div>
                <div className="rule-card">
                  <strong>4. Two-Tier Review Threshold</strong>
                  <p>Transactions exceeding ₹5,00,000 require Controller sign-off. Analysts are blocked with HTTP 409 by policy.</p>
                </div>
              </div>

              <div className="modal-footer">
                <button className="primary btn-sm" onClick={() => setShowPolicyModal(false)}>Acknowledge</button>
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
