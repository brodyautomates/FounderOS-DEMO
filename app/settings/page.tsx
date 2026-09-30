import { PageHeader } from '@/components/PageHeader';
import { SectionHead } from '@/components/terminal';
import { DemoDataToggle } from '@/components/DemoDataToggle';
import { getDb } from '@/lib/data';
import { demoClientCount, demoRunCount } from '@/lib/seed-demo';

export const dynamic = 'force-dynamic';

/**
 * App preferences. Read server-side from app_settings so the switch renders in
 * its real position on first paint rather than flashing the default.
 */
export default function SettingsPage() {
  const demoOn = getDb().settings.isDemoDataOn();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="// system" title="Settings" />

      <section className="mb-8">
        <SectionHead label="Data" />
        <DemoDataToggle initialOn={demoOn} clientCount={demoClientCount()} runCount={demoRunCount()} />
      </section>

      <section>
        <SectionHead label="Appearance" />
        <div className="border border-os-border bg-os-surface p-4">
          <p className="text-[12px] leading-relaxed text-os-muted">
            The theme picker lives in the top bar, on the right of the breadcrumb. Your
            choice is remembered in this browser.
          </p>
        </div>
      </section>
    </div>
  );
}
