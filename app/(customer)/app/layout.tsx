"use client";

import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuthActions();
  const router = useRouter();
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/app" className="text-xl font-bold tracking-tight">Quiskip</Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/app/appointments" className="hover:text-foreground">Appointments</Link>
            <Link href="/app/profile" className="hover:text-foreground">Profile</Link>
            <button onClick={() => void signOut().then(() => router.push("/"))} className="hover:text-foreground">Sign out</button>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
