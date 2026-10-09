"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { LogOut } from "lucide-react";

const links = [
  ["/dashboard", "Overview"],
  ["/dashboard/queues", "Queues"],
  ["/dashboard/appointments", "Appointments"],
  ["/dashboard/settings", "Settings"],
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuthActions();
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">Quiskip</Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {links.map(([href, label]) => <Link key={href} href={href} className={pathname === href ? "font-semibold text-foreground" : "hover:text-foreground"}>{label}</Link>)}
          </nav>
          <button className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => void signOut().then(() => router.push("/"))}><LogOut className="size-4" /><span className="hidden sm:inline">Sign out</span></button>
        </div>
      </header>
      {children}
    </div>
  );
}
