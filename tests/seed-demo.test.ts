import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { openDb, type FounderDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { applyDemoData, removeDemoData, demoClientCount, DEMO_ID_PREFIX } from '@/lib/seed-demo';

let db: FounderDb;

beforeEach(() => {
  db = openDb(':memory:');
  seedDatabase(db);
});

afterEach(() => {
  db?.close();
});

const baseline = (d: FounderDb) => d.funnel.journeys().length;

describe('demo data layer', () => {
  test('the layer adds clients on top of the shipped seed', () => {
    const before = baseline(db);
    applyDemoData(db);
    expect(baseline(db)).toBe(before + demoClientCount());
  });

  test('off restores the baseline exactly', () => {
    const before = baseline(db);
    applyDemoData(db);
    removeDemoData(db);
    expect(baseline(db)).toBe(before);
  });

  test('on is idempotent — twice is the same as once', () => {
    applyDemoData(db);
    const once = baseline(db);
    applyDemoData(db);
    expect(baseline(db)).toBe(once);
  });

  test('on/off/on returns to the same populated count', () => {
    applyDemoData(db);
    const on = baseline(db);
    removeDemoData(db);
    applyDemoData(db);
    expect(baseline(db)).toBe(on);
  });

  test('off on a database that never had the layer is a no-op', () => {
    const before = baseline(db);
    removeDemoData(db);
    expect(baseline(db)).toBe(before);
  });

  test('every row the layer adds carries the demo id prefix', () => {
    const before = new Set(db.funnel.journeys().map((j) => j.id));
    applyDemoData(db);
    const added = db.funnel.journeys().filter((j) => !before.has(j.id));
    expect(added).toHaveLength(demoClientCount());
    for (const j of added) expect(j.id.startsWith(DEMO_ID_PREFIX)).toBe(true);
  });

  test('it never mutates a seeded row', () => {
    const before = JSON.stringify(
      db.funnel.journeys().filter((j) => !j.id.startsWith(DEMO_ID_PREFIX)),
    );
    applyDemoData(db);
    const after = JSON.stringify(
      db.funnel.journeys().filter((j) => !j.id.startsWith(DEMO_ID_PREFIX)),
    );
    expect(after).toBe(before);
  });

  test('demo clients carry touch chains, not bare contacts', () => {
    applyDemoData(db);
    const demo = db.funnel.journeys().filter((j) => j.id.startsWith(DEMO_ID_PREFIX));
    for (const j of demo) {
      expect(j.touches.length).toBeGreaterThanOrEqual(2);
      // chronological, and the contact's status matches the furthest stage
      const seqs = j.touches.map((t) => t.seq);
      expect(seqs).toEqual([...seqs].sort((a, b) => a - b));
    }
  });

  test('both ventures are represented', () => {
    applyDemoData(db);
    const demo = db.funnel.journeys().filter((j) => j.id.startsWith(DEMO_ID_PREFIX));
    const ventures = new Set(demo.map((j) => j.venture));
    expect(ventures.has('vantage')).toBe(true);
    expect(ventures.has('launchpad-cohort')).toBe(true);
  });

  test('deleteByIdPrefix refuses an empty prefix', () => {
    expect(() => db.funnel.deleteByIdPrefix('')).toThrow();
  });
});
