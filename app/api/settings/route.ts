import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/data';
import { DEMO_DATA_KEY } from '@/lib/schemas';
import { applyDemoData, removeDemoData, demoClientCount } from '@/lib/seed-demo';

export const dynamic = 'force-dynamic';

/**
 * App-level preferences. Today that is one switch: the demo-data layer.
 *
 * The layer is additive by design — ON inserts `demo-` prefixed rows on top of
 * the shipped seed, OFF deletes exactly those rows again. The baseline in
 * lib/seed.ts is never touched, so a fresh clone still looks alive with the
 * switch off and toggling can never eat real or seeded data.
 */

const Body = z.object({
  key: z.string().min(1),
  value: z.string(),
});

export async function GET() {
  const db = getDb();
  return NextResponse.json({
    settings: db.settings.all(),
    demoData: db.settings.isDemoDataOn() ? 'on' : 'off',
    demoClients: demoClientCount(),
  });
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'bad body' }, { status: 400 });
  }
  const { key, value } = parsed.data;

  const db = getDb();

  // The demo switch is the one setting with a side effect: it writes or clears
  // the additive layer as well as recording the preference.
  if (key === DEMO_DATA_KEY) {
    if (value !== 'on' && value !== 'off') {
      return NextResponse.json({ ok: false, error: "expected 'on' or 'off'" }, { status: 400 });
    }
    if (value === 'on') applyDemoData(db);
    else removeDemoData(db);
  }

  db.settings.set(key, value);
  return NextResponse.json({
    ok: true,
    setting: db.settings.get(key),
    demoData: db.settings.isDemoDataOn() ? 'on' : 'off',
  });
}
