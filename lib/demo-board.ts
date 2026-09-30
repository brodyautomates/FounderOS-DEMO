/**
 * Demo Paperclip board, served when Settings → Demo data is on.
 *
 * /agents, /org, /tasks and /chats do not read the database — they read the
 * Paperclip harness over the network (PAPERCLIP_API_URL + board key). With no
 * board reachable those surfaces render honest zeros, which is right for real
 * operation and useless for a demo. This module supplies a board-shaped
 * payload instead, so the toggle populates the connector-backed views the same
 * way lib/seed-demo.ts populates the DB-backed ones.
 *
 * Everything here is generated from a fixed seed, so the numbers are stable
 * across reloads rather than jittering every poll.
 */
import type {
  PaperclipAgent,
  PaperclipIssue,
  PaperclipOrgNode,
  PaperclipRun,
} from '@/lib/connectors/paperclip';

/** Deterministic PRNG — a demo that reshuffles on every poll reads as broken. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

type Seat = {
  id: string;
  name: string;
  role: string;
  status: PaperclipAgent['status'];
  model: string;
  /** relative run share — leads supervise, workers grind */
  weight: number;
  parentId: string | null;
  depth: number;
};

const SEATS: Seat[] = [
  { id: 'conductor', name: 'Conductor', role: 'Chief of Staff', status: 'running', model: 'claude-opus-5', weight: 6, parentId: null, depth: 0 },

  { id: 'lead-sales', name: 'Sales Lead', role: 'Pipeline owner', status: 'running', model: 'claude-opus-5', weight: 5, parentId: 'conductor', depth: 1 },
  { id: 'lead-growth', name: 'Growth Lead', role: 'Marketing owner', status: 'idle', model: 'claude-opus-5', weight: 4, parentId: 'conductor', depth: 1 },
  { id: 'lead-tech', name: 'Tech Lead', role: 'Build owner', status: 'running', model: 'claude-opus-5', weight: 5, parentId: 'conductor', depth: 1 },
  { id: 'lead-finance', name: 'Finance Lead', role: 'Ledger owner', status: 'idle', model: 'claude-sonnet-5', weight: 3, parentId: 'conductor', depth: 1 },
  { id: 'lead-comms', name: 'Comms Lead', role: 'Inbox owner', status: 'running', model: 'claude-sonnet-5', weight: 5, parentId: 'conductor', depth: 1 },

  { id: 'w-outbound', name: 'Outbound Runner', role: 'Cold outreach', status: 'running', model: 'claude-sonnet-5', weight: 9, parentId: 'lead-sales', depth: 2 },
  { id: 'w-enrich', name: 'Lead Enricher', role: 'List building', status: 'idle', model: 'claude-haiku-4-5', weight: 8, parentId: 'lead-sales', depth: 2 },
  { id: 'w-publisher', name: 'Content Publisher', role: 'Scheduling', status: 'running', model: 'claude-sonnet-5', weight: 7, parentId: 'lead-growth', depth: 2 },
  { id: 'w-inbox', name: 'Inbox Triage', role: 'Reply drafting', status: 'running', model: 'claude-haiku-4-5', weight: 10, parentId: 'lead-comms', depth: 2 },
  { id: 'w-reconcile', name: 'Ledger Reconciler', role: 'Payments match', status: 'error', model: 'claude-sonnet-5', weight: 4, parentId: 'lead-finance', depth: 2 },
  { id: 'w-qa', name: 'Build QA', role: 'Regression sweeps', status: 'paused', model: 'claude-sonnet-5', weight: 3, parentId: 'lead-tech', depth: 2 },
];

const hoursAgo = (h: number, now: Date) => new Date(now.getTime() - h * 3_600_000).toISOString();

export function demoAgents(now: Date = new Date()): PaperclipAgent[] {
  return SEATS.map((s, i) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    adapterType: 'claude_local',
    model: s.model,
    // A running seat beat recently; a paused one has not beaten in a while.
    lastHeartbeatAt:
      s.status === 'paused' ? hoursAgo(30, now) : hoursAgo(s.status === 'running' ? 0.1 + i * 0.05 : 2 + i * 0.4, now),
  }));
}

export function demoOrg(): PaperclipOrgNode[] {
  return SEATS.map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    status: s.status,
    depth: s.depth,
    parentId: s.parentId,
  }));
}

/**
 * Runs across the last 14 days — the window /agents charts. Weighted per seat
 * so the runs-by-seat matrix has a real shape, with a believable failure rate
 * and a handful still in flight.
 */
