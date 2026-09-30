/**
 * The additive demo layer, gated behind the Settings → Demo data switch.
 *
 * Load-bearing rule: this file only ever ADDS. Every row it writes carries a
 * `demo-` id prefix, and turning the switch off deletes exactly those rows by
 * that prefix. The shipped baseline in lib/seed.ts is never read, mutated or
 * deleted here, so:
 *
 *   - a fresh clone with the switch off looks exactly as the repo ships it
 *   - toggling can never eat seeded or real data
 *   - ON → OFF → ON is idempotent (the prefix delete is total)
 *
 * The id prefix is deliberate rather than a `demo` column on eight tables: the
 * seed already uses `seed-1` / `fc-*` id conventions, so this matches the house
 * style and needs no migration.
 */
import type { FounderDb } from '@/lib/db';
import type { AgentRun, FunnelContact, FunnelTouch } from '@/lib/schemas';

export const DEMO_ID_PREFIX = 'demo-';

type DemoTouch = [FunnelTouch['stage'], FunnelTouch['channel'], string, FunnelTouch['source'], number];

type DemoJourney = {
  id: string;
  name: string;
  venture: FunnelContact['venture'];
  relationship: FunnelContact['relationship'];
  likelihood: number;
  product?: string;
  amountUsd?: number;
  email?: string;
  person?: string;
  company?: string;
  role?: string;
  touches: DemoTouch[];
};

/** Date-only stamp N days back — FunnelTouch.at is validated as YYYY-MM-DD. */
function demoDay(daysBack: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysBack);
  return d.toISOString().slice(0, 10);
}

/**
 * 25 additional clients spread across both ventures and every stage, with
 * touch chains that actually explain how each one got where it is. Companies
 * and people are fictional — real brand names sitting in fabricated pipeline
 * data is what makes a demo read as a lie rather than a demo.
 */
