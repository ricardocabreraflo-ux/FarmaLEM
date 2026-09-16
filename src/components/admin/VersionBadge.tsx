import { APP_VERSION } from "@/lib/app-version";

export function VersionBadge() {
  return (
    <span className="fixed bottom-3 right-3 z-30 rounded-full border border-admin-border bg-admin-surface/90 px-2.5 py-1 text-[0.7rem] font-semibold text-admin-ink-soft shadow-sm backdrop-blur">
      v{APP_VERSION}
    </span>
  );
}
