import { afterEach, describe, expect, test } from 'vitest';
import { openDb, type FounderDb } from '@/lib/db';
import { DEMO_DATA_KEY } from '@/lib/schemas';

let db: FounderDb;

afterEach(() => {
  db?.close();
});

describe('settings repo', () => {
  test('a fresh database has no settings', () => {
    db = openDb(':memory:');
    expect(db.settings.all()).toEqual([]);
    expect(db.settings.get(DEMO_DATA_KEY)).toBeNull();
  });

  test('set then get round-trips a value', () => {
    db = openDb(':memory:');
    db.settings.set(DEMO_DATA_KEY, 'on');
    expect(db.settings.get(DEMO_DATA_KEY)?.value).toBe('on');
  });

  test('set on an existing key overwrites rather than duplicating', () => {
    db = openDb(':memory:');
    db.settings.set(DEMO_DATA_KEY, 'on');
    db.settings.set(DEMO_DATA_KEY, 'off');
    expect(db.settings.all()).toHaveLength(1);
    expect(db.settings.get(DEMO_DATA_KEY)?.value).toBe('off');
  });

  test('every row carries an updatedAt stamp', () => {
    db = openDb(':memory:');
    db.settings.set(DEMO_DATA_KEY, 'on');
    const row = db.settings.get(DEMO_DATA_KEY);
    expect(row?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('unrelated keys coexist', () => {
    db = openDb(':memory:');
    db.settings.set(DEMO_DATA_KEY, 'on');
    db.settings.set('some-other-pref', 'value');
    expect(db.settings.all()).toHaveLength(2);
    expect(db.settings.get(DEMO_DATA_KEY)?.value).toBe('on');
  });

  test('demo data defaults to off when unset', () => {
    db = openDb(':memory:');
    expect(db.settings.isDemoDataOn()).toBe(false);
  });

  test('isDemoDataOn reflects the stored value', () => {
    db = openDb(':memory:');
    db.settings.set(DEMO_DATA_KEY, 'on');
    expect(db.settings.isDemoDataOn()).toBe(true);
    db.settings.set(DEMO_DATA_KEY, 'off');
    expect(db.settings.isDemoDataOn()).toBe(false);
  });
});