const DEMO_JOURNEYS: DemoJourney[] = [
  // — Vantage (agency retainers + builds) —
  {
    id: 'demo-fc-halden-roe', name: 'Marcus Vaughn', venture: 'vantage',
    relationship: 'hot', likelihood: 100,
    product: 'Vantage — agent install (retainer)', amountUsd: 9500,
    person: 'Marcus Vaughn', company: 'Halden & Roe', role: 'Managing Partner',
    email: 'mvaughn@haldenroe.com',
    touches: [
      ['first_touch', 'organic', 'LinkedIn post: "the 40-hour intake problem"', 'trakyo', 74],
      ['engaged', 'dm', 'DM: "we lose two days a week to intake triage"', 'manual', 70],
      ['nurtured', 'email', 'Sent intake-automation teardown of their own site', 'manual', 66],
      ['opted_in', 'call', 'Scoping call — 3 departments in scope', 'trakyo', 61],
      ['converted', 'checkout', 'Signed 6-month retainer, invoiced via Stripe', 'stripe', 58],
    ],
  },
  {
    id: 'demo-fc-fairmark', name: 'Dana Okonkwo', venture: 'vantage',
    relationship: 'hot', likelihood: 100,
    product: 'Vantage — operating system build', amountUsd: 24000,
    person: 'Dana Okonkwo', company: 'Fairmark Logistics', role: 'COO',
    email: 'd.okonkwo@fairmark.co',
    touches: [
      ['first_touch', 'ads', 'Meta ad: "your dispatchers are doing agent work"', 'meta-ads', 91],
      ['engaged', 'email', 'Downloaded the Operator Stack, replied same day', 'manual', 88],
      ['nurtured', 'call', 'Discovery — 11 dispatchers, 4 handoff systems', 'trakyo', 83],
      ['opted_in', 'crm', 'Proposal sent, legal review with their counsel', 'attio', 77],
      ['converted', 'checkout', 'PO issued — phased build, 40% up front', 'stripe', 71],
    ],
  },
  {
    id: 'demo-fc-brightsill', name: 'Tomas Lindqvist', venture: 'vantage',
    relationship: 'warm', likelihood: 70,
    product: 'Vantage — agent install (retainer)', amountUsd: 7200,
    person: 'Tomas Lindqvist', company: 'Brightsill Dental Group', role: 'Operations Director',
    email: 'tomas@brightsill.dental',
    touches: [
      ['first_touch', 'organic', 'YouTube: "the receptionist that never sleeps"', 'trakyo', 45],
      ['engaged', 'dm', 'Asked whether it handles insurance pre-auth', 'manual', 41],
      ['nurtured', 'email', 'Sent the pre-auth workflow map + a loom', 'manual', 36],
      ['opted_in', 'call', 'Call booked — 9 locations, wants a pilot at 2', 'trakyo', 30],
    ],
  },
  {
    id: 'demo-fc-cabot-iron', name: 'Reina Alvarez', venture: 'vantage',
    relationship: 'warm', likelihood: 60,
    product: 'Vantage — audit', amountUsd: 3500,
    person: 'Reina Alvarez', company: 'Cabot Iron Works', role: 'GM',
    email: 'ralvarez@cabotiron.com',
    touches: [
      ['first_touch', 'organic', 'Referred by Halden & Roe', 'manual', 38],
      ['engaged', 'call', 'Intro call — quoting process is the bottleneck', 'trakyo', 33],
      ['nurtured', 'email', 'Sent quoting-turnaround benchmark', 'manual', 27],
      ['opted_in', 'crm', 'Audit SOW out for signature', 'attio', 19],
    ],
  },
  {
    id: 'demo-fc-pellerin', name: 'Guy Pellerin', venture: 'vantage',
    relationship: 'warm', likelihood: 45,
    product: 'Vantage — agent install (retainer)', amountUsd: 6800,
    person: 'Guy Pellerin', company: 'Pellerin & Fils', role: 'Owner',
    email: 'guy@pellerinfils.fr',
    touches: [
      ['first_touch', 'ads', 'Meta ad, French creative test', 'meta-ads', 52],
      ['engaged', 'dm', 'Wants it to speak French to customers', 'manual', 47],
      ['nurtured', 'email', 'Sent bilingual agent demo recording', 'manual', 40],
    ],
  },
  {
    id: 'demo-fc-northgate', name: 'Ellery Voss', venture: 'vantage',
    relationship: 'cold', likelihood: 30,
    product: 'Vantage — audit', amountUsd: 3500,
    person: 'Ellery Voss', company: 'Northgate Property Co', role: 'Asset Manager',
    email: 'evoss@northgateprop.com',
    touches: [
      ['first_touch', 'organic', 'Newsletter forward from a portfolio contact', 'manual', 24],
      ['engaged', 'email', 'Opened 4x, no reply yet', 'manual', 18],
      ['nurtured', 'email', 'Follow-up: tenant-comms case study', 'manual', 11],
    ],
  },
  {
    id: 'demo-fc-sable-quarry', name: 'Priyanka Rao', venture: 'vantage',
    relationship: 'hot', likelihood: 100,
    product: 'Vantage — operating system build', amountUsd: 18500,
    person: 'Priyanka Rao', company: 'Sable Quarry Holdings', role: 'CFO',
    email: 'prao@sablequarry.com',
    touches: [
      ['first_touch', 'crm', 'Inbound via Attio form — budget stated', 'attio', 63],
      ['engaged', 'call', 'Finance-led: wants reporting automated first', 'trakyo', 59],
      ['nurtured', 'email', 'Sent month-end close teardown', 'manual', 54],
      ['opted_in', 'call', 'Board presentation — approved in the room', 'manual', 48],
      ['converted', 'checkout', 'Signed, kickoff scheduled', 'stripe', 44],
    ],
  },
  {
    id: 'demo-fc-lockridge', name: 'Ben Ashcroft', venture: 'vantage',
    relationship: 'cold', likelihood: 20,
    person: 'Ben Ashcroft', company: 'Lockridge Freight', role: 'Dispatch Lead',
    email: 'bashcroft@lockridgefreight.com',
    touches: [
      ['first_touch', 'ads', 'Meta ad click, no form fill', 'meta-ads', 16],
      ['engaged', 'dm', 'Replied "who are you?" — warming', 'manual', 12],
    ],
  },
  {
    id: 'demo-fc-verity-labs', name: 'Sun-Mi Park', venture: 'vantage',
    relationship: 'warm', likelihood: 65,
    product: 'Vantage — agent install (retainer)', amountUsd: 8400,
    person: 'Sun-Mi Park', company: 'Verity Labs', role: 'Head of Ops',
    email: 'sm.park@veritylabs.io',
    touches: [
      ['first_touch', 'organic', 'Podcast appearance, searched us after', 'trakyo', 57],
      ['engaged', 'email', 'Long reply describing their QA bottleneck', 'manual', 51],
      ['nurtured', 'call', 'Technical call with their platform lead', 'trakyo', 44],
      ['opted_in', 'crm', 'Security review in progress', 'attio', 35],
    ],
  },
  {
    id: 'demo-fc-ravensworth', name: 'Colin Meade', venture: 'vantage',
    relationship: 'hot', likelihood: 90,
    product: 'Vantage — agent install (retainer)', amountUsd: 11000,
    person: 'Colin Meade', company: 'Ravensworth Legal', role: 'Practice Director',
    email: 'cmeade@ravensworth.legal',
    touches: [
      ['first_touch', 'organic', 'Guest post on a legal-ops blog', 'trakyo', 68],
      ['engaged', 'dm', 'Wants matter intake + conflict checks', 'manual', 64],
      ['nurtured', 'email', 'Sent conflict-check automation spec', 'manual', 56],
      ['opted_in', 'call', 'Partner call — verbal yes, awaiting paperwork', 'trakyo', 47],
    ],
  },
  {
    id: 'demo-fc-tidewater', name: 'Aisha Bello', venture: 'vantage',
    relationship: 'warm', likelihood: 55,
    product: 'Vantage — audit', amountUsd: 3500,
    person: 'Aisha Bello', company: 'Tidewater Marine Supply', role: 'Owner',
    email: 'aisha@tidewatermarine.com',
    touches: [
      ['first_touch', 'organic', 'IG reel on inventory agents', 'trakyo', 31],
      ['engaged', 'dm', 'Asked about SKU-level forecasting', 'manual', 26],
      ['nurtured', 'email', 'Sent forecasting pilot outline', 'manual', 20],
    ],
  },
  {
    id: 'demo-fc-ellingham', name: 'Frederick Nwosu', venture: 'vantage',
    relationship: 'cold', likelihood: 15,
    person: 'Frederick Nwosu', company: 'Ellingham Estates', role: 'Director',
    email: 'f.nwosu@ellinghamestates.co.uk',
    touches: [
      ['first_touch', 'ads', 'Meta ad impression → site visit', 'meta-ads', 9],
      ['engaged', 'email', 'Joined the list, no engagement yet', 'manual', 6],
    ],
  },
  {
    id: 'demo-fc-quill-harrow', name: 'Nadia Farouk', venture: 'vantage',
    relationship: 'hot', likelihood: 100,
    product: 'Vantage — operating system build', amountUsd: 21000,
    person: 'Nadia Farouk', company: 'Quill & Harrow', role: 'Founder',
    email: 'nadia@quillharrow.com',
    touches: [
      ['first_touch', 'organic', 'Referral from Sable Quarry', 'manual', 80],
      ['engaged', 'call', 'Intro — wants the whole back office mapped', 'trakyo', 76],
      ['nurtured', 'email', 'Sent full department blueprint', 'manual', 69],
      ['opted_in', 'crm', 'Contract redlined and returned', 'attio', 62],
      ['converted', 'checkout', 'Paid deposit, build underway', 'stripe', 55],
    ],
  },

  // — Launchpad Cohort (mentorship) —
  {
    id: 'demo-fc-devon-reyes', name: 'Devon Reyes', venture: 'launchpad-cohort',
    relationship: 'hot', likelihood: 100,
    product: 'Launchpad Cohort — mentorship (PIF)', amountUsd: 6800,
    touches: [
      ['first_touch', 'organic', 'IG reel: "stop selling hours"', 'trakyo', 42],
      ['engaged', 'dm', 'DM: "doing 4k/mo, drowning in delivery"', 'manual', 39],
      ['nurtured', 'email', 'Day-3 email: the productised-offer swap', 'manual', 35],
      ['opted_in', 'call', 'Strategy call booked via Trakyo', 'trakyo', 31],
      ['converted', 'checkout', 'Paid in full', 'stripe', 29],
    ],
  },
  {
    id: 'demo-fc-marisol-vega', name: 'Marisol Vega', venture: 'launchpad-cohort',
    relationship: 'hot', likelihood: 100,
    product: 'Launchpad Cohort — mentorship (3-pay)', amountUsd: 2600,
    touches: [
      ['first_touch', 'organic', 'TikTok: agency pricing teardown', 'trakyo', 36],
      ['engaged', 'dm', 'Story reply — "this is exactly my problem"', 'manual', 33],
      ['nurtured', 'email', 'Case study: 0 → 18k/mo in 5 months', 'manual', 29],
      ['opted_in', 'call', 'Call held, wants the payment plan', 'trakyo', 25],
      ['converted', 'checkout', 'First of 3 payments cleared', 'stripe', 24],
    ],
  },
  {
    id: 'demo-fc-omar-haddad', name: 'Omar Haddad', venture: 'launchpad-cohort',
    relationship: 'warm', likelihood: 75,
    product: 'Launchpad Cohort — mentorship (3-pay)', amountUsd: 2600,
    touches: [
      ['first_touch', 'organic', 'YouTube long-form on agent stacks', 'trakyo', 28],
      ['engaged', 'email', 'Replied to the welcome sequence', 'manual', 24],
      ['nurtured', 'webinar', 'Attended the live build session, stayed to the end', 'manual', 17],
      ['opted_in', 'call', 'Call booked for next week', 'trakyo', 5],
    ],
  },
  {
    id: 'demo-fc-lena-fitz', name: 'Lena Fitzgerald', venture: 'launchpad-cohort',
    relationship: 'warm', likelihood: 60,
    touches: [
      ['first_touch', 'ads', 'Meta ad: cohort waitlist creative', 'meta-ads', 22],
      ['engaged', 'email', 'On the waitlist, opens every send', 'manual', 19],
      ['nurtured', 'webinar', 'Watched 80% of the replay', 'manual', 13],
    ],
  },
  {
    id: 'demo-fc-tobias-krenn', name: 'Tobias Krenn', venture: 'launchpad-cohort',
    relationship: 'hot', likelihood: 95,
    product: 'Launchpad Cohort — mentorship (PIF)', amountUsd: 6800,
    touches: [
      ['first_touch', 'organic', 'Twitter thread on offer design', 'trakyo', 49],
      ['engaged', 'dm', 'Sent his current offer for a teardown', 'manual', 45],
      ['nurtured', 'email', 'Returned the teardown with 3 fixes', 'manual', 40],
      ['opted_in', 'call', 'Call held — ready, sorting cashflow', 'trakyo', 34],
    ],
  },
  {
    id: 'demo-fc-sasha-boyd', name: 'Sasha Boyd', venture: 'launchpad-cohort',
    relationship: 'cold', likelihood: 25,
    touches: [
      ['first_touch', 'organic', 'Saved an IG carousel', 'trakyo', 15],
      ['engaged', 'email', 'Lead magnet download', 'manual', 12],
    ],
  },
  {
    id: 'demo-fc-ines-duarte', name: 'Inês Duarte', venture: 'launchpad-cohort',
    relationship: 'warm', likelihood: 70,
    product: 'Launchpad Cohort — mentorship (3-pay)', amountUsd: 2600,
    touches: [
      ['first_touch', 'organic', 'Reel: "the 3-call close"', 'trakyo', 26],
      ['engaged', 'dm', 'Asked if it works outside the US', 'manual', 23],
      ['nurtured', 'email', 'Sent two EU student results', 'manual', 18],
      ['opted_in', 'call', 'Booked, reschedule pending', 'trakyo', 8],
    ],
  },
  {
    id: 'demo-fc-grant-whitlock', name: 'Grant Whitlock', venture: 'launchpad-cohort',
    relationship: 'hot', likelihood: 100,
    product: 'Launchpad Cohort — mentorship (PIF)', amountUsd: 6800,
    touches: [
      ['first_touch', 'organic', 'Long-form YouTube, watched twice', 'trakyo', 33],
      ['engaged', 'dm', 'DM with revenue numbers unprompted', 'manual', 30],
      ['nurtured', 'email', 'Sent the delivery-systems module preview', 'manual', 26],
      ['opted_in', 'call', 'Closed on the call', 'trakyo', 21],
      ['converted', 'checkout', 'Paid in full', 'stripe', 21],
    ],
  },
  {
    id: 'demo-fc-yuki-tanabe', name: 'Yuki Tanabe', venture: 'launchpad-cohort',
    relationship: 'warm', likelihood: 50,
    touches: [
      ['first_touch', 'organic', 'Found via search: "productise agency"', 'trakyo', 20],
      ['engaged', 'email', 'Two replies, timezone friction on calls', 'manual', 16],
      ['nurtured', 'email', 'Offered an async teardown instead', 'manual', 10],
    ],
  },
  {
    id: 'demo-fc-abel-mensah', name: 'Abel Mensah', venture: 'launchpad-cohort',
    relationship: 'cold', likelihood: 20,
    touches: [
      ['first_touch', 'ads', 'Cohort ad, cold audience', 'meta-ads', 7],
      ['engaged', 'email', 'Subscribed, first send not opened', 'manual', 4],
    ],
  },
  {
    id: 'demo-fc-clara-boisvert', name: 'Clara Boisvert', venture: 'launchpad-cohort',
    relationship: 'hot', likelihood: 100,
    product: 'Launchpad Cohort — mentorship (3-pay)', amountUsd: 2600,
    touches: [
      ['first_touch', 'organic', 'Reel on firing retainer clients', 'trakyo', 39],
      ['engaged', 'dm', 'Voice-noted her whole situation', 'manual', 36],
      ['nurtured', 'email', 'Sent the transition playbook', 'manual', 32],
      ['opted_in', 'call', 'Call held, wanted to start immediately', 'trakyo', 28],
      ['converted', 'checkout', 'Plan started', 'stripe', 27],
    ],
  },
  {
    id: 'demo-fc-hugo-almeida', name: 'Hugo Almeida', venture: 'launchpad-cohort',
    relationship: 'warm', likelihood: 55,
    touches: [
      ['first_touch', 'organic', 'Shared into a Slack community', 'manual', 23],
      ['engaged', 'webinar', 'Live session attendee, asked 2 questions', 'manual', 17],
      ['nurtured', 'email', 'Follow-up with his answers written up', 'manual', 12],
    ],
  },
];

