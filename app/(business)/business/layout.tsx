"use client";

import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { signOut } = useAuthActions();
  const router = useRouter();
  return (
    <div className="min-h-screen  bg-muted/20">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/business" className="text-xl font-bold tracking-tight">
            Quiskip
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
            <Link href="/business" className="hover:text-foreground">
              Businesses
            </Link>
            <Link href="/app" className="hover:text-foreground">
              Customer app
            </Link>
            <Link href="/settings" className="hover:text-foreground">
              Settings
            </Link>
          </nav>
          <button
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => void signOut().then(() => router.push("/"))}
          >
            <LogOut className="size-4" />{" "}
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
