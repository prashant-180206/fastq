import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Quiskip
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/discover"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Discover
            </Link>

            <Link
              href="#how-it-works"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              How it works
            </Link>

            <Link
              href="#businesses"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              For businesses
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden sm:inline-flex">
              <Link href="/auth/sign-in">Sign in</Link>
            </Button>

            <Button>
              <Link href="/auth/sign-up">
                Get started
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="font-semibold">Quiskip</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Queue and appointment management, without the wait.
            </p>
          </div>

          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/discover" className="hover:text-foreground">
              Discover
            </Link>

            <Link href="/auth/sign-in" className="hover:text-foreground">
              Sign in
            </Link>

            <Link href="/auth/sign-up" className="hover:text-foreground">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