/**
 * Healthy agent runs.
 *
 * The shipped seed's run history is heavily weighted to failures (39 of 44
 * today), so the home Operating Volume card reads "5 ok · 39 failed" — a
 * business that looks broken rather than busy. These runs are purely additive
 * and mostly successful, so with the switch on the ratio reads like a system
 * that works. Turning it off restores the shipped numbers exactly.
 */
const DEMO_RUN_AGENTS: Array<[id: string, summary: string]> = [
  ['client-roster', 'Reconciled roster against Ledger — 2 clients promoted'],
  ['client-roster', 'Roster sweep: no drift against PayKit'],
  ['comms-agent', 'Triaged 34 inbound, drafted 9 replies'],
  ['comms-agent', 'Cleared the overnight inbox, 2 escalated'],
  ['comms-digest', 'Built the morning digest — 6 items needing a human'],
  ['gmail-worker', 'Labelled and threaded 61 messages'],
  ['sales-agent', 'Advanced 11 deals, booked 3 calls'],
  ['vantage-sales', 'Sent 120 outbound, 7 positive replies'],
  ['launchpad-cohort-sales', 'Followed up 42 cohort applicants'],
  ['crm-pulse', 'Synced 200 Attio records, 181 matched'],
  ['postly-publisher', 'Scheduled 6 posts across 3 platforms'],
  ['social-agent', 'Pulled follower deltas for 5 accounts'],
  ['newsletter-agent', 'Drafted the weekly issue, 1 review note'],
  ['payments-pulse', 'Matched 41 Stripe payouts to invoices'],
  ['stripe-sales', 'Reconciled 18 checkout sessions'],
  ['brand-deal-agent', 'Quoted 2 inbound sponsors, 1 negotiating'],
];

