'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AsyncButton } from './AsyncButton';
import { Badge, Label } from './terminal';
import { DEMO_DATA_KEY } from '@/lib/schemas';

/**
 * The demo-data switch. Additive: ON layers example clients on top of the
 * shipped seed, OFF removes exactly those rows again. The server owns the
 * truth (app_settings), so this only reports what came back rather than
 * optimistically flipping and hoping.
 */
export function DemoDataToggle({
  initialOn,
  clientCount,
}: {
  initialOn: boolean;
  clientCount: number;
}) {
  const router = useRouter();
  const [on, setOn] = useState(initialOn);
  const [failed, setFailed] = useState(false);

  async function flip() {
    const next = on ? 'off' : 'on';
    setFailed(false);
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: DEMO_DATA_KEY, value: next }),
    });
    if (!res.ok) {
      setFailed(true);
      return;
    }
    const json = await res.json();
    setOn(json.demoData === 'on');
    // Every surface reads the funnel repo server-side, so the whole OS has to
    // re-render, not just this card.
    router.refresh();
  }

  return (
    <div className="flex items-start justify-between gap-6 border border-os-border bg-os-surface p-4">
      <div className="min-w-0">
        <div className="mb-1.5 flex items-center gap-2">
          <Label>Demo data</Label>
          <Badge tone={on ? 'ok' : 'default'}>{on ? 'ON' : 'OFF'}</Badge>
        </div>
        <p className="max-w-prose text-[12px] leading-relaxed text-os-muted">
          Layers {clientCount} additional example clients across both ventures, each with
          a full touch history, on top of the data that ships with the app. Turning it off
          removes exactly those rows and nothing else, so the shipped seed is never
          touched.
        </p>
      </div>
      <AsyncButton
        run={flip}
        busyLabel={on ? 'removing' : 'adding'}
        doneLabel={on ? 'removed' : 'added'}
        failed={failed}
        tone={on ? 'ghost' : 'primary'}
      >
        {on ? 'Turn off' : 'Turn on'}
      </AsyncButton>
    </div>
  );
}
