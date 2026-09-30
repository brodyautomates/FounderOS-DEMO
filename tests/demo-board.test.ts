import { describe, expect, test } from 'vitest';
import { demoAgents, demoIssues, demoOrg, demoRuns } from '@/lib/demo-board';
import { agentsVolume } from '@/lib/agents-volume';
import { PaperclipAgentSchema, PaperclipIssueSchema, PaperclipOrgNodeSchema, PaperclipRunSchema } from '@/lib/connectors/paperclip';

const NOW = new Date('2026-09-30T18:00:00Z');

describe('demo board payload', () => {
  test('every row validates against the real Paperclip schemas', () => {
    for (const a of demoAgents(NOW)) expect(() => PaperclipAgentSchema.parse(a)).not.toThrow();
    for (const o of demoOrg()) expect(() => PaperclipOrgNodeSchema.parse(o)).not.toThrow();
    for (const i of demoIssues(250, NOW)) expect(() => PaperclipIssueSchema.parse(i)).not.toThrow();
    for (const r of demoRuns(120, NOW)) expect(() => PaperclipRunSchema.parse(r)).not.toThrow();
  });

  test('it is deterministic — a poll must not reshuffle the numbers', () => {
    expect(demoRuns(120, NOW)).toEqual(demoRuns(120, NOW));
  });

  test('runs respect the caller limit, like the real board call', () => {
    expect(demoRuns(30, NOW)).toHaveLength(30);
    expect(demoRuns(120, NOW).length).toBeLessThanOrEqual(120);
  });

  test('the org tree is rooted at a single depth-0 seat', () => {
    const roots = demoOrg().filter((n) => n.depth === 0);
    expect(roots).toHaveLength(1);
    expect(roots[0].parentId).toBeNull();
  });

  test('every non-root seat points at a seat that exists', () => {
    const org = demoOrg();
    const ids = new Set(org.map((n) => n.id));
    for (const n of org.filter((x) => x.depth > 0)) {
      expect(n.parentId).not.toBeNull();
      expect(ids.has(n.parentId as string)).toBe(true);
    }
  });

  test('runs only reference seats that exist', () => {
    const ids = new Set(demoAgents(NOW).map((a) => a.id));
    for (const r of demoRuns(120, NOW)) expect(ids.has(r.agentId)).toBe(true);
  });

  test('every open task lane has at least one issue', () => {
    const v = agentsVolume(
      { connected: true, agents: demoAgents(NOW), issues: demoIssues(250, NOW), runs: demoRuns(120, NOW) },
      NOW,
    );
    for (const lane of v.lanes) expect(lane.count).toBeGreaterThan(0);
  });

  test('the volume card reads populated, not zero', () => {
    const v = agentsVolume(
      { connected: true, agents: demoAgents(NOW), issues: demoIssues(250, NOW), runs: demoRuns(120, NOW) },
      NOW,
    );
    expect(v.headline).toBeGreaterThan(0);
    expect(v.runsInWindow).toBeGreaterThan(50);
    expect(v.bySeat.length).toBeGreaterThan(0);
    expect(v.chips.some((c) => c.text.includes('running'))).toBe(true);
  });

  test('most runs succeed, but not suspiciously all of them', () => {
    const runs = demoRuns(120, NOW);
    const failed = runs.filter((r) => r.status === 'failed').length;
    expect(failed).toBeGreaterThan(0);
    expect(failed / runs.length).toBeLessThan(0.2);
  });

  test('a paused seat has a stale heartbeat, a running seat a fresh one', () => {
    const agents = demoAgents(NOW);
    const paused = agents.find((a) => a.status === 'paused');
    const running = agents.find((a) => a.status === 'running');
    const age = (iso: string | null) => NOW.getTime() - new Date(iso as string).getTime();
    expect(age(paused!.lastHeartbeatAt)).toBeGreaterThan(86_400_000);
    expect(age(running!.lastHeartbeatAt)).toBeLessThan(3_600_000);
  });
});
