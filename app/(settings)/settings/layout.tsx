import Link from "next/link";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl gap-10 px-4 py-10 sm:px-6">
      <aside className="hidden w-48 shrink-0 space-y-1 md:block">
        <h1 className="mb-4 text-lg font-semibold">Settings</h1>
        <Link href="/settings" className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">Overview</Link>
        <Link href="/settings/profile" className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">Profile</Link>
        <Link href="/settings/security" className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">Security</Link>
        <Link href="/settings/notifications" className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">Notifications</Link>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </main>
  );
}