export function demoRuns(limit = 120, now: Date = new Date()): PaperclipRun[] {
  const rand = rng(20260930);
  const out: PaperclipRun[] = [];
  const DAYS = 14;
  const pool = SEATS.flatMap((s) => Array(s.weight).fill(s) as Seat[]);

  let n = 0;
  for (let day = DAYS - 1; day >= 0; day--) {
    // Weekdays busier than weekends; recent days busier than old ones.
    const d = new Date(now);
    d.setDate(d.getDate() - day);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const base = weekend ? 3 : 8;
    const perDay = base + Math.floor(rand() * 4) + (day < 4 ? 2 : 0);

    for (let k = 0; k < perDay; k++) {
      const seat = pool[Math.floor(rand() * pool.length)];
      const hourOffset = day * 24 - (6 + rand() * 12); // working hours-ish
      const startedAt = hoursAgo(Math.max(hourOffset, 0.05), now);
      const roll = rand();
      // ~8% fail, ~4% still running, rest succeed
      const status = roll < 0.08 ? 'failed' : roll < 0.12 && day === 0 ? 'running' : 'succeeded';
      const durMin = 2 + Math.floor(rand() * 26);
      out.push({
        id: `demo-board-run-${n++}`,
        agentId: seat.id,
        agentName: seat.name,
        status,
        startedAt,
        finishedAt:
          status === 'running'
            ? null
            : new Date(new Date(startedAt).getTime() + durMin * 60_000).toISOString(),
      });
    }
  }

  // Newest first, matching the board's ordering, then capped like the real call.
  out.sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''));
  return out.slice(0, limit);
}

type IssueSpec = [status: string, title: string, assignee: string | null, hoursBack: number];

/** Tasks across every lane the board renders, so none collapse to empty. */
const ISSUES: IssueSpec[] = [
  ['in_progress', 'Draft the Fairmark phase-2 scope', 'Tech Lead', 2],
  ['in_progress', 'Chase Ravensworth paperwork', 'Sales Lead', 4],
  ['in_progress', 'Rewrite the cohort welcome sequence', 'Growth Lead', 6],
  ['in_progress', 'Reconcile September Stripe payouts', 'Ledger Reconciler', 9],
  ['in_progress', 'Triage the weekend inbox backlog', 'Inbox Triage', 1],

  ['in_review', 'Halden & Roe intake automation spec', 'Tech Lead', 12],
  ['in_review', 'Q4 outbound sequence copy', 'Growth Lead', 18],
  ['in_review', 'Sable Quarry month-end close map', 'Finance Lead', 26],
  ['review', 'Brightsill pre-auth workflow diagram', 'Tech Lead', 31],

  ['todo', 'Book the Tidewater forecasting pilot call', 'Sales Lead', 20],
  ['todo', 'Refresh the Operator Stack lead magnet', 'Growth Lead', 27],
  ['todo', 'Set up Verity Labs security questionnaire', 'Tech Lead', 34],
  ['todo', 'Quote Cabot Iron on the audit', 'Sales Lead', 40],
  ['todo', 'Write the Quill & Harrow kickoff brief', 'Conductor', 44],
  ['todo', 'Chase Pellerin on the bilingual demo', 'Outbound Runner', 52],
  ['todo', 'Rebuild the cohort waitlist ad creative', 'Growth Lead', 58],

  ['blocked', 'Ledger reconciler keeps timing out on Stripe', 'Ledger Reconciler', 8],
  ['blocked', 'Waiting on Northgate to return the NDA', 'Sales Lead', 46],
  ['blocked', 'Verity Labs security review with their CISO', 'Tech Lead', 62],

  ['backlog', 'Migrate the brand-deal tracker off the spreadsheet', null, 70],
  ['backlog', 'Automate the weekly investor update', null, 78],
  ['backlog', 'Build the churn-risk scoring pass', null, 86],
  ['backlog', 'Consolidate the three outreach inboxes', null, 94],
  ['backlog', 'Spec the referral engine', null, 102],
  ['backlog', 'Retire the legacy proposal template', null, 110],

  ['done', 'Close Marcus Vaughn on the retainer', 'Sales Lead', 14],
  ['done', 'Ship the Fairmark dispatcher agent', 'Tech Lead', 22],
  ['done', 'Publish the pricing teardown reel', 'Content Publisher', 29],
  ['done', 'Invoice Sable Quarry deposit', 'Finance Lead', 36],
  ['done', 'Onboard Devon Reyes to the cohort', 'Conductor', 42],
  ['done', 'Clear the 200-email inbox backlog', 'Inbox Triage', 50],
  ['done', 'Enrich the 400-lead logistics list', 'Lead Enricher', 56],
  ['done', 'Run the pre-release regression sweep', 'Build QA', 64],
  ['done', 'Close Grant Whitlock PIF', 'Sales Lead', 72],
  ['done', 'Ship the cohort payment-plan checkout', 'Tech Lead', 80],

  ['cancelled', 'Cold-call script rewrite (superseded)', null, 88],
];

export function demoIssues(limit = 250, now: Date = new Date()): PaperclipIssue[] {
  return ISSUES.slice(0, limit).map(([status, title, assigneeName, hoursBack], i) => ({
    id: `demo-issue-${i}`,
    identifier: `OS-${101 + i}`,
    title,
    status,
    assigneeName,
    updatedAt: hoursAgo(hoursBack, now),
  }));
}