/** One run every ~40 minutes of working hours, 14 days back. */
function demoRunRows(): AgentRun[] {
  const out: AgentRun[] = [];
  let seed = 424242;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000);
  const now = Date.now();
  let n = 0;

  for (let day = 13; day >= 0; day--) {
    const d = new Date(now - day * 86_400_000);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    // Today carries extra weight on purpose: the shipped seed has 39 failed
    // runs stamped today and nothing else, so a normal day's volume still
    // leaves the home card reading mostly-failed. This buries that ratio
    // under a realistic day of work instead of editing the seeded rows.
    const perDay = day === 0 ? 96 + Math.floor(rand() * 14) : weekend ? 6 : 14 + Math.floor(rand() * 6);
    for (let k = 0; k < perDay; k++) {
      const [agentId, summary] = DEMO_RUN_AGENTS[Math.floor(rand() * DEMO_RUN_AGENTS.length)];
      // 09:00–18:00 local-ish, spread across the day
      const start = new Date(d);
      start.setHours(9 + Math.floor(rand() * 9), Math.floor(rand() * 60), 0, 0);
      if (start.getTime() > now) start.setTime(now - 60_000 * (1 + Math.floor(rand() * 90)));
      const durMs = (30 + Math.floor(rand() * 600)) * 1000;
      const tokensIn = 1200 + Math.floor(rand() * 9000);
      const tokensOut = 300 + Math.floor(rand() * 2400);
      out.push({
        id: `demo-run-${n++}`,
        agentId,
        startedAt: start.toISOString(),
        finishedAt: new Date(start.getTime() + durMs).toISOString(),
        // ~4% fail — believable, not suspiciously perfect
        ok: rand() > 0.04,
        summary,
        model: rand() > 0.5 ? 'claude-sonnet-5' : 'claude-haiku-4-5',
        tokensIn,
        tokensOut,
        costUsd: Number(((tokensIn * 3 + tokensOut * 15) / 1_000_000).toFixed(4)),
      });
    }
  }
  return out;
}

/** How many runs the layer adds — surfaced in the Settings copy. */
export function demoRunCount(): number {
  return demoRunRows().length;
}

/** How many clients the layer adds — surfaced in the Settings copy. */
export function demoClientCount(): number {
  return DEMO_JOURNEYS.length;
}

function toContact(j: DemoJourney): FunnelContact {
  return {
    id: j.id,
    name: j.name,
    venture: j.venture,
    status: j.touches[j.touches.length - 1][0],
    product: j.product ?? null,
    amountUsd: j.amountUsd ?? null,
    relationship: j.relationship,
    likelihood: j.likelihood,
    url: null,
    email: j.email ?? null,
    phone: null,
    person: j.person ?? null,
    company: j.company ?? null,
    role: j.role ?? null,
    linkedin: null,
    createdAt: demoDay(j.touches[0][4]),
  };
}

function toTouches(j: DemoJourney): FunnelTouch[] {
  return j.touches.map(([stage, channel, label, source, daysBack], i) => ({
    id: `${j.id}-t${i + 1}`,
    contactId: j.id,
    seq: i + 1,
    stage,
    channel,
    label,
    source,
    at: demoDay(daysBack),
  }));
}

/** Idempotent: clears the layer first, so ON twice is the same as ON once. */
export function applyDemoData(db: FounderDb): void {
  removeDemoData(db);
  for (const j of DEMO_JOURNEYS) {
    db.funnel.insertContact(toContact(j));
    for (const t of toTouches(j)) db.funnel.insertTouch(t);
  }
  for (const r of demoRunRows()) db.agentRuns.insert(r);
}

/** Deletes exactly what applyDemoData wrote, by id prefix. Nothing else. */
export function removeDemoData(db: FounderDb): void {
  db.funnel.deleteByIdPrefix(DEMO_ID_PREFIX);
  db.agentRuns.deleteByIdPrefix(DEMO_ID_PREFIX);
}
